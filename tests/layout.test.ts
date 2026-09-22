import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BAND,
  BAND_CLASS,
  COLUMNS,
  EXCEPTIONS,
  RHYTHM,
  SECTION_CLASS,
  columnWidth,
} from "@/lib/layout";

// Поверка Spec-Driven: числа канона docs/brand/layout.md и переносчика
// lib/layout.ts совпадают; классы переносчика несут те же числа; блоки витрины
// берут полосу и секцию из переносчика, а не строкой руками.

const canon = readFileSync("docs/brand/layout.md", "utf8");

function canonNumber(label: string): number {
  const row = canon.split("\n").find((l) => l.startsWith(`| ${label}`));
  if (!row) throw new Error(`в каноне нет строки «${label}»`);
  const cell = row.split("|")[2]?.trim() ?? "";
  const m = cell.match(/\d+/);
  if (!m) throw new Error(`в строке «${label}» нет числа: ${cell}`);
  return Number(m[0]);
}

describe("сетка витрины: канон и переносчик", () => {
  it("полоса, поля, колонки и ритм совпадают с каноном", () => {
    expect(canonNumber("Полоса контента")).toBe(BAND.width);
    expect(canonNumber("Поля на мобиле")).toBe(BAND.edgeMobile);
    expect(canonNumber("Поля от md")).toBe(BAND.edgeDesktop);
    expect(canonNumber("Колонок")).toBe(COLUMNS.count);
    expect(canonNumber("Зазор между колонками")).toBe(COLUMNS.gutter);
    expect(canonNumber("Ритм секций на мобиле")).toBe(RHYTHM.sectionMobile);
    expect(canonNumber("Ритм секций от md")).toBe(RHYTHM.sectionDesktop);
  });

  it("исключения совпадают с каноном", () => {
    expect(canonNumber("Шапка: полоса")).toBe(EXCEPTIONS.navbarWidth);
    expect(canonNumber("Шапка: отступ сверху")).toBe(EXCEPTIONS.navbarTop);
    expect(canonNumber("Герой: полоса")).toBe(EXCEPTIONS.heroWidth);
    expect(canonNumber("Герой: поля на мобиле")).toBe(EXCEPTIONS.heroEdgeMobile);
    expect(canonNumber("Герой: поля от md")).toBe(EXCEPTIONS.heroEdgeDesktop);
  });

  it("классы переносчика несут числа канона (шкала Tailwind: 4 px на единицу)", () => {
    expect(BAND_CLASS).toContain("max-w-6xl"); // 72rem = 1152
    expect(BAND.width).toBe(72 * 16);
    expect(BAND_CLASS).toContain(`px-${BAND.edgeMobile / 4}`);
    expect(BAND_CLASS).toContain(`md:px-${BAND.edgeDesktop / 4}`);
    expect(SECTION_CLASS).toContain(`py-${RHYTHM.sectionMobile / 4}`);
    expect(SECTION_CLASS).toContain(`md:py-${RHYTHM.sectionDesktop / 4}`);
    expect(Math.round(columnWidth())).toBe(67);
  });

  it("блоки витрины берут полосу и секцию из переносчика", () => {
    const exceptions = new Set(["button.tsx", "minimalist-hero.tsx", "site-navbar.tsx"]);
    for (const file of readdirSync("components/ui")) {
      if (exceptions.has(file)) continue;
      const src = readFileSync(`components/ui/${file}`, "utf8");
      expect(src, file).not.toMatch(/max-w-6xl|py-20 md:py-28/);
      expect(src, file).toMatch(/BAND_CLASS/);
    }
  });

  it("накладка сетки читает переносчик, своих чисел не знает", () => {
    const src = readFileSync("components/brand/grid-overlay.tsx", "utf8");
    expect(src).toMatch(/from "@\/lib\/layout"/);
    expect(src).not.toMatch(/1024|1280/);
  });
});
