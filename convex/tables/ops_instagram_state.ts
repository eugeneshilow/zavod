import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Дом long-lived токенов Instagram: строка на аккаунт. Токен рождается входом
// через Instagram business login, живёт 60 дней и продлевается кроном. Значение
// наружу не отдаётся никогда: его читают только внутренние функции.
// Канон зоны — docs/publish.md.

// Аккаунт, которым читаются вызовы без явного имени: так старые строки и
// команды, написанные до второго аккаунта, продолжают работать.
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

/**
 * Все аккаунты со своими токенами. По ним ходят кроны продления и сбора цифр:
 * аккаунтов столько, сколько строк, и ни один не остаётся без обхода.
 */
export const listAll = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      account: v.string(),
      accessToken: v.string(),
      igUserId: v.optional(v.string()),
      username: v.optional(v.string()),
      expiresAt: v.number(),
      refreshedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("ops_instagram_state").collect();
    return rows.map((state) => ({
      account: state.account,
      accessToken: state.accessToken,
      igUserId: state.igUserId,
      username: state.username,
      expiresAt: state.expiresAt,
      refreshedAt: state.refreshedAt,
    }));
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

/**
 * Отметить прогон очереди: это и есть «машина жива» для сторожа. Имя аккаунта
 * не передано — отметку получают все строки: тик один на всю дверь, и сторож
 * не должен молчать только потому, что первый аккаунт ещё не подключён.
 */
export const noteRun = internalMutation({
  args: { account: v.optional(v.string()), at: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = args.account;
    if (account !== undefined) {
      const existing = await ctx.db
        .query("ops_instagram_state")
        .withIndex("by_account", (q) => q.eq("account", account))
        .unique();
      if (existing) await ctx.db.patch(existing._id, { lastRunAt: args.at });
      return null;
    }
    for (const row of await ctx.db.query("ops_instagram_state").collect()) {
      await ctx.db.patch(row._id, { lastRunAt: args.at });
    }
    return null;
  },
});

/**
 * Состояние связки для /admin: по строке на аккаунт — чей токен, сколько ему
 * жить и когда был последний прогон. Сами токены в ответ не попадают.
 */
export const statusForAdmin = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      account: v.string(),
      username: v.union(v.string(), v.null()),
      expiresAt: v.number(),
      refreshedAt: v.number(),
      lastRunAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const rows = await ctx.db.query("ops_instagram_state").collect();
    return rows
      .map((state) => ({
        account: state.account,
        username: state.username ?? null,
        expiresAt: state.expiresAt,
        refreshedAt: state.refreshedAt,
        lastRunAt: state.lastRunAt ?? null,
      }))
      .sort((a, b) => a.account.localeCompare(b.account));
  },
});
