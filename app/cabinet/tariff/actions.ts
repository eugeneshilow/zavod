"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CABINET_PATH, DEMO_CUSTOMER } from "@/lib/cabinet";
import { checkoutInput, receiptsOn, requestOrigin, startPayment } from "@/lib/payments";

// Кнопка «Оплатить» в кабинете: строка на демо-аккаунт, почта обязательна
// только с включёнными чеками. Сам старт оплаты — общий с витриной
// (`startPayment`). Канон — docs/payments/README.md, «Путь оплаты».

const TARIFF_PATH = `${CABINET_PATH}/tariff`;

function back(reason: string): never {
  redirect(`${TARIFF_PATH}?error=${encodeURIComponent(reason.slice(0, 200))}`);
}

export async function buyProduct(formData: FormData): Promise<void> {
  const input = checkoutInput(formData, { emailRequired: receiptsOn() });
  if ("reason" in input) back(input.reason);
  const started = await startPayment({
    ...input,
    account: DEMO_CUSTOMER.account,
    origin: requestOrigin(await headers()),
    returnPath: TARIFF_PATH,
  });
  if ("reason" in started) back(started.reason);
  redirect(started.confirmationUrl);
}
