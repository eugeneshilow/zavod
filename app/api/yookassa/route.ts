import { api } from "@/convex/_generated/api";
import { fetchYookassaPayment, parseNotification, paymentsAccess } from "@/lib/payments";
import { reelsAccess } from "@/lib/reels";

// Приёмник уведомлений ЮKassa. Телу не верит: берёт из него только номер
// платежа, сам спрашивает ЮKassa статус и пишет в строку то, что ответила
// ЮKassa. Мусор, чужой номер, выключенная касса — 200 и ничего. Сбой на
// нашей стороне (ЮKassa или база не ответили) — 500: ЮKassa повторит
// уведомление, оплата не потеряется. Канон — docs/payments/README.md.

export const dynamic = "force-dynamic";

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return text("не JSON — пропущено");
  }
  const note = parseNotification(body);
  if (!note) return text("не уведомление о платеже — пропущено");
  const keys = paymentsAccess();
  if ("reason" in keys) return text(`касса не подключена: ${keys.reason}`);
  const access = reelsAccess();
  if ("reason" in access) return text(`база недоступна: ${access.reason}`, 500);

  let payment;
  try {
    payment = await fetchYookassaPayment({ ...keys, id: note.paymentId });
  } catch (error) {
    return text(`ЮKassa не ответила: ${error instanceof Error ? error.message : error}`, 500);
  }
  if (!payment.orderId) return text("платёж не наш — пропущено");
  const status =
    payment.status === "succeeded"
      ? "succeeded"
      : payment.status === "canceled"
        ? "canceled"
        : null;
  if (!status) return text(`статус ${payment.status} — ждём дальше`);
  try {
    const result = await access.client.mutation(api.tables.biz_payments.setStatus, {
      token: access.token,
      orderId: payment.orderId,
      status,
      ...(status === "succeeded" && payment.paidAt !== null ? { paidAt: payment.paidAt } : {}),
    });
    return text(`${payment.orderId}: ${status} (${result})`);
  } catch (error) {
    return text(`база не записала: ${error instanceof Error ? error.message : error}`, 500);
  }
}

export function GET(): Response {
  return text("405: сюда ЮKassa шлёт POST", 405);
}
