import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { heroMetric, landingBlocks, reelWord, HERO_METRIC_FALLBACK } from "@/lib/landing";

const readme = readFileSync("docs/landing/README.md", "utf8");

describe("блоки витрины", () => {
  it("читаются из канона зоны в его порядке", () => {
    const blocks = landingBlocks(readme);
    expect(blocks).toHaveLength(11);
    expect(blocks.map((b) => b.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(blocks[0].title).toBe("Шапка");
    expect(blocks[1].title).toBe("Герой");
    expect(blocks[2].title).toBe("Проблема");
    expect(blocks[10].title).toBe("Футер");
  });

  it("у каждого блока канона есть слаг", () => {
    const unknown = landingBlocks(readme).filter((b) => b.slug === null);
    expect(unknown).toEqual([]);
    expect(landingBlocks(readme).map((b) => b.slug)).toEqual([
      "header",
      "hero",
      "problem",
      "how",
      "examples",
      "inside",
      "price",
      "reviews",
      "faq",
      "cta",
      "footer",
    ]);
  });

  it("имя блока вне карты даёт slug null, а не падение", () => {
    const md = "## Блоки\n\n1. **Витрина будущего** — чего в карте нет.\n";
    expect(landingBlocks(md)).toEqual([{ n: 1, title: "Витрина будущего", slug: null }]);
  });

  it("без раздела «Блоки» список пустой", () => {
    expect(landingBlocks("# витрина\n\nтекста про блоки нет")).toEqual([]);
  });
});

describe("метрика машины в герое", () => {
  it("без роликов говорит, что машина делает сама", () => {
    expect(heroMetric(0, null)).toBe(HERO_METRIC_FALLBACK);
  });

  it("с роликами и просмотрами — две цифры одной строкой", () => {
    expect(heroMetric(3, 273500)).toBe(
      `3 ролика в эфире · ${(273500).toLocaleString("ru-RU")} просмотров за неделю`,
    );
  });

  it("просмотров ещё нет — только ролики", () => {
    expect(heroMetric(1, null)).toBe("1 ролик в эфире");
  });

  it("склоняет ролики", () => {
    expect([1, 2, 5, 11, 21, 22].map(reelWord)).toEqual([
      "ролик",
      "ролика",
      "роликов",
      "роликов",
      "ролик",
      "ролика",
    ]);
  });
});
