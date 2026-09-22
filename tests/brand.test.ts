import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DOWNLOADS, LOGO_FILES, PALETTE, RULES, WORD, horizontalSrc, logoFile } from "@/lib/brand";

// Поверка Spec-Driven: реестр файлов переносчика лежит на диске и совпадает с
// таблицей канона docs/brand/logo.md; закладка браузера — копия файла набора;
// поверхности берут логотип компонентом; кнопки скачивания ссылаются на реестр.

const canon = readFileSync("docs/brand/logo.md", "utf8");

function canonIds(): string[] {
  const start = canon.indexOf("## Файлы");
  const end = canon.indexOf("## Где стоит");
  return canon
    .slice(start, end)
    .split("\n")
    .filter((l) => /^\| [a-z][a-z0-9-]* +\|/.test(l) && !l.startsWith("| id"))
    .map((l) => l.split("|")[1].trim());
}

function canonNumber(label: string): number {
  const row = canon.split("\n").find((l) => l.startsWith(`| ${label}`));
  if (!row) throw new Error(`в каноне нет строки «${label}»`);
  const m = (row.split("|")[2] ?? "").replace(",", ".").match(/\d+(\.\d+)?/);
  if (!m) throw new Error(`в строке «${label}» нет числа`);
  return Number(m[0]);
}

describe("логотип: набор, канон и переносчик", () => {
  it("каждый файл реестра лежит в public и id уникальны", () => {
    const ids = new Set<string>();
    for (const f of LOGO_FILES) {
      expect(existsSync(`public${f.path}`), f.path).toBe(true);
      expect(ids.has(f.id), f.id).toBe(false);
      ids.add(f.id);
    }
    expect(LOGO_FILES.length).toBeGreaterThanOrEqual(12);
  });

  it("таблица «Файлы» канона повторяет реестр по id и порядку", () => {
    expect(canonIds()).toEqual(LOGO_FILES.map((f) => f.id));
  });

  it("палитра канона совпадает с переносчиком", () => {
    for (const hex of [
      PALETTE.teal,
      PALETTE.fold,
      PALETTE.ink,
      PALETTE.mint,
      PALETTE.mintFold,
      PALETTE.paper,
    ]) {
      expect(canon, hex).toContain(`\`${hex}\``);
    }
    const pack = JSON.parse(readFileSync("public/brand/logo/brand/palette.json", "utf8"));
    expect(pack.teal).toBe(PALETTE.teal);
    expect(pack.ink).toBe(PALETTE.ink);
  });

  it("правила совпадают с каноном", () => {
    expect(canonNumber("Минимум полного логотипа")).toBe(RULES.minHorizontal);
    expect(canonNumber("Минимум отдельного цветного знака")).toBe(RULES.minMark);
    expect(canonNumber("Свободное поле вокруг знака")).toBe(RULES.clearSpace);
  });

  it("закладка браузера — копии файлов набора", () => {
    expect(readFileSync("app/icon.svg", "utf8")).toBe(
      readFileSync(`public${logoFile("favicon-svg").path}`, "utf8"),
    );
    expect(readFileSync("app/favicon.ico")).toEqual(
      readFileSync(`public${logoFile("favicon-ico").path}`),
    );
    expect(readFileSync("app/apple-icon.png")).toEqual(
      readFileSync(`public${logoFile("touch-icon-png").path}`),
    );
  });

  it("кнопки скачивания ссылаются на файлы реестра", () => {
    for (const d of DOWNLOADS) expect(() => logoFile(d.fileId), d.label).not.toThrow();
    expect(DOWNLOADS.map((d) => d.label)).toContain("Telegram");
    expect(horizontalSrc("primary")).toMatch(/\.svg$/);
    expect(WORD).toBe("zavod.today");
  });

  it("на поверхностях логотип стоит компонентом, не словом руками", () => {
    for (const file of [
      "components/ui/site-navbar.tsx",
      "components/ui/site-footer.tsx",
      "app/admin/_components/top-nav.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, file).toMatch(/<Logo\b/);
      expect(src, file).not.toMatch(/>\s*zavod\s*</);
    }
  });
});
