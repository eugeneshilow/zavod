import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Снимок аккаунта: подписчики и расход суточного лимита. Пишет крон сбора
// метрик, только добавление. Канон зоны — docs/publish.md.

const snapshotShape = {
  network: v.string(),
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
  args: { token: v.string(), network: v.string() },
  returns: v.union(v.object(snapshotShape), v.null()),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db
      .query("ops_social_snapshots")
      .withIndex("by_network_captured", (q) => q.eq("network", args.network))
      .order("desc")
      .first();
    if (!row) return null;
    return {
      network: row.network,
      capturedAt: row.capturedAt,
      followers: row.followers,
      quotaUsage: row.quotaUsage,
      quotaTotal: row.quotaTotal,
      source: row.source,
      detail: row.detail,
    };
  },
});
