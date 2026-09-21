"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";

// Кнопки «сейчас» экрана сети: тот же тик, что у кронов, по клику. Пропуск —
// ADMIN_API_TOKEN, как у паузы двери. Канон — docs/social/README.md.

function paths(network: string): void {
  revalidatePath("/admin/social");
  revalidatePath(`/admin/social/${network}`);
  revalidatePath("/admin/publish");
}

export async function runQueueNow(formData: FormData): Promise<void> {
  const access = reelsAccess();
  if ("reason" in access) throw new Error(`очередь не прогнать: ${access.reason}`);
  await access.client.action(api.services.admin_actions.runQueueNow, { token: access.token });
  paths(String(formData.get("network") ?? ""));
}

export async function collectMetricsNow(formData: FormData): Promise<void> {
  const access = reelsAccess();
  if ("reason" in access) throw new Error(`цифры не снять: ${access.reason}`);
  await access.client.action(api.services.admin_actions.collectMetricsNow, {
    token: access.token,
  });
  paths(String(formData.get("network") ?? ""));
}

/**
 * Положить идею в лоток. Пустой текст — не падение экрана, а возврат на тот же
 * адрес с пометкой: владелец видит строку «идея пустая» над полем.
 */
export async function addIdea(formData: FormData): Promise<void> {
  const network = String(formData.get("network") ?? "instagram");
  const text = String(formData.get("text") ?? "").trim();
  if (text.length === 0) redirect(`/admin/social/${network}?idea=empty`);
  const access = reelsAccess();
  if ("reason" in access) throw new Error(`идею не положить: ${access.reason}`);
  await access.client.mutation(api.tables.ops_reel_ideas.add, { token: access.token, text });
  paths(network);
  redirect(`/admin/social/${network}?idea=ok#ideas`);
}
