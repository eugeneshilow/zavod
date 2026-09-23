import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Клиенты завода: человек, его контакты и откуда пришёл. Стадию, деньги и
// ролики этот файл не знает — их собирает lib/customers.ts из фактов.
// Канон — docs/customers/README.md.

const SOURCES = ["витрина", "telegram", "реферал", "руками"];

const customerValidator = v.object({
  id: v.id("biz_customers"),
  name: v.string(),
  email: v.union(v.string(), v.null()),
  telegram: v.union(v.string(), v.null()),
  source: v.string(),
  note: v.union(v.string(), v.null()),
  createdAt: v.number(),
});

export const listForAdmin = query({
  args: { token: v.string() },
  returns: v.array(customerValidator),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const rows = await ctx.db
      .query("biz_customers")
      .withIndex("by_created")
      .order("desc")
      .take(500);
    return rows.map((row) => ({
      id: row._id,
      name: row.name,
      email: row.email ?? null,
      telegram: row.telegram ?? null,
      source: row.source,
      note: row.note ?? null,
      createdAt: row.createdAt,
    }));
  },
});

/** Кнопка «Добавить клиента» на /admin/customers. */
export const add = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    telegram: v.optional(v.string()),
    source: v.string(),
    note: v.optional(v.string()),
  },
  returns: v.id("biz_customers"),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const name = args.name.trim();
    if (!name) throw new Error("имя пустое");
    const email = args.email?.trim().toLowerCase() || undefined;
    const telegram = args.telegram?.trim().replace(/^@/, "") || undefined;
    if (!email && !telegram) throw new Error("нужна почта или Telegram");
    if (!SOURCES.includes(args.source)) throw new Error(`источника «${args.source}» нет`);
    return await ctx.db.insert("biz_customers", {
      name,
      email,
      telegram,
      source: args.source,
      note: args.note?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});
