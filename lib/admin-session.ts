// Вход в админку и кабинет: страница с паролем выдаёт подписанную куку на
// 90 дней, и браузер больше не спрашивает. Кука общая для zavod.today и
// app.zavod.today. Подпись — HMAC-SHA256 от срока ключом ADMIN_PASSWORD:
// сменил пароль — все входы разом погасли. Канон — docs/admin.md «Доступ».
// Web Crypto: файл работает и в proxy, и на сервере.

export const SESSION_COOKIE = "zavod_admin";
export const SESSION_DAYS = 90;
/** Осталось меньше этого — вход продлевается ещё на 90 дней при заходе. */
export const RENEW_DAYS = 30;
const DAY = 86_400_000;

async function sign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Значение куки: срок и подпись срока. */
export async function makeSession(secret: string, now = Date.now()): Promise<string> {
  const exp = now + SESSION_DAYS * DAY;
  return `${exp}.${await sign(secret, `zavod-admin:${exp}`)}`;
}

/** Кука жива и подписана этим паролем; renew — пора продлить. */
export async function checkSession(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<{ ok: boolean; renew: boolean }> {
  if (!value) return { ok: false, renew: false };
  const [expRaw, mac] = value.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || !mac || exp <= now) return { ok: false, renew: false };
  const expected = await sign(secret, `zavod-admin:${exp}`);
  if (expected.length !== mac.length) return { ok: false, renew: false };
  let diff = 0;
  for (let i = 0; i < mac.length; i += 1) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return { ok: false, renew: false };
  return { ok: true, renew: exp - now < RENEW_DAYS * DAY };
}

/** Домен куки: на проде общий для zavod.today и app.zavod.today, локально — свой. */
export function cookieDomain(host: string | null | undefined): string | undefined {
  const name = (host ?? "").split(":")[0].toLowerCase();
  return name === "zavod.today" || name.endsWith(".zavod.today") ? ".zavod.today" : undefined;
}

export function cookieOptions(host: string | null | undefined) {
  const name = (host ?? "").split(":")[0];
  const local = name === "localhost" || name.endsWith(".localhost");
  return {
    httpOnly: true,
    secure: !local,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    domain: cookieDomain(host),
  };
}

/** Куда вернуть после входа: только свой путь, не чужой адрес. */
export function safeNext(next: string | null | undefined): string {
  const value = (next ?? "").trim();
  return value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}
