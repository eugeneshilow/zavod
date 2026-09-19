import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import Admin from "@/app/admin/page";

function envPassword(): string {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith("ADMIN_PASSWORD="));
  if (!line) throw new Error("ADMIN_PASSWORD не найден в .env.local");
  return line.slice("ADMIN_PASSWORD=".length).trim();
}

describe("/admin", () => {
  it("без пароля отвечает 401", () => {
    process.env.ADMIN_PASSWORD = envPassword();
    const res = proxy(new NextRequest("http://localhost:3000/admin"));
    expect(res.status).toBe(401);
  });

  it("с паролем показывает первое решение в списке решений", async () => {
    const password = envPassword();
    process.env.ADMIN_PASSWORD = password;
    const auth = "Basic " + Buffer.from(`user:${password}`).toString("base64");
    const res = proxy(
      new NextRequest("http://localhost:3000/admin", { headers: { authorization: auth } }),
    );
    expect(res.status).toBe(200);
    const html = renderToStaticMarkup(await Admin());
    const list = html.match(/<ul[^>]*data-testid="decisions"[^>]*>([\s\S]*?)<\/ul>/);
    expect(list).not.toBeNull();
    expect(list![1]).toContain("adopt-spec-driven-company");
  });
});
