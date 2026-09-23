import { api } from "@/convex/_generated/api";
import { reelsAccess, type Channel } from "@/lib/reels";

// Зона social: те же данные, что у /admin/publish, разложенные по сетям —
// дверь, аккаунты, снимок, посты по дням, лучшие ролики. Канон —
// docs/social/README.md. Сети читаются из папки docs/social (файл на сеть),
// данные умеют отдавать только те, чей channel есть в очереди.

export type NetworkId = "instagram" | "telegram";

export const NETWORKS: { id: NetworkId; channel: Channel; label: string }[] = [
  { id: "instagram", channel: "instagram", label: "Площадка коротких видео" },
  { id: "telegram", channel: "telegram", label: "Telegram" },
];

export type DoorState = { on: boolean; reason: string; at: number } | null;

export type DayCell = { key: string; label: string; posted: number; planned: number };

export type Reel = {
  mediaId: string;
  account: string;
  permalink: string | null;
  postedAt: number | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  saved: number | null;
  shares: number | null;
  interactions: number | null;
  avgWatchMs: number | null;
  /** Длина ролика из очереди (ffprobe при постановке); null у старых строк. */
  durationMs: number | null;
  /** Доля ушедших в первые три секунды, 0–100; площадка отдаёт не всегда. */
  skipRate: number | null;
  reposts: number | null;
  delta24: number | null;
  delta48: number | null;
  /** Первый сбор, на котором площадка ролик не вернула; null — ролик в эфире. */
  missingSince: number | null;
  caption: string;
  /** Сам файл ролика из очереди: по нему в таблице стоит значок «посмотреть». */
  videoUrl: string | null;
  /** Во что обошёлся ролик, если его сделала идея; null — сделан руками. */
  costUsd: number | null;
  /** Ролик родился из идеи, а не из ручной команды публикации. */
  fromIdea: boolean;
};

/** Единственный аккаунт на экране сети: английский пилот на экран не выводится (⚖️ ru-only-screen). */
export const IG_ACCOUNT = "ruvibecoding";

/** Досмотр: среднее время просмотра к длине ролика, в процентах; без длины — null. */
export function watchThrough(r: Pick<Reel, "avgWatchMs" | "durationMs">): number | null {
  if (r.avgWatchMs == null || !r.durationMs) return null;
  return Math.min(100, (r.avgWatchMs / r.durationMs) * 100);
}

/** Повторы: просмотров на одного охваченного; 1,0 — каждый посмотрел один раз. */
export function replays(r: Pick<Reel, "views" | "reach">): number | null {
  if (r.views == null || !r.reach) return null;
  return r.views / r.reach;
}

/** Вовлечённость: взаимодействия к охвату, в процентах. */
export function engagementRate(r: Pick<Reel, "interactions" | "reach">): number | null {
  if (r.interactions == null || !r.reach) return null;
  return (r.interactions / r.reach) * 100;
}

/** pending — ждёт выбора, new — отдана раннеру, дальше работа, ролик, неудача. */
export type IdeaStatus = "pending" | "new" | "taken" | "done" | "failed";

/** Где раннер сейчас: пишет историю, собирает ролик, ставит его в очередь. */
export type IdeaPhase = "story" | "render" | "publish";

export type Idea = {
  id: string;
  text: string;
  createdAt: number;
  status: IdeaStatus;
  takenAt: number | null;
  note: string | null;
  permalink: string | null;
  phase: IdeaPhase | null;
  phaseAt: number | null;
  storyTitle: string | null;
  storyWords: number | null;
  videoSeconds: number | null;
  writer: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    ms: number;
  } | null;
  voice: { model: string; chars: number; costUsd: number } | null;
  totalCostUsd: number | null;
  elapsedMs: number | null;
  videoUrl: string | null;
  /** Ролик вышел в эфир: строка уезжает из таблицы идей в «Эфир сети». */
  posted: boolean;
  /** Медиа вышедшего ролика — по нему строка эфира узнаёт свою идею. */
  postedMediaId: string | null;
  /** Сколько дверей ещё ждут этот ролик и когда они собираются его выпустить. */
  queueCount: number;
  queueAt: number | null;
  error: string | null;
  /** Ссылки на вышедшие посты по дверям; у старых строк и в тестах может не быть. */
  postedLinks?: { channel: string; permalink: string }[];
  /** Когда ролик собран; у старых строк нет. */
  doneAt?: number | null;
  /** Заказ из кабинета: голос, двери, пожелание. Идея владельца — без него. */
  order?: { voice: string; to: string[]; wish?: string; source: string } | null;
};

export type NetworkGlance = {
  id: NetworkId;
  label: string;
  door: DoorState;
  accounts: {
    account: string;
    username: string | null;
    expiresAt: number;
    lastRunAt: number | null;
  }[];
  followers: number | null;
  quotaUsage: number | null;
  quotaTotal: number | null;
  capturedAt: number | null;
  posts7d: number;
  views7d: number | null;
  days: DayCell[];
  /** Ролики в эфире, по просмотрам вниз. */
  reels: Reel[];
  /** Удалённые с площадки, по времени пометки вниз; цифры — последние снятые. */
  deleted: Reel[];
  /** Лучший ролик в эфире — первая строка reels. */
  top: Reel | null;
  ideas: Idea[];
  /** Сколько стоили ролики за семь дней — подвал таблицы идей. */
  ideasCost7d: number;
  waiting: number;
  failed: number;
};

/** `now` отдаётся вместе с данными: экран — компонент, часы он не спрашивает. */
export type SocialData = { networks: NetworkGlance[]; days: DayCell[]; now: number };

const DAY = 24 * 60 * 60 * 1000;
const MSK = "Europe/Moscow";

/** Ключ дня по Москве: «21.09». */
export function dayKey(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MSK,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(ms));
}

/** Восемь дней: шесть назад, сегодня, завтра — как колонки эфира по дням. */
export function dayGrid(now: number): DayCell[] {
  const cells: DayCell[] = [];
  for (let i = -6; i <= 1; i += 1) {
    const ms = now + i * DAY;
    const label = new Intl.DateTimeFormat("ru-RU", {
      timeZone: MSK,
      weekday: "short",
      day: "numeric",
    }).format(new Date(ms));
    cells.push({ key: dayKey(ms), label, posted: 0, planned: 0 });
  }
  return cells;
}

type QueueRow = {
  status: string;
  channel?: string | null;
  scheduledAt?: number;
  postedAt?: number | null;
  caption?: string;
};

/** Раскладка строк очереди по дням: вышедшие — по факту, ждущие — по плану. */
export function postsByDay(rows: QueueRow[], channel: Channel, now: number): DayCell[] {
  const grid = dayGrid(now);
  for (const row of rows) {
    if ((row.channel ?? "instagram") !== channel) continue;
    if (row.status === "posted" && row.postedAt) {
      const cell = grid.find((c) => c.key === dayKey(row.postedAt!));
      if (cell) cell.posted += 1;
    } else if (row.status === "approved" || row.status === "draft" || row.status === "posting") {
      const cell = grid.find((c) => c.key === dayKey(Math.max(row.scheduledAt ?? now, now)));
      if (cell) cell.planned += 1;
    }
  }
  return grid;
}

type AirtimeRow = {
  mediaId: string;
  account?: string;
  permalink?: string | null;
  caption?: string | null;
  postedAt?: number | null;
  missingSince?: number | null;
  durationMs?: number | null;
  videoUrl?: string | null;
  views24h?: number | null;
  views48h?: number | null;
  metrics?: {
    views?: number;
    reach?: number;
    likes?: number;
    comments?: number;
    saved?: number;
    shares?: number;
    totalInteractions?: number;
    avgWatchTimeMs?: number;
    skipRate?: number;
    reposts?: number;
  } | null;
};

/** Строка эфира из базы — в строку экрана. */
export function toReel(row: AirtimeRow): Reel {
  const m = row.metrics ?? null;
  return {
    mediaId: row.mediaId,
    account: row.account ?? "",
    permalink: row.permalink ?? null,
    postedAt: row.postedAt ?? null,
    views: m?.views ?? null,
    reach: m?.reach ?? null,
    likes: m?.likes ?? null,
    comments: m?.comments ?? null,
    saved: m?.saved ?? null,
    shares: m?.shares ?? null,
    interactions: m?.totalInteractions ?? null,
    avgWatchMs: m?.avgWatchTimeMs ?? null,
    durationMs: row.durationMs ?? null,
    skipRate: m?.skipRate ?? null,
    reposts: m?.reposts ?? null,
    delta24: row.views24h ?? null,
    delta48: row.views48h ?? null,
    missingSince: row.missingSince ?? null,
    caption: row.caption ?? "",
    videoUrl: row.videoUrl ?? null,
    costUsd: null,
    fromIdea: false,
  };
}

/**
 * Сшивка эфира с идеями: строка эфира, у которой есть идея с тем же медиа,
 * получает её цену и пометку «из идеи». Ролик, выложенный руками, остаётся без
 * цены — «руками». Идея приходит сюда только вышедшая (posted).
 */
export function attachIdeas(reels: Reel[], ideas: Idea[]): Reel[] {
  const byMedia = new Map<string, Idea>();
  for (const idea of ideas) {
    if (idea.postedMediaId) byMedia.set(idea.postedMediaId, idea);
  }
  return reels.map((reel) => {
    const idea = byMedia.get(reel.mediaId);
    if (!idea) return reel;
    return { ...reel, fromIdea: true, costUsd: idea.totalCostUsd };
  });
}

/**
 * Эфир сети: живые ролики по просмотрам вниз, удалённые отдельным хвостом.
 * Просмотры за семь дней и лучший ролик считаются только по живым: цифры
 * удалённого — последние известные, в сумму недели они уже не идут.
 */
export function splitAirtime(
  rows: Reel[],
  now: number,
): { reels: Reel[]; deleted: Reel[]; views7d: number | null; top: Reel | null } {
  const live = rows
    .filter((r) => r.missingSince === null)
    .sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
  const deleted = rows
    .filter((r) => r.missingSince !== null)
    .sort((a, b) => (b.missingSince ?? 0) - (a.missingSince ?? 0));
  const week = live.filter((r) => (r.postedAt ?? 0) >= now - 7 * DAY && r.views !== null);
  return {
    reels: live,
    deleted,
    views7d: week.length ? week.reduce((sum, r) => sum + (r.views ?? 0), 0) : null,
    top: live[0] ?? null,
  };
}

/** Время суток по Москве: «14:00». */
function hhmm(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MSK,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** Имя модели, как его читает владелец; незнакомое остаётся как есть. */
export function modelWord(model: string): string {
  const known: Record<string, string> = {
    "claude-fable-5-1": "Fable 5.1",
    "claude-opus-5": "Opus 5",
    eleven_v3: "ElevenLabs v3",
    eleven_v2: "ElevenLabs v2",
  };
  return known[model] ?? model;
}

/** Токены тысячами с одним знаком: 38 900 становится «38,9k». */
export function tokensWord(n: number): string {
  return `${(n / 1000).toFixed(1).replace(".", ",")}k`;
}

/** Деньги как в счёте API: «$0.31». */
export function moneyWord(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/** Сколько заняло: до минуты — секундами, дальше минутами. */
function spanWord(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} с`;
  return `${Math.round(ms / 60_000)} мин`;
}

/** Плашка фазы: что с идеей прямо сейчас и каким цветом это показать. */
export type PhaseChip = { text: string; tone: "grey" | "warn" | "bad" };

const PHASE_WORD: Record<IdeaPhase, string> = {
  story: "история",
  render: "сборка",
  publish: "публикация",
};

/**
 * Одна плашка на строку идеи: «ждёт выбора», «пишет историю · 3 мин»,
 * «в очереди · 14:00 · 2 двери» или красная причина неудачи.
 */
export function ideaPhaseChip(
  idea: Pick<Idea, "status" | "phase" | "phaseAt" | "queueCount" | "queueAt" | "error" | "takenAt">,
  now: number,
): PhaseChip {
  if (idea.status === "pending") return { text: "ждёт выбора", tone: "grey" };
  if (idea.status === "new") return { text: "в очереди к раннеру", tone: "grey" };
  if (idea.status === "taken") {
    const since = idea.phaseAt ?? idea.takenAt;
    const ms = since === null ? null : Math.max(0, now - since);
    if (idea.phase === "story") {
      return {
        text: ms === null ? "пишет историю" : `пишет историю · ${Math.round(ms / 60_000)} мин`,
        tone: "warn",
      };
    }
    if (idea.phase === "render") {
      return {
        text: ms === null ? "озвучка и сборка" : `озвучка и сборка · ${Math.round(ms / 1000)} с`,
        tone: "warn",
      };
    }
    if (idea.phase === "publish") return { text: "публикация", tone: "warn" };
    return { text: "в работе", tone: "warn" };
  }
  if (idea.status === "done") {
    if (idea.queueCount === 0 || idea.queueAt === null) {
      return { text: "в очереди", tone: "warn" };
    }
    const doors = idea.queueCount === 1 ? "1 дверь" : `${idea.queueCount} двери`;
    return { text: `в очереди · ${hhmm(idea.queueAt)} · ${doors}`, tone: "warn" };
  }
  const why = idea.error ?? "без причины";
  const where = idea.phase ? `${PHASE_WORD[idea.phase]} · ` : "";
  return { text: `${where}${why}`, tone: "bad" };
}

/**
 * Три строки цены ролика: чем писали историю, чем озвучивали и сколько вышло
 * всего. Чего ещё нет — строки нет; нет ничего — пустой список и прочерк.
 */
export function ideaCostLines(
  idea: Pick<Idea, "writer" | "voice" | "totalCostUsd" | "elapsedMs">,
): string[] {
  const lines: string[] = [];
  if (idea.writer) {
    const w = idea.writer;
    lines.push(
      `${modelWord(w.model)} · ${tokensWord(w.inputTokens)} → ${tokensWord(w.outputTokens)} · ${moneyWord(w.costUsd)}`,
    );
  }
  if (idea.voice) {
    const t = idea.voice;
    lines.push(`${modelWord(t.model)} · ${t.chars} зн. · ${moneyWord(t.costUsd)}`);
  }
  if (idea.totalCostUsd !== null && idea.totalCostUsd !== undefined) {
    const span = idea.elapsedMs ? ` · ${spanWord(idea.elapsedMs)}` : "";
    lines.push(`итого ${moneyWord(idea.totalCostUsd)}${span}`);
  }
  return lines;
}

/** Хост ссылки из текста идеи: «x.com». Ссылки нет — null. */
export function ideaHost(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>]+/);
  if (!match) return null;
  try {
    return new URL(match[0]).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Подвал таблицы идей: сколько ждут выбора, сколько в работе, сколько не вышло. */
export function ideaCounts(ideas: Idea[]): { pending: number; working: number; failed: number } {
  return {
    pending: ideas.filter((i) => i.status === "pending").length,
    working: ideas.filter((i) => i.status === "new" || i.status === "taken").length,
    failed: ideas.filter((i) => i.status === "failed").length,
  };
}

export async function loadSocial(now = Date.now()): Promise<SocialData | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [queue, airtime, toggles, state, snapshot, ideas, ideasCost7d] = await Promise.all([
      client.query(api.tables.data_cooked_instagram_reels.listForAdmin, { token, limit: 200 }),
      client.query(api.tables.data_raw_instagram_media.listAirtimeForAdmin, {
        token,
        limit: 50,
        account: IG_ACCOUNT,
      }),
      client.query(api.tables.ops_channel_toggles.state, { token }),
      client.query(api.tables.ops_instagram_state.statusForAdmin, { token }),
      client.query(api.tables.ops_social_snapshots.latest, {
        token,
        network: "instagram",
        account: IG_ACCOUNT,
      }),
      client.query(api.tables.ops_reel_ideas.listForAdmin, { token, limit: 50 }),
      client.query(api.tables.ops_reel_ideas.weeklyCost, { token }),
    ]);
    const weekAgo = now - 7 * DAY;
    const networks: NetworkGlance[] = NETWORKS.map(({ id, channel, label }) => {
      const t = toggles.find((e) => e.channel === channel);
      const door: DoorState = t
        ? { on: t.action === "on", reason: t.reason, at: t.createdAt }
        : null;
      const rows = queue.filter((r) => (r.channel ?? "instagram") === channel);
      const posts7d = rows.filter(
        (r) => r.status === "posted" && (r.postedAt ?? 0) >= weekAgo,
      ).length;
      const waiting = rows.filter((r) => r.status === "approved" || r.status === "draft").length;
      const failed = rows.filter((r) => r.status === "failed").length;
      const isIg = id === "instagram";
      const air = splitAirtime(isIg ? attachIdeas(airtime.map(toReel), ideas) : [], now);
      return {
        id,
        label,
        door,
        accounts: isIg
          ? state
              .filter((s) => s.account === IG_ACCOUNT)
              .map((s) => ({
                account: s.account,
                username: s.username,
                expiresAt: s.expiresAt,
                lastRunAt: s.lastRunAt,
              }))
          : [],
        followers: isIg ? (snapshot?.followers ?? null) : null,
        quotaUsage: isIg ? (snapshot?.quotaUsage ?? null) : null,
        quotaTotal: isIg ? (snapshot?.quotaTotal ?? null) : null,
        capturedAt: isIg ? (snapshot?.capturedAt ?? null) : null,
        posts7d,
        views7d: air.views7d,
        days: postsByDay(queue, channel, now),
        reels: air.reels,
        deleted: air.deleted,
        top: air.top,
        // В таблице идей живут только те, чей ролик ещё не вышел: вышедший
        // уезжает вниз, в «Эфир сети» (⚖️ ideas-table-before-airtime).
        ideas: isIg ? ideas.filter((idea) => !idea.posted) : [],
        ideasCost7d: isIg ? ideasCost7d : 0,
        waiting,
        failed,
      };
    });
    return { networks, days: dayGrid(now), now };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
