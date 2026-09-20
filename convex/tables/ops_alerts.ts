import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Что сломалось в рельсе публикации: пост не ушёл, очередь протухла,
// продление токена упало. Только добавление. Канон зоны — docs/publish.md.

export const record = internalMutation({
  args: { kind: v.string(), message: v.string(), context: v.optional(v.any()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("ops_alerts", {
      kind: args.kind,
      message: args.message,
      context: args.context,
      at: Date.now(),
    });
    return null;
  },
});

export const listForAdmin = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  returns: v.array(v.object({ kind: v.string(), message: v.string(), at: v.number() })),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const rows = await ctx.db.query("ops_alerts").withIndex("by_at").order("desc").take(limit);
    return rows.map((row) => ({ kind: row.kind, message: row.message, at: row.at }));
  },
});
