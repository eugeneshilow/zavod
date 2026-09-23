"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";
import { CABINET_PATH, DEMO_CUSTOMER, ORDER_PATH, parseOrder } from "@/lib/cabinet";

// Кнопка «Сделать ролик»: форма в мутацию `order` под токеном кабинета на
// сервере; идея сразу в работе, раннер на Pro берёт её за один тик.
// Канон — docs/cabinet/README.md, «Экран заказа».

function back(reason: string): never {
  redirect(`${ORDER_PATH}?error=${encodeURIComponent(reason.slice(0, 200))}`);
}

export async function orderReel(formData: FormData): Promise<void> {
  const parsed = parseOrder({
    idea: formData.get("idea") as string | null,
    voice: formData.get("voice") as string | null,
    to: formData.getAll("to").map(String),
    note: formData.get("note") as string | null,
  });
  if ("error" in parsed) back(parsed.error);
  const access = reelsAccess();
  if ("reason" in access) back(access.reason);
  try {
    await access.client.mutation(api.tables.ops_reel_ideas.order, {
      token: access.token,
      text: parsed.text,
      voice: parsed.voice,
      to: parsed.to,
      account: DEMO_CUSTOMER.account,
      ...(parsed.wish ? { wish: parsed.wish } : {}),
    });
  } catch (error) {
    back(error instanceof Error ? error.message : String(error));
  }
  revalidatePath(CABINET_PATH);
  redirect(`${CABINET_PATH}?order=ok`);
}
