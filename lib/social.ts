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
  delta24: number | null;
  delta48: number | null;
  /** Первый сбор, на котором площадка ролик не вернула; null — ролик в эфире. */
  missingSince: number | null;
  caption: string;
};

export type IdeaStatus = "new" | "taken" | "done" | "failed";

export type Idea = {
  id: string;
  text: string;
  createdAt: number;
  status: IdeaStatus;
  takenAt: number | null;
  note: string | null;
  permalink: string | null;
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
  waiting: number;
  failed: number;
};

export type SocialData = { networks: NetworkGlance[]; days: DayCell[] };

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
    delta24: row.views24h ?? null,
    delta48: row.views48h ?? null,
    missingSince: row.missingSince ?? null,
    caption: row.caption ?? "",
  };
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

/** Статус идеи словом — как он стоит в списке лотка. */
export function ideaStatusWord(idea: Pick<Idea, "status" | "takenAt" | "note">): string {
  if (idea.status === "new") return "ждёт раннер";
  if (idea.status === "taken") {
    const at = idea.takenAt
      ? new Intl.DateTimeFormat("ru-RU", {
          timeZone: MSK,
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(idea.takenAt))
      : null;
    return at ? `в работе с ${at}` : "в работе";
  }
  if (idea.status === "done") return "готово";
  return `не вышло: ${idea.note ?? "без причины"}`;
}

export async function loadSocial(now = Date.now()): Promise<SocialData | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [queue, airtime, toggles, state, snapshot, ideas] = await Promise.all([
      client.query(api.tables.data_cooked_instagram_reels.listForAdmin, { token, limit: 200 }),
      client.query(api.tables.data_raw_instagram_media.listAirtimeForAdmin, { token, limit: 50 }),
      client.query(api.tables.ops_channel_toggles.state, { token }),
      client.query(api.tables.ops_instagram_state.statusForAdmin, { token }),
      client.query(api.tables.ops_social_snapshots.latest, { token, network: "instagram" }),
      client.query(api.tables.ops_reel_ideas.listForAdmin, { token, limit: 10 }),
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
      const air = splitAirtime(isIg ? airtime.map(toReel) : [], now);
      return {
        id,
        label,
        door,
        accounts: isIg
          ? state.map((s) => ({
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
        ideas: isIg ? ideas : [],
        waiting,
        failed,
      };
    });
    return { networks, days: dayGrid(now) };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
