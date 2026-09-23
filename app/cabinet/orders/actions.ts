"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { reelsAccess } from "@/lib/reels";
import { CABINET_PATH, ORDER_BASE } from "@/lib/cabinet";

// Кнопка «Отменить заказ»: мутация `cancelOrder` под токеном кабинета на
// сервере. Канон — docs/cabinet/README.md, «Отмена».

export async function cancelOrder(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "") === "home" ? CABINET_PATH : `${ORDER_BASE}/${id}`;
  const access = reelsAccess();
  if ("reason" in access) redirect(`${back}?error=${encodeURIComponent(access.reason)}`);
  let reason = "";
  try {
    await access.client.mutation(api.tables.ops_reel_ideas.cancelOrder, {
      token: access.token,
      id: id as Id<"ops_reel_ideas">,
    });
  } catch (error) {
    reason = error instanceof Error ? error.message : String(error);
  }
  revalidatePath(CABINET_PATH);
  redirect(reason ? `${back}?error=${encodeURIComponent(reason.slice(0, 200))}` : back);
}
