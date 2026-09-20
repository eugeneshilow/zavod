"use server";

import { revalidatePath } from "next/cache";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";

// Кнопка паузы канала. Страница /admin закрыта basic auth (proxy.ts), а сам
// запрос к Convex закрыт токеном ADMIN_API_TOKEN: без него действие не
// проходит. Канон зоны — docs/publish.md.

export async function setInstagramChannel(formData: FormData): Promise<void> {
  const action = formData.get("action");
  if (action !== "on" && action !== "off") throw new Error("неизвестное действие");
  const reason = String(formData.get("reason") ?? "").trim();

  const access = reelsAccess();
  if ("reason" in access) throw new Error(`канал не переключить: ${access.reason}`);
  const client: ConvexHttpClient = access.client;
  await client.mutation(api.tables.ops_channel_toggles.record, {
    token: access.token,
    channel: "instagram",
    action,
    reason: reason.length >= 3 ? reason : `переключено с /admin (${action})`,
  });
  revalidatePath("/admin");
}
