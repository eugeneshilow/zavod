// Instagram Platform API (Business Login for Instagram) — чистый сервис без
// Convex ctx, тестируемый с моками fetch. Публикация роликов и картинок: контейнер,
// ожидание обработки, media_publish, permalink, insights, лимит публикаций,
// продление long-lived токена. Канон зоны — docs/publish.md.
// Каркас снят с рельсы проекта vibecoding-ru (convex/services/instagram.ts).

const GRAPH = "https://graph.instagram.com/v23.0";
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const TIMEOUT_MS = 30_000;
const DAY_MS = 86_400_000;

async function postForm(
  url: string,
  fields: Record<string, string>,
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams(fields);
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(igError(json, response.status));
  return json;
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(igError(json, response.status));
  return json;
}

/** Человекочитаемая ошибка Graph API: вложенный error, плоский oauth-формат, голый HTTP. */
export function igError(json: Record<string, unknown>, status: number): string {
  const err = json?.error as { message?: string; code?: number } | undefined;
  if (err?.message) return `Instagram API ${err.code ?? status}: ${err.message}`;
  const flat = json?.error_message;
  if (typeof flat === "string" && flat) return `Instagram API ${status}: ${flat}`;
  return `Instagram API HTTP ${status}`;
}

/**
 * Продлеваем long-lived токен, когда он старше суток, ещё жив и истекает в
 * ближайшие 10 дней. Раньше суток Meta откажет; после смерти нужен новый вход.
 */
export function shouldRefreshToken(args: {
  now: number;
  expiresAt: number;
  refreshedAt: number;
}): boolean {
  const { now, expiresAt, refreshedAt } = args;
  const olderThan24h = now - refreshedAt > DAY_MS;
  const stillAlive = now < expiresAt;
  const expiringWithin10d = expiresAt - now < 10 * DAY_MS;
  return stillAlive && olderThan24h && expiringWithin10d;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type IgMe = { id: string; username: string; accountType: string | null };

/** Профиль владельца токена. null — токен невалиден или протух. */
export async function getMe(token: string): Promise<IgMe | null> {
  try {
    const json = await getJson(
      `${GRAPH}/me?fields=user_id,username,account_type&access_token=${encodeURIComponent(token)}`,
    );
    const id = json.user_id ?? json.id;
    if (typeof id === "string" || typeof id === "number") {
      return {
        id: String(id),
        username: String(json.username ?? ""),
        accountType: typeof json.account_type === "string" ? json.account_type : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Число подписчиков; ошибка прав остаётся диагностируемой и пробрасывается. */
export async function getFollowersCount(token: string): Promise<number | null> {
  try {
    const json = await getJson(
      `${GRAPH}/me?fields=followers_count&access_token=${encodeURIComponent(token)}`,
    );
    return typeof json.followers_count === "number" && Number.isFinite(json.followers_count)
      ? json.followers_count
      : null;
  } catch (error) {
    if (isPermissionError(error)) throw error;
    return null;
  }
}

/** Продлить long-lived токен (валиден: токену больше суток и он ещё жив). */
export async function refreshLongLivedToken(
  token: string,
): Promise<{ accessToken: string; expiresInSec: number }> {
  const json = await getJson(
    `${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
  );
  const accessToken = json.access_token;
  const expiresIn = json.expires_in;
  if (typeof accessToken !== "string" || typeof expiresIn !== "number") {
    throw new Error("Instagram refresh: ответ без access_token/expires_in");
  }
  return { accessToken, expiresInSec: expiresIn };
}

/** Что публикуем: вертикальный ролик или одиночная картинка. */
export type MediaKind = "REELS" | "IMAGE";

export type MediaInput = {
  /** Публичный адрес файла: видео для REELS, картинка для IMAGE. */
  fileUrl: string;
  /** По умолчанию ролик. */
  mediaType?: MediaKind;
  caption?: string;
  /** Самодекларация ИИ-контента: материал этого проекта машинный. */
  isAiGenerated?: boolean;
};

/**
 * Поля контейнера для Graph API. Ролик едет как media_type=REELS с video_url;
 * картинка — просто image_url, media_type у неё не передаётся вовсе.
 */
export function containerFields(token: string, input: MediaInput): Record<string, string> {
  const fields: Record<string, string> = { access_token: token };
  if (input.mediaType === "IMAGE") {
    fields.image_url = input.fileUrl;
  } else {
    fields.media_type = "REELS";
    fields.video_url = input.fileUrl;
  }
  if (input.caption) fields.caption = input.caption;
  if (input.isAiGenerated) fields.is_ai_generated = "true";
  return fields;
}

/** Создать контейнер. Адрес файла публичный: Meta выкачивает его сама. */
export async function createMediaContainer(token: string, input: MediaInput): Promise<string> {
  const json = await postForm(`${GRAPH}/me/media`, containerFields(token, input));
  const id = json.id;
  if (typeof id !== "string") throw new Error("Instagram: контейнер без id");
  return id;
}

/**
 * Ждать обработку контейнера до FINISHED: видео Meta обрабатывает асинхронно.
 * Дефолт 18 попыток по 15 секунд, чтобы уложиться в лимит Convex-экшена.
 */
export async function pollContainerReady(
  token: string,
  containerId: string,
  opts: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
  const attempts = opts.attempts ?? 18;
  const delayMs = opts.delayMs ?? 15_000;
  for (let i = 0; i < attempts; i++) {
    const json = await getJson(
      `${GRAPH}/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
    );
    const status = json.status_code;
    if (status === "FINISHED" || status === "PUBLISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Instagram media container ${String(status)}`);
    }
    await sleep(delayMs);
  }
  throw new Error("Instagram media container не дошёл до FINISHED");
}

/** Опубликовать готовый контейнер. Возвращает id медиа. */
export async function publishContainer(token: string, creationId: string): Promise<string> {
  const json = await postForm(`${GRAPH}/me/media_publish`, {
    creation_id: creationId,
    access_token: token,
  });
  const id = json.id;
  if (typeof id !== "string") throw new Error("Instagram: публикация без id");
  return id;
}

export async function getPermalink(token: string, mediaId: string): Promise<string | null> {
  try {
    const json = await getJson(
      `${GRAPH}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(token)}`,
    );
    return typeof json.permalink === "string" ? json.permalink : null;
  } catch {
    return null;
  }
}

export type PublishingLimit = { quotaUsage: number; quotaTotal: number };

/** Расход лимита публикаций: 100 постов через API на аккаунт за 24 часа. */
export async function getPublishingLimit(token: string): Promise<PublishingLimit | null> {
  try {
    const json = await getJson(
      `${GRAPH}/me/content_publishing_limit?fields=quota_usage,config&access_token=${encodeURIComponent(token)}`,
    );
    const data = Array.isArray(json.data)
      ? (json.data as Array<Record<string, unknown>>)[0]
      : undefined;
    if (!data) return null;
    const config = data.config as { quota_total?: number } | undefined;
    return {
      quotaUsage: typeof data.quota_usage === "number" ? data.quota_usage : 0,
      quotaTotal: typeof config?.quota_total === "number" ? config.quota_total : 100,
    };
  } catch {
    return null;
  }
}

export type IgMediaItem = {
  id: string;
  mediaType: string | null;
  mediaProductType: string | null;
  permalink: string | null;
  caption: string | null;
  timestamp: number | null;
};

/** Последние медиа аккаунта, включая опубликованные руками. */
export async function getRecentMedia(
  token: string,
  opts: { limit?: number } = {},
): Promise<IgMediaItem[]> {
  const json = await getJson(
    `${GRAPH}/me/media?fields=id,media_type,media_product_type,permalink,caption,timestamp&limit=${opts.limit ?? 25}&access_token=${encodeURIComponent(token)}`,
  );
  const data = Array.isArray(json.data) ? (json.data as Array<Record<string, unknown>>) : [];
  return data.flatMap((item) => {
    if (typeof item.id !== "string") return [];
    const parsedTimestamp =
      typeof item.timestamp === "string" ? Date.parse(item.timestamp) : Number.NaN;
    return [
      {
        id: item.id,
        mediaType: typeof item.media_type === "string" ? item.media_type : null,
        mediaProductType:
          typeof item.media_product_type === "string" ? item.media_product_type : null,
        permalink: typeof item.permalink === "string" ? item.permalink : null,
        caption: typeof item.caption === "string" ? item.caption : null,
        timestamp: Number.isFinite(parsedTimestamp) ? parsedTimestamp : null,
      },
    ];
  });
}

export type IgMediaMetrics = {
  views?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  saved?: number;
  shares?: number;
  totalInteractions?: number;
  avgWatchTimeMs?: number;
  videoViewTotalTimeMs?: number;
};

const INSIGHT_METRICS = [
  "views",
  "reach",
  "likes",
  "comments",
  "saved",
  "shares",
  "total_interactions",
] as const;

const REELS_INSIGHT_METRICS = [
  ...INSIGHT_METRICS,
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
] as const;

const INSIGHT_KEYS: Record<string, keyof IgMediaMetrics> = {
  views: "views",
  reach: "reach",
  likes: "likes",
  comments: "comments",
  saved: "saved",
  shares: "shares",
  total_interactions: "totalInteractions",
  ig_reels_avg_watch_time: "avgWatchTimeMs",
  ig_reels_video_view_total_time: "videoViewTotalTimeMs",
};

async function requestMediaInsights(
  token: string,
  mediaId: string,
  metrics: readonly string[],
): Promise<Record<string, unknown>> {
  return await getJson(
    `${GRAPH}/${encodeURIComponent(mediaId)}/insights?metric=${metrics.join(",")}&access_token=${encodeURIComponent(token)}`,
  );
}

function isUnsupportedMetricError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Instagram API 100:/i.test(message) && /metric/i.test(message);
}

export function isPermissionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /permission|#10/i.test(message);
}

/** Insights медиа; не-Reels и старые ответы ретраятся без reels-only метрик. */
export async function getMediaInsights(
  token: string,
  mediaId: string,
): Promise<IgMediaMetrics | null> {
  let json: Record<string, unknown>;
  try {
    json = await requestMediaInsights(token, mediaId, REELS_INSIGHT_METRICS);
  } catch (error) {
    if (isPermissionError(error) || !isUnsupportedMetricError(error)) throw error;
    json = await requestMediaInsights(token, mediaId, INSIGHT_METRICS);
  }

  if (!Array.isArray(json.data) || json.data.length === 0) return null;
  const metrics: IgMediaMetrics = {};
  for (const item of json.data as Array<Record<string, unknown>>) {
    if (typeof item.name !== "string") continue;
    const key = INSIGHT_KEYS[item.name];
    if (!key || !Array.isArray(item.values)) continue;
    const first = item.values[0] as Record<string, unknown> | undefined;
    const value = first?.value;
    if (typeof value === "number" && Number.isFinite(value)) metrics[key] = value;
  }
  return metrics;
}

export type PostedMedia = { mediaId: string; permalink: string | null };

/**
 * Полный цикл публикации: контейнер, ожидание готовности, публикация, ссылка.
 * Картинка готовится быстрее ролика, но опрашивается тем же поллингом —
 * так один путь и для видео, и для фото. Вызывается крон-воркером.
 */
export async function publishMedia(
  token: string,
  input: MediaInput,
  opts: { attempts?: number; delayMs?: number } = {},
): Promise<PostedMedia> {
  const containerId = await createMediaContainer(token, input);
  await pollContainerReady(token, containerId, opts);
  const mediaId = await publishContainer(token, containerId);
  const permalink = await getPermalink(token, mediaId);
  return { mediaId, permalink };
}
