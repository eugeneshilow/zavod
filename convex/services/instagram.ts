// Instagram Platform API (Business Login for Instagram) — чистый сервис без
// Convex ctx, тестируемый с моками fetch. Публикация роликов и картинок: контейнер,
// ожидание обработки, media_publish, permalink, insights, лимит публикаций,
// обмен кода входа на токен и продление long-lived токена. Один и тот же сервис
// обслуживает любой аккаунт: токен всегда приходит аргументом.
// Канон зоны — docs/publish.md.
// Каркас снят с рельсы проекта vibecoding-ru (convex/services/instagram.ts).

const GRAPH = "https://graph.instagram.com/v23.0";
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const EXCHANGE_LONG_URL = "https://graph.instagram.com/access_token";
const OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
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

/** Куда Instagram возвращает человека после входа. Страницы там нет: нужен код. */
export const DEFAULT_REDIRECT_URI = "https://vibecoding.ru/ig-oauth";

export type OauthExchangePlan =
  | { ok: true; clientSecret: string; code: string; redirectUri: string }
  | { ok: false; reason: string };

/**
 * Что нужно проверить до первого запроса наружу: секрет приложения на месте, а
 * код входа очищен. Instagram дописывает к коду в адресной строке хвост «#_» —
 * с ним Meta код не принимает, и человек видел бы отказ вместо токена.
 */
export function oauthExchangePlan(args: {
  clientSecret: string | undefined;
  code: string;
  redirectUri?: string;
}): OauthExchangePlan {
  if (!args.clientSecret) {
    return { ok: false, reason: "в Convex env нет INSTAGRAM_APP_SECRET — обмен невозможен" };
  }
  const code = args.code.trim().replace(/#_+$/, "");
  if (code.length === 0) return { ok: false, reason: "код входа пуст" };
  return {
    ok: true,
    clientSecret: args.clientSecret,
    code,
    redirectUri: args.redirectUri ?? DEFAULT_REDIRECT_URI,
  };
}

/**
 * Шаг 1 входа: одноразовый code из редиректа business login → короткий токен
 * (живёт час). redirectUri обязан побайтово совпадать с настройкой в App
 * Dashboard, иначе Meta отказывает именно здесь.
 */
export async function exchangeCodeForShortLivedToken(args: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<{ accessToken: string; userId: string }> {
  const json = await postForm(OAUTH_TOKEN_URL, {
    client_id: args.clientId,
    client_secret: args.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: args.redirectUri,
    code: args.code,
  });
  const accessToken = json.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Instagram OAuth: ответ без access_token");
  }
  return { accessToken, userId: String(json.user_id ?? "") };
}

/** Шаг 2 входа: короткий токен → long-lived (60 дней). */
export async function exchangeForLongLivedToken(
  clientSecret: string,
  shortLivedToken: string,
): Promise<{ accessToken: string; expiresInSec: number }> {
  const json = await getJson(
    `${EXCHANGE_LONG_URL}?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
      clientSecret,
    )}&access_token=${encodeURIComponent(shortLivedToken)}`,
  );
  return parseTokenResponse(json, "exchange");
}

/** Продлить long-lived токен (валиден: токену больше суток и он ещё жив). */
export async function refreshLongLivedToken(
  token: string,
): Promise<{ accessToken: string; expiresInSec: number }> {
  const json = await getJson(
    `${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
  );
  return parseTokenResponse(json, "refresh");
}

function parseTokenResponse(
  json: Record<string, unknown>,
  stage: string,
): { accessToken: string; expiresInSec: number } {
  const accessToken = json.access_token;
  const expiresIn = json.expires_in;
  if (typeof accessToken !== "string" || typeof expiresIn !== "number") {
    throw new Error(`Instagram ${stage}: ответ без access_token/expires_in`);
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

const MEDIA_FIELDS = "id,media_type,media_product_type,permalink,caption,timestamp";

type IgMediaPage = { items: IgMediaItem[]; next: string | null; after: string | null };

/** Одна страница ответа /me/media: сами медиа и адрес следующей страницы. */
function parseMediaPage(json: Record<string, unknown>): IgMediaPage {
  const data = Array.isArray(json.data) ? (json.data as Array<Record<string, unknown>>) : [];
  const items = data.flatMap((item) => {
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
  const paging = json.paging as { next?: unknown; cursors?: { after?: unknown } } | undefined;
  return {
    items,
    next: typeof paging?.next === "string" ? paging.next : null,
    after: typeof paging?.cursors?.after === "string" ? paging.cursors.after : null,
  };
}

/** Последние медиа аккаунта, включая опубликованные руками. */
export async function getRecentMedia(
  token: string,
  opts: { limit?: number } = {},
): Promise<IgMediaItem[]> {
  const json = await getJson(
    `${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=${opts.limit ?? 25}&access_token=${encodeURIComponent(token)}`,
  );
  return parseMediaPage(json).items;
}

/**
 * Весь эфир аккаунта, страницами по 50, но не больше max штук. Нужен сбору
 * цифр: по полному списку видно не только новое, но и то, что с площадки
 * пропало (удалённый ролик). Страницы идут по paging.next, а если его нет —
 * по курсору paging.cursors.after.
 */
export async function getAllMedia(
  token: string,
  opts: { max?: number } = {},
): Promise<IgMediaItem[]> {
  const max = opts.max ?? 200;
  const page = 50;
  const out: IgMediaItem[] = [];
  const seen = new Set<string>();
  let url = `${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=${page}&access_token=${encodeURIComponent(token)}`;
  // Предохранитель от бесконечной ленты: страниц не больше, чем нужно на max.
  for (let guard = 0; guard < Math.ceil(max / page) + 2 && out.length < max; guard++) {
    const parsed = parseMediaPage(await getJson(url));
    for (const item of parsed.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= max) break;
    }
    if (out.length >= max) break;
    if (parsed.next) {
      url = parsed.next;
    } else if (parsed.after) {
      url = `${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=${page}&after=${encodeURIComponent(parsed.after)}&access_token=${encodeURIComponent(token)}`;
    } else {
      break;
    }
  }
  return out;
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
