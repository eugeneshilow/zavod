import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  captionLine,
  heroMetric,
  landingBlocks,
  pickShowcase,
  reelWord,
  BUILT_BLOCKS,
  HERO_METRIC_FALLBACK,
} from "@/lib/landing";
import { FAQ } from "@/lib/landing-copy";

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

describe("собранные блоки страницы", () => {
  it("покрывают все слаги канона: серых полос на витрине не осталось", () => {
    const slugs = landingBlocks(readme).map((b) => b.slug);
    expect(slugs).not.toContain(null);
    for (const slug of slugs) {
      expect(BUILT_BLOCKS).toContain(slug);
    }
    expect(BUILT_BLOCKS).toHaveLength(slugs.length);
  });
});

describe("ролики в галерею примеров", () => {
  const reel = (mediaId: string, videoUrl: string | null, views: number | null) => ({
    mediaId,
    videoUrl,
    views,
  });

  it("берёт только те, у которых есть сам файл", () => {
    const picked = pickShowcase([reel("a", null, 900), reel("b", "https://v/b.mp4", 10)]);
    expect(picked.map((r) => r.mediaId)).toEqual(["b"]);
  });

  it("сортирует по просмотрам вниз", () => {
    const picked = pickShowcase([
      reel("a", "https://v/a.mp4", 10),
      reel("b", "https://v/b.mp4", 900),
      reel("c", "https://v/c.mp4", null),
    ]);
    expect(picked.map((r) => r.mediaId)).toEqual(["b", "a", "c"]);
  });

  it("режет список до n", () => {
    const many = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => reel(`r${i}`, `https://v/${i}.mp4`, i));
    expect(pickShowcase(many)).toHaveLength(6);
    expect(pickShowcase(many, 3).map((r) => r.mediaId)).toEqual(["r8", "r7", "r6"]);
  });

  it("не трогает исходный список", () => {
    const rows = [reel("a", "https://v/a.mp4", 10), reel("b", "https://v/b.mp4", 900)];
    pickShowcase(rows);
    expect(rows.map((r) => r.mediaId)).toEqual(["a", "b"]);
  });
});

describe("подпись под плиткой", () => {
  it("берёт первую строку подписи", () => {
    expect(captionLine("Первая строка\nвторая строка\n#теги")).toBe("Первая строка");
  });

  it("короткую подпись отдаёт как есть", () => {
    expect(captionLine("Короткая подпись")).toBe("Короткая подпись");
  });

  it("длинную режет до 70 знаков с многоточием", () => {
    const long = "а".repeat(40) + " " + "б".repeat(40);
    const line = captionLine(long);
    expect(line.length).toBeLessThanOrEqual(71);
    expect(line.endsWith("…")).toBe(true);
  });

  it("режет по границе слова", () => {
    const line = captionLine("слово ".repeat(20));
    expect(line.endsWith("слово…")).toBe(true);
  });

  it("пустая подпись даёт пустую строку", () => {
    expect(captionLine("")).toBe("");
    expect(captionLine("\n\n")).toBe("");
  });
});

describe("вопросы и ответы", () => {
  it("их восемь, как в каноне", () => {
    expect(FAQ).toHaveLength(8);
  });

  it("совпадают с перечнем канона по первому слову вопроса", () => {
    expect(FAQ.map((f) => f.q.split(" ")[0])).toEqual([
      "Сколько",
      "Какие",
      "Чей",
      "Кому",
      "Что",
      "Куда",
      "Как",
      "Что",
    ]);
  });

  it("у каждой пары есть непустой ответ", () => {
    for (const item of FAQ) {
      expect(item.a.length).toBeGreaterThan(20);
    }
  });
});
