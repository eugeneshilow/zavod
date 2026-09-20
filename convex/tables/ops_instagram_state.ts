import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Дом long-lived токена Instagram. Токен рождается входом через Instagram
// business login, живёт 60 дней и продлевается кроном. Значение наружу не
// отдаётся никогда: его читают только внутренние функции.
// Канон зоны — docs/publish.md.

const DEFAULT_ACCOUNT = "autovibecoding";

export const get = internalQuery({
  args: { account: v.optional(v.string()) },
  returns: v.union(
    v.object({
      account: v.string(),
      accessToken: v.string(),
      igUserId: v.optional(v.string()),
      username: v.optional(v.string()),
      expiresAt: v.number(),
      refreshedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const account = args.account ?? DEFAULT_ACCOUNT;
    const state = await ctx.db
      .query("ops_instagram_state")
      .withIndex("by_account", (q) => q.eq("account", account))
      .unique();
    if (!state) return null;
    return {
      account,
      accessToken: state.accessToken,
      igUserId: state.igUserId,
      username: state.username,
      expiresAt: state.expiresAt,
      refreshedAt: state.refreshedAt,
    };
  },
});

/** Положить или обновить токен. Запускается человеком через npx convex run. */
export const set = internalMutation({
  args: {
    account: v.optional(v.string()),
    accessToken: v.string(),
    igUserId: v.optional(v.string()),
    username: v.optional(v.string()),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = args.account ?? DEFAULT_ACCOUNT;
    const existing = await ctx.db
      .query("ops_instagram_state")
      .withIndex("by_account", (q) => q.eq("account", account))
      .unique();
    const patch = {
      account,
      accessToken: args.accessToken,
      igUserId: args.igUserId ?? existing?.igUserId,
      username: args.username ?? existing?.username,
      expiresAt: args.expiresAt,
      refreshedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("ops_instagram_state", patch);
    }
    return null;
  },
});

/** Отметить прогон очереди: это и есть «машина жива» для сторожа. */
export const noteRun = internalMutation({
  args: { account: v.optional(v.string()), at: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = args.account ?? DEFAULT_ACCOUNT;
    const existing = await ctx.db
      .query("ops_instagram_state")
      .withIndex("by_account", (q) => q.eq("account", account))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { lastRunAt: args.at });
    return null;
  },
});

/**
 * Состояние связки для /admin: есть ли токен, чей он и сколько ему жить.
 * Сам токен в ответ не попадает — только факт его наличия.
 */
export const statusForAdmin = query({
  args: { token: v.string(), account: v.optional(v.string()) },
  returns: v.object({
    hasToken: v.boolean(),
    account: v.string(),
    username: v.union(v.string(), v.null()),
    expiresAt: v.union(v.number(), v.null()),
    refreshedAt: v.union(v.number(), v.null()),
    lastRunAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const account = args.account ?? DEFAULT_ACCOUNT;
    const state = await ctx.db
      .query("ops_instagram_state")
      .withIndex("by_account", (q) => q.eq("account", account))
      .unique();
    return {
      hasToken: state !== null,
      account,
      username: state?.username ?? null,
      expiresAt: state?.expiresAt ?? null,
      refreshedAt: state?.refreshedAt ?? null,
      lastRunAt: state?.lastRunAt ?? null,
    };
  },
});
