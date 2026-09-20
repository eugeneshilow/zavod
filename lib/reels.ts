import { ConvexHttpClient } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

// Мост между страницей /admin и рельсой публикации в Convex. Страница за
// basic auth, запросы к Convex закрыты токеном ADMIN_API_TOKEN — тем же
// значением, что лежит в Convex env. Канон зоны — docs/publish.md.

export type ReelsAccess = { client: ConvexHttpClient; token: string };

/** Клиент и пропуск; чего-то не хватает — строка с причиной вместо падения. */
export function reelsAccess(): ReelsAccess | { reason: string } {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = process.env.ADMIN_API_TOKEN;
  if (!url) return { reason: "не задан NEXT_PUBLIC_CONVEX_URL" };
  if (!token) return { reason: "не задан ADMIN_API_TOKEN" };
  return { client: new ConvexHttpClient(url), token };
}

export type QueueRow = FunctionReturnType<
  typeof api.tables.data_cooked_instagram_reels.listForAdmin
>[number];

export type AirtimeRow = FunctionReturnType<
  typeof api.tables.data_raw_instagram_media.listAirtimeForAdmin
>[number];

/** Двери публикации: у каждой свой тумблер, состояние — последнее событие. */
export const CHANNELS = ["instagram", "telegram"] as const;

export type Channel = (typeof CHANNELS)[number];

export type ChannelState = { action: "on" | "off"; reason: string; createdAt: number } | null;

export type ReelsBoardData = {
  queue: QueueRow[];
  airtime: AirtimeRow[];
  channels: Record<Channel, ChannelState>;
  state: {
    hasToken: boolean;
    account: string;
    username: string | null;
    expiresAt: number | null;
    lastRunAt: number | null;
  };
  account: {
    followers: number | null;
    quotaUsage: number | null;
    quotaTotal: number | null;
    capturedAt: number | null;
  } | null;
  alerts: { kind: string; message: string; at: number }[];
};

/** Всё, что показывают два блока на /admin, одним заходом. */
export async function loadReelsBoard(): Promise<ReelsBoardData | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [queue, airtime, channels, state, snapshot, alerts] = await Promise.all([
      client.query(api.tables.data_cooked_instagram_reels.listForAdmin, { token, limit: 15 }),
      client.query(api.tables.data_raw_instagram_media.listAirtimeForAdmin, { token, limit: 10 }),
      client.query(api.tables.ops_channel_toggles.state, { token }),
      client.query(api.tables.ops_instagram_state.statusForAdmin, { token }),
      client.query(api.tables.ops_social_snapshots.latest, { token, network: "instagram" }),
      client.query(api.tables.ops_alerts.listForAdmin, { token, limit: 5 }),
    ]);
    const stateOf = (name: Channel): ChannelState => {
      const row = channels.find((event) => event.channel === name);
      return row ? { action: row.action, reason: row.reason, createdAt: row.createdAt } : null;
    };
    return {
      queue,
      airtime,
      channels: { instagram: stateOf("instagram"), telegram: stateOf("telegram") },
      state: {
        hasToken: state.hasToken,
        account: state.account,
        username: state.username,
        expiresAt: state.expiresAt,
        lastRunAt: state.lastRunAt,
      },
      account: snapshot
        ? {
            followers: snapshot.followers ?? null,
            quotaUsage: snapshot.quotaUsage ?? null,
            quotaTotal: snapshot.quotaTotal ?? null,
            capturedAt: snapshot.capturedAt,
          }
        : null,
      alerts,
    };
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Время по Москве: владелец читает время только так. */
export function moscow(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "нет";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function num(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : String(value);
}

export function delta(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value > 0 ? `+${value}` : String(value);
}
