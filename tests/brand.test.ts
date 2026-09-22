import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLEAR_SPACE, LOCKUP, MARK, MIN_SIZE, WORD, letterPath, markSvg } from "@/lib/brand";

// Поверка Spec-Driven: числа канона docs/brand/logo.md и переносчика lib/brand.ts
// совпадают; favicon — копия знака из переносчика; логотип на поверхностях стоит
// компонентом, а не словом руками.

const canon = readFileSync("docs/brand/logo.md", "utf8");

/** Число из строки таблицы канона по подписи ячейки. */
function canonNumber(label: string): number {
  const row = canon.split("\n").find((l) => l.startsWith(`| ${label}`));
  if (!row) throw new Error(`в каноне нет строки «${label}»`);
  const cell = row.split("|")[2]?.trim() ?? "";
  const m = cell.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) throw new Error(`в строке «${label}» нет числа: ${cell}`);
  return Number(m[0]);
}

describe("логотип: канон и переносчик", () => {
  it("числа знака совпадают с таблицей канона", () => {
    expect(canonNumber("Сторона квадрата")).toBe(MARK.size);
    expect(canonNumber("Буква: левый край")).toBe(MARK.left);
    expect(canonNumber("Буква: правый край")).toBe(MARK.right);
    expect(canonNumber("Буква: верх")).toBe(MARK.top);
    expect(canonNumber("Буква: низ")).toBe(MARK.bottom);
    expect(canonNumber("Толщина горизонтальных штрихов")).toBe(MARK.stroke);
    expect(canonNumber("Сдвиг кромок диагонали")).toBe(MARK.diagonal);
  });

  it("написание, охранное поле и минимумы совпадают с каноном", () => {
    expect(canonNumber("Диаметр знака")).toBe(LOCKUP.markPerEm);
    expect(canonNumber("Зазор знак — слово")).toBe(LOCKUP.gapPerEm);
    expect(canonNumber("Разрядка слова")).toBe(LOCKUP.tracking);
    expect(canonNumber("Шрифт")).toBe(LOCKUP.weight);
    expect(canonNumber("Охранное поле")).toBe(CLEAR_SPACE);
    expect(canonNumber("Минимум: знак")).toBe(MIN_SIZE.mark);
    expect(canonNumber("Минимум: слово")).toBe(MIN_SIZE.word);
  });

  it("буква вписана в квадрат, штрихи не наезжают друг на друга", () => {
    expect(MARK.left).toBeGreaterThan(0);
    expect(MARK.right).toBeLessThan(MARK.size);
    expect(MARK.bottom - MARK.top).toBeGreaterThan(MARK.stroke * 3);
    expect(MARK.right - MARK.left).toBe(MARK.bottom - MARK.top);
    expect(letterPath()).toMatch(
      /^M \d+ \d+ H \d+ V \d+ L \d+ \d+ H \d+ V \d+ H \d+ V \d+ L \d+ \d+ H \d+ Z$/,
    );
  });

  it("favicon — копия знака из переносчика", () => {
    expect(readFileSync("app/icon.svg", "utf8")).toBe(markSvg());
    expect(markSvg()).toContain(`aria-label="${WORD}"`);
    expect(markSvg("mono")).not.toBe(markSvg("color"));
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
