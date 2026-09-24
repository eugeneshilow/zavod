import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { requireAdminToken } from "../services/admin_gate";

// Платежи кассы: строка на каждую попытку оплаты. Статус пишет только
// приёмник уведомлений ЮKassa после перепроверки платежа у ЮKassa; тариф и
// стадию клиента этот файл не знает — их считает lib/payments.ts.
// Канон — docs/payments/README.md.

const PRODUCTS = ["reel", "month"];
const STATUSES = ["pending", "succeeded", "canceled"];

const paymentValidator = v.object({
  id: v.id("biz_payments"),
  orderId: v.string(),
  yookassaId: v.union(v.string(), v.null()),
  product: v.string(),
  amountRub: v.number(),
  status: v.string(),
  account: v.string(),
  test: v.boolean(),
  createdAt: v.number(),
  paidAt: v.union(v.number(), v.null()),
});

function toRow(row: Doc<"biz_payments">) {
  return {
    id: row._id,
    orderId: row.orderId,
    yookassaId: row.yookassaId ?? null,
    product: row.product,
    amountRub: row.amountRub,
    status: row.status,
    account: row.account,
    test: row.test,
    createdAt: row.createdAt,
    paidAt: row.paidAt ?? null,
  };
}

/** Кнопка «Оплатить»: строка `pending` до похода в ЮKassa. */
export const create = mutation({
  args: {
    token: v.string(),
    orderId: v.string(),
    product: v.string(),
    amountRub: v.number(),
    account: v.string(),
    test: v.boolean(),
  },
  returns: v.id("biz_payments"),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    if (!PRODUCTS.includes(args.product)) throw new Error(`товара «${args.product}» нет`);
    if (!(args.amountRub > 0)) throw new Error("сумма должна быть больше нуля");
    const taken = await ctx.db
      .query("biz_payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    if (taken) throw new Error(`заказ ${args.orderId} уже есть`);
    return await ctx.db.insert("biz_payments", {
      orderId: args.orderId,
      product: args.product,
      amountRub: args.amountRub,
      status: "pending",
      account: args.account,
      test: args.test,
      createdAt: Date.now(),
    });
  },
});

/** Номер платежа в ЮKassa и режим магазина из её ответа на создание. */
export const attachYookassa = mutation({
  args: {
    token: v.string(),
    orderId: v.string(),
    yookassaId: v.string(),
    test: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db
      .query("biz_payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!row) throw new Error(`заказа ${args.orderId} нет`);
    await ctx.db.patch(row._id, {
      yookassaId: args.yookassaId,
      ...(args.test === undefined ? {} : { test: args.test }),
    });
    return null;
  },
});

/**
 * Статус от приёмника уведомлений. Идемпотентно: повтор того же статуса —
 * ничего; `succeeded` окончателен и не откатывается. Чужой номер — `missing`.
 */
export const setStatus = mutation({
  args: {
    token: v.string(),
    orderId: v.string(),
    status: v.string(),
    paidAt: v.optional(v.number()),
  },
  returns: v.union(
    v.literal("updated"),
    v.literal("same"),
    v.literal("kept"),
    v.literal("missing"),
  ),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    if (!STATUSES.includes(args.status)) throw new Error(`статуса «${args.status}» нет`);
    const row = await ctx.db
      .query("biz_payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    if (!row) return "missing";
    if (row.status === "succeeded" && args.status !== "succeeded") return "kept";
    if (row.status === args.status) return "same";
    await ctx.db.patch(row._id, {
      status: args.status,
      ...(args.status === "succeeded" ? { paidAt: args.paidAt ?? Date.now() } : {}),
    });
    return "updated";
  },
});

export const listForAdmin = query({
  args: { token: v.string() },
  returns: v.array(paymentValidator),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const rows = await ctx.db.query("biz_payments").withIndex("by_created").order("desc").take(500);
    return rows.map(toRow);
  },
});

export const listForAccount = query({
  args: { token: v.string(), account: v.string() },
  returns: v.array(paymentValidator),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const rows = await ctx.db
      .query("biz_payments")
      .withIndex("by_account_created", (q) => q.eq("account", args.account))
      .order("desc")
      .take(200);
    return rows.map(toRow);
  },
});
