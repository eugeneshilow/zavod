"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkoutInput, PAY_PATH, requestOrigin, SITE_ACCOUNT, startPayment } from "@/lib/payments";

// Кнопка «Оплатить» на витрине: вход не нужен, почта обязательна всегда,
// строка платежа — на аккаунт витрины. Старт оплаты — общий с кабинетом.
// Канон — docs/payments/README.md, «Путь оплаты».

function back(reason: string): never {
  redirect(`${PAY_PATH}?error=${encodeURIComponent(reason.slice(0, 200))}`);
}

export async function paySite(formData: FormData): Promise<void> {
  const input = checkoutInput(formData, { emailRequired: true });
  if ("reason" in input) back(input.reason);
  const started = await startPayment({
    ...input,
    account: SITE_ACCOUNT,
    origin: requestOrigin(await headers()),
    returnPath: PAY_PATH,
  });
  if ("reason" in started) back(started.reason);
  redirect(started.confirmationUrl);
}
