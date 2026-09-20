import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SECONDS,
  buildXfadeFilter,
  parseSeries,
  renderSlideHtml,
  timeline,
} from "@/scripts/reels/lib.mjs";

const template = readFileSync("content/reels/template.html", "utf8");
const words = JSON.parse(readFileSync("content/reels/series/01-words-agent-uses.json", "utf8"));

/** Та же формула, что в каноне docs/reels.md, написанная здесь заново. */
function expectedSeconds(items: number): number {
  return SECONDS.cover + items * SECONDS.item + SECONDS.outro - (items + 1) * SECONDS.xfade;
}

describe("серия", () => {
  it("обложка, пункты и финал дают N+2 слайдов", () => {
    const series = parseSeries(words);
    expect(words.items).toHaveLength(7);
    expect(series.slides).toHaveLength(words.items.length + 2);
    expect(series.slides[0].kind).toBe("cover");
    expect(series.slides[series.slides.length - 1].kind).toBe("outro");
    expect(series.slides.filter((s: { kind: string }) => s.kind === "item")).toHaveLength(7);
  });

  it("серия без пунктов не собирается", () => {
    expect(() => parseSeries({ ...words, items: [] })).toThrow(/items/);
  });
});

describe("лекало", () => {
  it("подставляет цвета серии в --bg, --ink и --accent", () => {
    const series = parseSeries(words);
    const html = renderSlideHtml(template, series.slides[1], series);
    expect(html).toContain(`--bg:${words.colors.bg}`);
    expect(html).toContain(`--ink:${words.colors.ink}`);
    expect(html).toContain(`--accent:${words.colors.accent}`);
    expect(html).toContain(words.items[0].title);
    expect(html).toContain("vibecoding.tech");
  });

  it("на обложке нет номера, на пункте есть", () => {
    const series = parseSeries(words);
    expect(renderSlideHtml(template, series.slides[0], series)).not.toContain('class="num"');
    expect(renderSlideHtml(template, series.slides[1], series)).toContain('class="num"');
  });
});

describe("тайминг", () => {
  it("семь пунктов дают 3 + 7×3.4 + 3 − 8×0.35 секунды", () => {
    const series = parseSeries(words);
    const { total } = timeline(series.slides);
    expect(expectedSeconds(7)).toBeCloseTo(27.0, 6);
    expect(total).toBeCloseTo(expectedSeconds(7), 6);
  });

  it("кроссфейдов на один меньше, чем слайдов", () => {
    const series = parseSeries(words);
    const { filter, offsets, total } = buildXfadeFilter(series.slides);
    expect(offsets).toHaveLength(series.slides.length - 1);
    expect(filter.match(/xfade=/g)).toHaveLength(series.slides.length - 1);
    expect(filter).toContain("[vout]");
    expect(offsets[0]).toBeCloseTo(SECONDS.cover - SECONDS.xfade, 6);
    expect(total).toBeCloseTo(expectedSeconds(7), 6);
  });
});
