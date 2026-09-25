import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";

// Переносчик кассы: товары, тариф из платежей, клиент ЮKassa и разбор
// уведомлений. Экраны и приёмник только зовут его. Канон —
// docs/payments/README.md.

export const PRODUCTS = [
  { id: "reel", title: "Разовый ролик", priceRub: 690, note: "один заказ в кабинете" },
  { id: "month", title: "Месяц", priceRub: 4900, note: "тариф «Старт» на 30 дней" },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];

export const TARIFF_DAYS = 30;
export const TARIFF_PLAN = "Старт";
const DAY = 86_400_000;

export type PaymentStatus = "pending" | "succeeded" | "canceled";

export type PaymentRow = FunctionReturnType<typeof api.tables.biz_payments.listForAdmin>[number];

/** Сколько нужно от платежа, чтобы посчитать тариф и деньги. */
export type PaymentFact = Pick<PaymentRow, "product" | "status" | "amountRub" | "paidAt">;

/** Статус словом покупателя и владельца: оплачен · ждём · отменён. */
export const STATUS_WORD: Record<string, string> = {
  pending: "ждём",
  succeeded: "оплачен",
  canceled: "отменён",
};

export function productOf(id: string) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function productTitle(id: string): string {
  return productOf(id)?.title ?? id;
}

export type Tariff = {
  plan: typeof TARIFF_PLAN | null;
  /** Конец последнего оплаченного месяца, даже если он уже прошёл. */
  until: number | null;
  alive: boolean;
  reelsLeft: number;
};

/**
 * Тариф из платежей: последний оплаченный «Месяц» даёт «Старт» до
 * `paidAt + 30 дней`, оплаченные «Разовые ролики» — запас роликов.
 */
export function tariffOf(payments: PaymentFact[], now = Date.now()): Tariff {
  const paid = payments.filter((p) => p.status === "succeeded" && p.paidAt !== null);
  const lastMonth = Math.max(
    ...paid.filter((p) => p.product === "month").map((p) => p.paidAt ?? 0),
    -Infinity,
  );
  const until = Number.isFinite(lastMonth) ? lastMonth + TARIFF_DAYS * DAY : null;
  const alive = until !== null && until > now;
  return {
    plan: alive ? TARIFF_PLAN : null,
    until,
    alive,
    reelsLeft: paid.filter((p) => p.product === "reel").length,
  };
}

const MSK = "Europe/Moscow";
const DAY_MONTH = new Intl.DateTimeFormat("ru-RU", {
  timeZone: MSK,
  day: "numeric",
  month: "long",
});

/** «Тариф «Старт» до 24 октября» или «Тарифа нет — ролики по одному». */
export function tariffLine(t: Tariff): string {
  if (t.alive && t.until !== null)
    return `Тариф «${TARIFF_PLAN}» до ${DAY_MONTH.format(new Date(t.until))}`;
  return "Тарифа нет — ролики по одному";
}

/** Начало текущего месяца по Москве (UTC+3 без перевода часов). */
export function monthStartMsk(now: number): number {
  const msk = new Date(now + 3 * 3_600_000);
  return Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), 1) - 3 * 3_600_000;
}

/** Оплачено с начала месяца по Москве, рублей. */
export function paidThisMonthRub(payments: PaymentFact[], now = Date.now()): number {
  const from = monthStartMsk(now);
  return payments
    .filter((p) => p.status === "succeeded" && (p.paidAt ?? 0) >= from)
    .reduce((sum, p) => sum + p.amountRub, 0);
}

/** «4 900 ₽» — пробел тысяч. */
export function rub(n: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

/** Наш номер заказа: `pay-` и 12 знаков случайного uuid. */
export function newOrderId(): string {
  return `pay-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

/** Адрес сайта из заголовков запроса: за прокси Vercel — x-forwarded-*. */
export function requestOrigin(h: { get(name: string): string | null }): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.|app\.localhost)/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------- ЮKassa

export type YookassaKeys = { shopId: string; secretKey: string };

/** Ключи магазина из env; нет — причина строкой, значения не печатаются. */
export function paymentsAccess(): YookassaKeys | { reason: string } {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return { reason: "нет YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY" };
  return { shopId, secretKey };
}

const API = "https://api.yookassa.ru/v3/payments";

function auth(keys: YookassaKeys): string {
  return `Basic ${Buffer.from(`${keys.shopId}:${keys.secretKey}`).toString("base64")}`;
}

async function failure(res: Response): Promise<Error> {
  let detail = "";
  try {
    const body = (await res.json()) as { description?: unknown };
    if (typeof body.description === "string") detail = `: ${body.description}`;
  } catch {
    // тело не JSON — хватит кода ответа
  }
  return new Error(`ЮKassa ответила ${res.status}${detail}`);
}

/** Создать платёж: редирект на страницу оплаты ЮKassa, списание сразу. */
export async function createYookassaPayment(input: {
  shopId: string;
  secretKey: string;
  orderId: string;
  amountRub: number;
  description: string;
  returnUrl: string;
}): Promise<{ id: string; confirmationUrl: string; test: boolean }> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: auth(input),
      "Idempotence-Key": input.orderId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { value: input.amountRub.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: input.returnUrl },
      description: input.description,
      metadata: { orderId: input.orderId },
    }),
    cache: "no-store",
  });
  if (!res.ok) throw await failure(res);
  const body = (await res.json()) as {
    id?: unknown;
    test?: unknown;
    confirmation?: { confirmation_url?: unknown };
  };
  const confirmationUrl = body.confirmation?.confirmation_url;
  if (typeof body.id !== "string" || typeof confirmationUrl !== "string")
    throw new Error("ЮKassa не вернула номер платежа или ссылку на оплату");
  return { id: body.id, confirmationUrl, test: body.test === true };
}

export type YookassaPayment = {
  id: string;
  status: string;
  orderId: string | null;
  paidAt: number | null;
  test: boolean;
};

/** Спросить ЮKassa о платеже: единственный источник правды о статусе. */
export async function fetchYookassaPayment(input: {
  shopId: string;
  secretKey: string;
  id: string;
}): Promise<YookassaPayment> {
  const res = await fetch(`${API}/${encodeURIComponent(input.id)}`, {
    headers: { Authorization: auth(input) },
    cache: "no-store",
  });
  if (!res.ok) throw await failure(res);
  const body = (await res.json()) as {
    id?: unknown;
    status?: unknown;
    test?: unknown;
    captured_at?: unknown;
    metadata?: { orderId?: unknown } | null;
  };
  const orderId = body.metadata?.orderId;
  const paidAt = typeof body.captured_at === "string" ? Date.parse(body.captured_at) : NaN;
  return {
    id: typeof body.id === "string" ? body.id : input.id,
    status: typeof body.status === "string" ? body.status : "unknown",
    orderId: typeof orderId === "string" ? orderId : null,
    paidAt: Number.isFinite(paidAt) ? paidAt : null,
    test: body.test === true,
  };
}

/**
 * Уведомление ЮKassa: телу не верим, берём только номер платежа `object.id`
 * (строка до 64 знаков). Всё остальное — мусор, `null`.
 */
export function parseNotification(body: unknown): { event: string; paymentId: string } | null {
  if (!body || typeof body !== "object") return null;
  const { event, object } = body as { event?: unknown; object?: unknown };
  if (!object || typeof object !== "object") return null;
  const id = (object as { id?: unknown }).id;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) return null;
  return { event: typeof event === "string" ? event : "", paymentId: id };
}

// ---------------------------------------------------------------- загрузка

/** Платежи покупателя, новые сверху; нет базы — причина строкой. */
export async function loadAccountPayments(
  account: string,
): Promise<PaymentRow[] | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  try {
    return await access.client.query(api.tables.biz_payments.listForAccount, {
      token: access.token,
      account,
    });
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Все платежи для админки, новые сверху. */
export async function loadAllPayments(): Promise<PaymentRow[] | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  try {
    return await access.client.query(api.tables.biz_payments.listForAdmin, {
      token: access.token,
    });
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}
