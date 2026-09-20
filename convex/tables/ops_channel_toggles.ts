import { v } from "convex/values";
import { internalQuery, mutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Тумблер канала: пауза и включение кнопкой на /admin. Только добавление —
// событие не переписывается, состояние канала равно последнему событию.
// Событий нет — канал выключен: машина не постит, пока человек не включил.
// Канон зоны — docs/publish.md.

export const record = mutation({
  args: {
    token: v.string(),
    channel: v.string(),
    action: v.union(v.literal("on"), v.literal("off")),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const reason = args.reason.trim();
    if (reason.length < 3) throw new Error("причина обязательна (минимум 3 символа)");
    await ctx.db.insert("ops_channel_toggles", {
      channel: args.channel,
      action: args.action,
      reason,
      source: "admin",
      createdAt: Date.now(),
    });
    return null;
  },
});

/** Последнее событие каждого канала — для блока «Очередь Reels» на /admin. */
export const state = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      channel: v.string(),
      action: v.union(v.literal("on"), v.literal("off")),
      reason: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const events = await ctx.db.query("ops_channel_toggles").order("desc").take(200);
    const latest = new Map<string, (typeof events)[number]>();
    for (const event of events) {
      if (!latest.has(event.channel)) latest.set(event.channel, event);
    }
    return [...latest.values()].map((event) => ({
      channel: event.channel,
      action: event.action,
      reason: event.reason,
      createdAt: event.createdAt,
    }));
  },
});

/** Включён ли канал — спрашивает воркер перед каждой публикацией. */
export const isEnabled = internalQuery({
  args: { channel: v.string(), defaultEnabled: v.boolean() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("ops_channel_toggles")
      .withIndex("by_channel_created", (q) => q.eq("channel", args.channel))
      .order("desc")
      .first();
    if (!last) return args.defaultEnabled;
    return last.action === "on";
  },
});
