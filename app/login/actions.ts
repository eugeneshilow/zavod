"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookieOptions, makeSession, safeNext, SESSION_COOKIE } from "@/lib/admin-session";

// Вход: пароль сверяется с ADMIN_PASSWORD, браузер получает куку на 90 дней.

export async function login(formData: FormData): Promise<void> {
  const next = safeNext(String(formData.get("next") ?? ""));
  const expected = process.env.ADMIN_PASSWORD;
  const password = String(formData.get("password") ?? "");
  if (!expected || password !== expected) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const host = (await headers()).get("host");
  (await cookies()).set(SESSION_COOKIE, await makeSession(expected), cookieOptions(host));
  redirect(next);
}
