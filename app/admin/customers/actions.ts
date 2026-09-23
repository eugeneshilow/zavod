"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";

// Кнопка «Добавить клиента»: мутация add таблицы клиентов под пропуском
// админки. Канон — docs/customers/README.md.

export async function addCustomer(formData: FormData): Promise<void> {
  const access = reelsAccess();
  if ("reason" in access) throw new Error(`клиента не добавить: ${access.reason}`);
  const field = (k: string) => String(formData.get(k) ?? "").trim();
  let error = "";
  try {
    await access.client.mutation(api.tables.biz_customers.add, {
      token: access.token,
      name: field("name"),
      source: field("source") || "руками",
      ...(field("email") ? { email: field("email") } : {}),
      ...(field("telegram") ? { telegram: field("telegram") } : {}),
      ...(field("note") ? { note: field("note") } : {}),
    });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  revalidatePath("/admin/customers");
  redirect(
    error
      ? `/admin/customers?error=${encodeURIComponent(error.slice(0, 160))}`
      : "/admin/customers?added=1",
  );
}
