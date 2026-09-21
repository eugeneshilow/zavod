"use server";

import { revalidatePath } from "next/cache";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { CHANNELS, reelsAccess, type Channel } from "@/lib/reels";

// Кнопки паузы: своя на каждую дверь публикации. Страница /admin закрыта
// basic auth (proxy.ts), а сам запрос к Convex закрыт токеном ADMIN_API_TOKEN:
// без него действие не проходит. Канон зоны — docs/publish.md.

export async function setChannelState(formData: FormData): Promise<void> {
  const action = formData.get("action");
  if (action !== "on" && action !== "off") throw new Error("неизвестное действие");
  const channel = String(formData.get("channel") ?? "");
  if (!CHANNELS.includes(channel as Channel)) throw new Error(`неизвестная дверь: ${channel}`);
  const reason = String(formData.get("reason") ?? "").trim();

  const access = reelsAccess();
  if ("reason" in access) throw new Error(`канал не переключить: ${access.reason}`);
  const client: ConvexHttpClient = access.client;
  await client.mutation(api.tables.ops_channel_toggles.record, {
    token: access.token,
    channel,
    action,
    reason: reason.length >= 3 ? reason : `переключено с /admin (${action})`,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/publish");
}
