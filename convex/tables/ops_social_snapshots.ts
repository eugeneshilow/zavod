import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Снимок аккаунта: подписчики и расход суточного лимита. Пишет крон сбора
// метрик, только добавление. Канон зоны — docs/publish.md.

const snapshotShape = {
  network: v.string(),
  account: v.optional(v.string()),
  capturedAt: v.number(),
  followers: v.optional(v.number()),
  quotaUsage: v.optional(v.number()),
  quotaTotal: v.optional(v.number()),
  source: v.string(),
  detail: v.optional(v.string()),
};

export const record = internalMutation({
  args: {
    network: v.string(),
    account: v.optional(v.string()),
    followers: v.optional(v.number()),
    quotaUsage: v.optional(v.number()),
    quotaTotal: v.optional(v.number()),
    source: v.string(),
    detail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("ops_social_snapshots", { ...args, capturedAt: Date.now() });
    return null;
  },
});

/** Последний снимок сети — верхняя строка блока «Эфир» на /admin. */
export const latest = query({
  args: { token: v.string(), network: v.string(), account: v.optional(v.string()) },
  returns: v.union(v.object(snapshotShape), v.null()),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    // Аккаунт назван — берём его последний снимок; старые строки без поля
    // узнаём по detail «Instagram account @имя».
    const account = args.account;
    const rows = await ctx.db
      .query("ops_social_snapshots")
      .withIndex("by_network_captured", (q) => q.eq("network", args.network))
      .order("desc")
      .take(account === undefined ? 1 : 60);
    const row =
      account === undefined
        ? (rows[0] ?? null)
        : (rows.find(
            (r) =>
              r.account === account ||
              (r.account === undefined && (r.detail ?? "").endsWith(`@${account}`)),
          ) ?? null);
    if (!row) return null;
    return {
      network: row.network,
      account: row.account,
      capturedAt: row.capturedAt,
      followers: row.followers,
      quotaUsage: row.quotaUsage,
      quotaTotal: row.quotaTotal,
      source: row.source,
      detail: row.detail,
    };
  },
});
