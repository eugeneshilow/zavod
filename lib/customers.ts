import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { reelsAccess } from "@/lib/reels";
import { DEMO_CUSTOMER, ideaTitle, isCancelled, ORDER_BASE } from "@/lib/cabinet";
import type { Idea } from "@/lib/social";
import {
  loadAllPayments,
  paidThisMonthRub,
  productTitle,
  rub,
  tariffOf,
  type PaymentRow,
} from "@/lib/payments";

// Переносчик зоны клиентов: стадии, сборка человека из фактов, «что дальше».
// Канон — docs/customers/README.md; экран — /admin/customers.

export type StoredCustomer = FunctionReturnType<
  typeof api.tables.biz_customers.listForAdmin
>[number];

export const SOURCES = ["витрина", "telegram", "реферал", "руками"] as const;

/** Стадии по порядку пути к деньгам; ровно одна, движется только фактами. */
export const STAGES = [
  { id: "lead", label: "заявка", note: "оставил контакт, роликов нет" },
  { id: "trial", label: "пробует", note: "есть ролик, нет оплаты" },
  { id: "client", label: "клиент", note: "оплата за 30 дней или живой тариф" },
  { id: "gone", label: "ушёл", note: "оплата старше 30 дней, тарифа нет" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export type Touch = { at: number; what: string; href: string | null };

export type Customer = {
  id: string;
  name: string;
  initials: string;
  email: string | null;
  telegram: string | null;
  source: string;
  note: string | null;
  createdAt: number;
  stage: StageId;
  orders: number;
  live: number;
  cancelled: number;
  paidRub: number;
  payments: number;
  /** Тариф жив до этой даты, либо кончился в неё; оплат месяца нет — null. */
  tariffUntil: number | null;
  tariffAlive: boolean;
  lastTouchAt: number;
  touches: Touch[];
  next: string;
  /** Строка собрана из заказов кабинета, а не из таблицы клиентов. */
  demo: boolean;
};

export type CustomersView = {
  customers: Customer[];
  totals: { all: number; paying: number; paidMonthRub: number; waiting: number };
  byStage: Record<StageId, number>;
};

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => /^\p{L}/u.test(p));
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

/**
 * Стадия по фактам: оплаты и тариф — из платежей кассы
 * (docs/payments/README.md), заказы — из идей кабинета.
 */
export function stageOf(facts: {
  orders: number;
  payments: number;
  tariffAlive: boolean;
}): StageId {
  if (facts.payments > 0) return facts.tariffAlive ? "client" : "gone";
  return facts.orders > 0 ? "trial" : "lead";
}

/** Что дальше — подсказка по фактам карточки, одна фраза. */
export function nextStep(
  c: Pick<Customer, "stage" | "live" | "orders" | "lastTouchAt">,
  now: number,
): string {
  const idleDays = Math.floor((now - c.lastTouchAt) / 86_400_000);
  if (c.stage === "lead")
    return idleDays >= 1
      ? `ждёт ответа ${idleDays} дн.: написать и предложить первый ролик`
      : "ответить сегодня и предложить первый ролик";
  if (c.stage === "trial")
    return c.live > 0
      ? "ролик в эфире: показать просмотры и предложить тариф"
      : "первый ролик делается: написать, когда выйдет";
  if (c.stage === "client") return "тариф жив: предложить следующий ролик";
  return "не продлил: спросить почему";
}

function orderTouches(ideas: Idea[]): Touch[] {
  const out: Touch[] = [];
  for (const idea of ideas) {
    const title = ideaTitle(idea.storyTitle, idea.text);
    const href = `${ORDER_BASE}/${idea.id}`;
    out.push({ at: idea.createdAt, what: `заказал ролик «${title}»`, href });
    if (isCancelled(idea))
      out.push({ at: idea.phaseAt ?? idea.createdAt + 1, what: `отменил заказ «${title}»`, href });
    else if (idea.posted)
      out.push({
        at: idea.doneAt ?? idea.createdAt + 1,
        what: `ролик «${title}» вышел в эфир`,
        href,
      });
    else if (idea.status === "failed")
      out.push({ at: idea.phaseAt ?? idea.createdAt + 1, what: `заказ «${title}» не вышел`, href });
  }
  return out.sort((a, b) => b.at - a.at);
}

/** Касание «оплатил» — только оплаченные строки кассы. */
function paymentTouches(payments: PaymentRow[]): Touch[] {
  return payments
    .filter((p) => p.status === "succeeded")
    .map((p) => ({
      at: p.paidAt ?? p.createdAt,
      what: `оплатил «${productTitle(p.product)}» · ${rub(p.amountRub)}`,
      href: "/cabinet/tariff",
    }));
}

function build(
  base: Omit<
    Customer,
    | "stage"
    | "orders"
    | "live"
    | "cancelled"
    | "paidRub"
    | "payments"
    | "tariffUntil"
    | "tariffAlive"
    | "lastTouchAt"
    | "touches"
    | "next"
    | "initials"
  >,
  ideas: Idea[],
  payments: PaymentRow[],
  now: number,
): Customer {
  const touches = [
    ...orderTouches(ideas),
    ...paymentTouches(payments),
    { at: base.createdAt, what: `пришёл: ${base.source}`, href: null },
  ].sort((a, b) => b.at - a.at);
  const orders = ideas.length;
  const live = ideas.filter((i) => i.posted).length;
  const cancelled = ideas.filter(isCancelled).length;
  const paid = payments.filter((p) => p.status === "succeeded");
  const tariff = tariffOf(payments, now);
  const stage = stageOf({ orders, payments: paid.length, tariffAlive: tariff.active });
  const lastTouchAt = touches[0]?.at ?? base.createdAt;
  const c = {
    ...base,
    initials: initials(base.name),
    stage,
    orders,
    live,
    cancelled,
    paidRub: paid.reduce((sum, p) => sum + p.amountRub, 0),
    payments: paid.length,
    tariffUntil: tariff.until,
    tariffAlive: tariff.alive,
    lastTouchAt,
    touches,
  };
  return { ...c, next: nextStep(c, now) };
}

/**
 * Клиенты из таблицы плюс демо-аккаунт кабинета: заказы и платежи кабинета
 * пока не знают покупателя, до входа они все принадлежат демо-аккаунту.
 */
export function composeCustomers(
  input: { stored: StoredCustomer[]; ideas: Idea[]; payments?: PaymentRow[] },
  now: number,
): CustomersView {
  const cabinetOrders = input.ideas.filter((i) => i.order?.source === "cabinet");
  const payments = input.payments ?? [];
  const demoPayments = payments.filter((p) => p.account === DEMO_CUSTOMER.account);
  const customers: Customer[] = input.stored.map((s) =>
    build(
      {
        id: s.id,
        name: s.name,
        email: s.email,
        telegram: s.telegram,
        source: s.source,
        note: s.note,
        createdAt: s.createdAt,
        demo: false,
      },
      [],
      [],
      now,
    ),
  );
  if (cabinetOrders.length > 0 || demoPayments.length > 0) {
    const first = Math.min(
      ...cabinetOrders.map((i) => i.createdAt),
      ...demoPayments.map((p) => p.createdAt),
    );
    customers.push(
      build(
        {
          id: "demo",
          name: `${DEMO_CUSTOMER.name} · демо-аккаунт кабинета`,
          email: null,
          telegram: null,
          source: "кабинет",
          note: "все заказы и платежи кабинета до входа по почте",
          createdAt: first,
          demo: true,
        },
        cabinetOrders,
        demoPayments,
        now,
      ),
    );
  }
  customers.sort((a, b) => b.lastTouchAt - a.lastTouchAt);
  const byStage = { lead: 0, trial: 0, client: 0, gone: 0 } as Record<StageId, number>;
  for (const c of customers) byStage[c.stage] += 1;
  return {
    customers,
    byStage,
    totals: {
      all: customers.length,
      paying: byStage.client,
      paidMonthRub: paidThisMonthRub(payments, now),
      waiting: customers.filter((c) => c.stage === "lead").length,
    },
  };
}

export async function loadCustomers(now = Date.now()): Promise<CustomersView | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [stored, ideas, payments] = await Promise.all([
      client.query(api.tables.biz_customers.listForAdmin, { token }),
      client.query(api.tables.ops_reel_ideas.listForAdmin, { token, limit: 50 }),
      loadAllPayments(),
    ]);
    if ("reason" in payments) return payments;
    return composeCustomers({ stored, ideas, payments }, now);
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Подходит ли клиент под поиск: имя, почта, Telegram без @. */
export function matches(c: Customer, q: string): boolean {
  const needle = q.trim().toLowerCase().replace(/^@/, "");
  if (!needle) return true;
  return [c.name, c.email ?? "", c.telegram ?? ""].some((v) => v.toLowerCase().includes(needle));
}
