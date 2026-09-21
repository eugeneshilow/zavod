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
  permalink: string | null;
  postedAt: number | null;
  views: number | null;
  reach: number | null;
  delta48: number | null;
  caption: string;
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
  best: Reel[];
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

export async function loadSocial(now = Date.now()): Promise<SocialData | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [queue, airtime, toggles, state, snapshot] = await Promise.all([
      client.query(api.tables.data_cooked_instagram_reels.listForAdmin, { token, limit: 200 }),
      client.query(api.tables.data_raw_instagram_media.listAirtimeForAdmin, { token, limit: 30 }),
      client.query(api.tables.ops_channel_toggles.state, { token }),
      client.query(api.tables.ops_instagram_state.statusForAdmin, { token }),
      client.query(api.tables.ops_social_snapshots.latest, { token, network: "instagram" }),
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
      const reels: Reel[] = isIg
        ? airtime.map((m) => ({
            mediaId: m.mediaId,
            permalink: m.permalink ?? null,
            postedAt: m.postedAt ?? null,
            views: m.metrics?.views ?? null,
            reach: m.metrics?.reach ?? null,
            delta48: m.views48h ?? null,
            caption: m.caption ?? "",
          }))
        : [];
      const recent = reels.filter((r) => (r.postedAt ?? 0) >= weekAgo && r.views !== null);
      const views7d = isIg && recent.length ? recent.reduce((s, r) => s + (r.views ?? 0), 0) : null;
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
        views7d,
        days: postsByDay(queue, channel, now),
        best: [...reels].sort((a, b) => (b.views ?? -1) - (a.views ?? -1)).slice(0, 5),
        waiting,
        failed,
      };
    });
    return { networks, days: dayGrid(now) };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
