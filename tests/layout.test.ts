import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AXES,
  BAND,
  BAND_CLASS,
  COLUMNS,
  NAVBAR,
  RHYTHM,
  SECTION_CLASS,
  axisX,
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
    expect(canonNumber("Поля на мобиле")).toBe(BAND.edgeMobile);
    expect(canonNumber("Поля от md")).toBe(BAND.edgeDesktop);
    expect(canonNumber("Колонок")).toBe(COLUMNS.count);
    expect(canonNumber("Зазор между колонками")).toBe(COLUMNS.gutter);
    expect(canonNumber("Ритм секций на мобиле")).toBe(RHYTHM.sectionMobile);
    expect(canonNumber("Ритм секций от md")).toBe(RHYTHM.sectionDesktop);
  });

  it("оси накладки: три, и они совпадают с каноном", () => {
    expect(canonNumber("Шапка: высота пилюли")).toBe(NAVBAR.height);
    expect(AXES.H1).toBe(NAVBAR.top + NAVBAR.height);
    const row = (id: string) => canon.split("\n").find((l) => l.startsWith(`| ${id} `)) ?? "";
    expect(Number(row("V1").split("|")[3])).toBe(axisX(1440).V1);
    expect(Number(row("V2").split("|")[3])).toBe(axisX(1440).V2);
    expect(Number(row("H1").split("|")[3])).toBe(AXES.H1);
    const overlay = readFileSync("components/brand/grid-overlay.tsx", "utf8");
    // ровно три оси: пара вертикалей одним боксом border-x и одна горизонталь border-t
    expect(overlay.match(/className="absolute inset-y-0 border-x"/g)).toHaveLength(1);
    expect(overlay.match(/className="absolute inset-x-0 border-t-2"/g)).toHaveLength(1);
    expect(overlay.match(/<AxisTag id="(V1|V2|H1)"/g)).toHaveLength(3);
  });

  it("шапка совпадает с каноном и стоит на полосе", () => {
    expect(canonNumber("Шапка: отступ сверху")).toBe(NAVBAR.top);
    const navbar = readFileSync("components/ui/site-navbar.tsx", "utf8");
    expect(navbar).toMatch(/BAND_CLASS/);
    expect(navbar).toMatch(/NAVBAR_BAND_CLASS/);
    expect(navbar).not.toMatch(/max-w-5xl|max-w-6xl/);
  });

  it("классы переносчика несут числа канона (шкала Tailwind: 4 px на единицу)", () => {
    expect(BAND_CLASS).toContain(`max-w-[${BAND.width}px]`);
    expect(BAND.width - BAND.edgeDesktop * 2).toBe(1280); // сетка героя
    expect(canonNumber("Полоса с полями")).toBe(BAND.width);
    expect(BAND_CLASS).toContain(`px-${BAND.edgeMobile / 4}`);
    expect(BAND_CLASS).toContain(`md:px-${BAND.edgeDesktop / 4}`);
    expect(SECTION_CLASS).toContain(`py-${RHYTHM.sectionMobile / 4}`);
    expect(SECTION_CLASS).toContain(`md:py-${RHYTHM.sectionDesktop / 4}`);
    expect(Math.round(columnWidth())).toBe(85);
  });

  it("блоки витрины берут полосу и секцию из переносчика", () => {
    const exceptions = new Set(["button.tsx", "minimalist-hero.tsx", "site-navbar.tsx"]);
    for (const file of readdirSync("components/ui")) {
      if (exceptions.has(file)) continue;
      const src = readFileSync(`components/ui/${file}`, "utf8");
      expect(src, file).not.toMatch(/max-w-6xl|max-w-\[1376px\]|py-20 md:py-28/);
      expect(src, file).toMatch(/BAND_CLASS/);
    }
  });

  it("накладка сетки читает переносчик, своих чисел не знает", () => {
    const src = readFileSync("components/brand/grid-overlay.tsx", "utf8");
    expect(src).toMatch(/from "@\/lib\/layout"/);
    expect(src).not.toMatch(/1024|1280/);
  });
});
