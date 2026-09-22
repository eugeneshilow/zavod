"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
 * Добавить идею. Пустой текст — не падение экрана, а возврат на тот же адрес с
 * пометкой: владелец видит строку «идея пустая» над полем. Идея рождается
 * ждущей выбора: в работу её отправляет кнопка (⚖️ ideas-table-before-airtime).
 */
export async function addIdea(formData: FormData): Promise<void> {
  const network = String(formData.get("network") ?? "instagram");
  const text = String(formData.get("text") ?? "").trim();
  if (text.length === 0) redirect(`/admin/social/${network}?idea=empty`);
  const access = reelsAccess();
  if ("reason" in access) throw new Error(`идею не добавить: ${access.reason}`);
  await access.client.mutation(api.tables.ops_reel_ideas.add, { token: access.token, text });
  paths(network);
  redirect(`/admin/social/${network}?idea=ok#ideas`);
}

/** Одна кнопка строки идеи: своя мутация, тот же пропуск, тот же возврат. */
async function ideaButton(
  formData: FormData,
  mutation:
    | typeof api.tables.ops_reel_ideas.start
    | typeof api.tables.ops_reel_ideas.remove
    | typeof api.tables.ops_reel_ideas.stop
    | typeof api.tables.ops_reel_ideas.rewrite
    | typeof api.tables.ops_reel_ideas.withdraw,
  what: string,
): Promise<void> {
  const network = String(formData.get("network") ?? "instagram");
  const id = String(formData.get("id") ?? "").trim();
  if (id.length === 0) throw new Error(`${what}: не сказано, какая идея`);
  const access = reelsAccess();
  if ("reason" in access) throw new Error(`${what}: ${access.reason}`);
  await access.client.mutation(mutation, {
    token: access.token,
    id: id as Id<"ops_reel_ideas">,
  });
  paths(network);
  redirect(`/admin/social/${network}#ideas`);
}

/** «В работу»: идея уходит раннеру. */
export async function startIdea(formData: FormData): Promise<void> {
  await ideaButton(formData, api.tables.ops_reel_ideas.start, "идею не отправить в работу");
}

/** «Убрать»: строка уходит совсем. */
export async function removeIdea(formData: FormData): Promise<void> {
  await ideaButton(formData, api.tables.ops_reel_ideas.remove, "идею не убрать");
}

/** «Остановить»: раннер увидит это перед следующей фазой и прекратит работу. */
export async function stopIdea(formData: FormData): Promise<void> {
  await ideaButton(formData, api.tables.ops_reel_ideas.stop, "идею не остановить");
}

/** «Переписать»: старый ролик снимается с очереди, история пишется заново. */
export async function rewriteIdea(formData: FormData): Promise<void> {
  await ideaButton(formData, api.tables.ops_reel_ideas.rewrite, "идею не переписать");
}

/** «Снять»: ролик снимается с очереди и в эфир не выходит. */
export async function withdrawIdea(formData: FormData): Promise<void> {
  await ideaButton(formData, api.tables.ops_reel_ideas.withdraw, "ролик не снять");
}
