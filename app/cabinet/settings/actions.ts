"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CABINET_PATH, PREFS_COOKIE, parsePrefs } from "@/lib/cabinet";

// Настройки покупателя до входа живут в куке браузера: голос и площадки по
// умолчанию, форма заказа открывается с ними. Канон — docs/cabinet/README.md.

export async function savePrefs(formData: FormData): Promise<void> {
  const prefs = parsePrefs(
    encodeURIComponent(
      JSON.stringify({ voice: formData.get("voice"), to: formData.getAll("to").map(String) }),
    ),
  );
  (await cookies()).set(PREFS_COOKIE, encodeURIComponent(JSON.stringify(prefs)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect(`${CABINET_PATH}/settings?saved=1`);
}
