import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import {
  checkSession,
  cookieDomain,
  makeSession,
  RENEW_DAYS,
  safeNext,
  SESSION_COOKIE,
  SESSION_DAYS,
} from "@/lib/admin-session";

// Вход на 90 дней: подпись, срок, продление, общий домен, возврат после
// входа и что proxy пускает по куке. Канон — docs/admin.md «Доступ».

const DAY = 86_400_000;
const now = Date.UTC(2026, 8, 24, 12, 0, 0);

describe("кука входа", () => {
  it("живёт 90 дней и подписана паролем", async () => {
    const value = await makeSession("secret", now);
    expect(Number(value.split(".")[0])).toBe(now + SESSION_DAYS * DAY);
    expect(await checkSession(value, "secret", now)).toEqual({ ok: true, renew: false });
    expect((await checkSession(value, "other", now)).ok).toBe(false);
    expect((await checkSession(value, "secret", now + SESSION_DAYS * DAY + 1)).ok).toBe(false);
  });

  it("подделанный срок не проходит, близкий конец продлевается", async () => {
    const value = await makeSession("secret", now);
    const [, mac] = value.split(".");
    expect((await checkSession(`${now + 999 * DAY}.${mac}`, "secret", now)).ok).toBe(false);
    const late = now + (SESSION_DAYS - RENEW_DAYS + 1) * DAY;
    expect(await checkSession(value, "secret", late)).toEqual({ ok: true, renew: true });
    expect((await checkSession(undefined, "secret", now)).ok).toBe(false);
  });

  it("домен общий для zavod.today и app, локально свой; возврат только на свой путь", () => {
    expect(cookieDomain("zavod.today")).toBe(".zavod.today");
    expect(cookieDomain("app.zavod.today")).toBe(".zavod.today");
    expect(cookieDomain("localhost:3400")).toBeUndefined();
    expect(safeNext("/admin/customers")).toBe("/admin/customers");
    expect(safeNext("//evil.com")).toBe("/admin");
    expect(safeNext("https://evil.com")).toBe("/admin");
  });

  it("proxy пускает по куке без окна пароля, страница входа открыта", async () => {
    process.env.ADMIN_PASSWORD = "test-pass";
    const value = await makeSession("test-pass");
    const res = await proxy(
      new NextRequest("http://localhost:3400/admin", {
        headers: { cookie: `${SESSION_COOKIE}=${value}` },
      }),
    );
    expect(res.status).toBe(200);
    const login = await proxy(
      new NextRequest("http://app.localhost:3400/login", {
        headers: { host: "app.localhost:3400" },
      }),
    );
    expect(login.status).toBe(200);
    expect(login.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
