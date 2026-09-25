import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import Admin from "@/app/admin/page";

function envPassword(): string {
  if (existsSync(".env.local")) {
    const line = readFileSync(".env.local", "utf8")
      .split("\n")
      .find((l) => l.startsWith("ADMIN_PASSWORD="));
    if (line) return line.slice("ADMIN_PASSWORD=".length).trim();
  }
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  throw new Error("ADMIN_PASSWORD не найден ни в .env.local, ни в окружении");
}

describe("/admin", () => {
  it("без входа ведёт на страницу входа и помнит, куда вернуть", async () => {
    process.env.ADMIN_PASSWORD = envPassword();
    const res = await proxy(new NextRequest("http://localhost:3000/admin/customers"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fadmin%2Fcustomers",
    );
  });

  it("оферта на основном домене открыта без входа", async () => {
    process.env.ADMIN_PASSWORD = envPassword();
    const res = await proxy(
      new NextRequest("http://localhost:3000/offer", { headers: { host: "localhost:3000" } }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("с паролем показывает двери зон хедера", async () => {
    const password = envPassword();
    process.env.ADMIN_PASSWORD = password;
    const auth = "Basic " + Buffer.from(`user:${password}`).toString("base64");
    const res = await proxy(
      new NextRequest("http://localhost:3000/admin", { headers: { authorization: auth } }),
    );
    expect(res.status).toBe(200);
    const html = renderToStaticMarkup(await Admin());
    const zones = html.match(/<div[^>]*data-testid="zones"[^>]*>([\s\S]*?)<\/section>/);
    expect(zones).not.toBeNull();
    expect(zones![1]).toContain('href="/admin/brains"');
    expect(zones![1]).toContain('href="/admin/social"');
  });
});
