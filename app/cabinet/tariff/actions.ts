"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";
import { CABINET_PATH, DEMO_CUSTOMER } from "@/lib/cabinet";
import {
  createYookassaPayment,
  isEmail,
  newOrderId,
  paymentsAccess,
  productOf,
  receiptsOn,
  requestOrigin,
} from "@/lib/payments";

// Кнопка «Оплатить»: строка `pending` в базе, платёж в ЮKassa, покупатель
// уезжает на её страницу оплаты. Возврат оплату не подтверждает — это делает
// приёмник уведомлений. С включёнными чеками почта обязательна и уходит в
// ЮKassa полем `receipt`. Канон — docs/payments/README.md, «Путь оплаты» и
// «Бой: чеки, оферта, возвраты».

const TARIFF_PATH = `${CABINET_PATH}/tariff`;

function back(reason: string): never {
  redirect(`${TARIFF_PATH}?error=${encodeURIComponent(reason.slice(0, 200))}`);
}

export async function buyProduct(formData: FormData): Promise<void> {
  const product = productOf(String(formData.get("product") ?? ""));
  if (!product) back("такого товара нет");
  const email = String(formData.get("email") ?? "").trim();
  const receipts = receiptsOn();
  if (receipts && !email) back("укажите почту для чека");
  if (email && !isEmail(email)) back("почта для чека не похожа на адрес");
  const keys = paymentsAccess();
  if ("reason" in keys) back(`касса не подключена: ${keys.reason}`);
  const access = reelsAccess();
  if ("reason" in access) back(access.reason);
  const orderId = newOrderId();
  const origin = requestOrigin(await headers());
  let confirmationUrl: string;
  try {
    await access.client.mutation(api.tables.biz_payments.create, {
      token: access.token,
      orderId,
      product: product.id,
      amountRub: product.priceRub,
      account: DEMO_CUSTOMER.account,
      // Касса стоит на тестовом магазине; ответ ЮKassa уточнит режим ниже.
      test: true,
      ...(email ? { email } : {}),
    });
    const payment = await createYookassaPayment({
      ...keys,
      orderId,
      amountRub: product.priceRub,
      description: `zavod.today · ${product.title} · ${orderId}`,
      returnUrl: `${origin}${TARIFF_PATH}?order=${orderId}`,
      ...(receipts
        ? { receipt: { email, description: product.title, amountRub: product.priceRub } }
        : {}),
    });
    await access.client.mutation(api.tables.biz_payments.attachYookassa, {
      token: access.token,
      orderId,
      yookassaId: payment.id,
      test: payment.test,
    });
    confirmationUrl = payment.confirmationUrl;
  } catch (error) {
    back(error instanceof Error ? error.message : String(error));
  }
  redirect(confirmationUrl);
}
