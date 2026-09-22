import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAB_LOCKUP, LAB_VARIANTS, type LabTone } from "@/lib/brand-lab";

const canon = readFileSync("docs/brand/lab.md", "utf8");
const tones: LabTone[] = ["color", "mono"];
const palette = ["#F5B700", "#000000", "#FFFFFF"];

describe("полигон логотипов", () => {
  it("содержит 10–12 именованных вариантов из семи или более семейств", () => {
    expect(LAB_VARIANTS.length).toBeGreaterThanOrEqual(10);
    expect(LAB_VARIANTS.length).toBeLessThanOrEqual(12);
    expect(new Set(LAB_VARIANTS.map(({ id }) => id)).size).toBe(LAB_VARIANTS.length);
    expect(new Set(LAB_VARIANTS.map(({ family }) => family)).size).toBeGreaterThanOrEqual(7);
    for (const { id, title, idea, family } of LAB_VARIANTS) {
      expect(id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(title.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
      expect(title.trim().split(/\s+/).length).toBeLessThanOrEqual(3);
      expect(idea.trim()).not.toBe("");
      expect(family.trim()).not.toBe("");
    }
  });

  it("таблица канона совпадает с массивом по id, названию, семейству и мысли", () => {
    const table = canon.split("## Варианты")[1]?.split("\n## ")[0];
    expect(table).toBeDefined();
    const rows = table!
      .split("\n")
      .filter((line) => line.startsWith("|"))
      .slice(2)
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim()),
      );
    expect(rows).toEqual(
      LAB_VARIANTS.map(({ id, title, family, idea }) => [id, title, family, idea]),
    );
  });

  it("общие пропорции пары совпадают с каноном", () => {
    function value(label: string) {
      const row = canon.split("\n").find((line) => line.startsWith(`| ${label}`));
      return row?.split("|")[2]?.trim().replace(",", ".");
    }
    expect(Number(value("Кегль слова"))).toBe(LAB_LOCKUP.fontSize);
    expect(Number(value("Сторона квадрата знака"))).toBe(LAB_LOCKUP.markPerEm);
    expect(Number(value("Зазор после квадрата"))).toBe(LAB_LOCKUP.gapPerEm);
    expect(Number(value("Разрядка слова"))).toBe(LAB_LOCKUP.tracking);
    expect(Number(value("Вес Inter"))).toBe(LAB_LOCKUP.weight);
    expect(value("viewBox длинной формы")).toBe(`0 0 ${LAB_LOCKUP.width} ${LAB_LOCKUP.height}`);
  });

  describe.each(LAB_VARIANTS)("$id", (variant) => {
    it.each(tones)("%s: знак — квадратная геометрия, пара — SVG со словом", (tone) => {
      const mark = variant.mark(tone);
      const lockup = variant.lockup(tone);
      for (const svg of [mark, lockup]) {
        expect(typeof svg).toBe("string");
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg.endsWith("</svg>")).toBe(true);
        expect(svg).not.toMatch(
          /<(?:image|script|foreignObject|filter|linearGradient|radialGradient)\b/i,
        );
      }
      expect(mark).toContain('viewBox="0 0 1024 1024"');
      expect(mark).not.toMatch(/<text|font-/i);
      expect(lockup).toContain(`viewBox="0 0 ${LAB_LOCKUP.width} ${LAB_LOCKUP.height}"`);
      expect(lockup).toContain('font-family="Inter, system-ui, sans-serif"');
      expect(lockup).toContain('font-weight="700"');
      expect(lockup).toContain('letter-spacing="0.05em"');
      expect(lockup).toContain(">zavod</text>");
    });

    it.each(tones)("%s: только разрешённая палитра, моно без жёлтого", (tone) => {
      for (const svg of [variant.mark(tone), variant.lockup(tone)]) {
        const colors = [...svg.matchAll(/#[\da-f]+/gi)].map(([color]) => color.toUpperCase());
        expect(colors.length).toBeGreaterThan(0);
        for (const color of colors) expect(palette).toContain(color);
        if (tone === "mono") expect(colors).not.toContain("#F5B700");
        // Не пропускаем обход палитры через rgb(), именованные цвета или CSS.
        for (const [, paint] of svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)) {
          expect([...palette, ...(tone === "color" ? ["CURRENTCOLOR"] : [])]).toContain(
            paint.toUpperCase(),
          );
        }
        expect(svg).not.toMatch(/(?:rgba?|hsla?|oklch|color)\(|(?:fill|stroke)\s*:/i);
      }
      expect(variant.mark(tone)).not.toContain("currentColor");
    });
  });
});
