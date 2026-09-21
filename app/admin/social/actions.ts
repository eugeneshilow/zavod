"use server";

import { revalidatePath } from "next/cache";
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
