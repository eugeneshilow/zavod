import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BrainProfilePage from "@/app/admin/brains/[brainId]/page";
import BrainsPage from "@/app/admin/brains/page";
import {
  assembleHead,
  extractSection,
  listBrains,
  listRuns,
  loadBrain,
  parsePassport,
  parseRecipe,
  wordCount,
} from "@/lib/brains";
import { hrefOf } from "@/lib/nav-tree";

// Зона мозгов (docs/brains/README.md): мозг — папка с паспортом и рецептом,
// реестр читается с диска, голова собирается из живых файлов рецепта. Тест
// держит формат паспорта и рецепта, зеркало адресов и живой реестр.

describe("паспорт и рецепт", () => {
  it("паспорт — строки «- **поле** — значение» раздела «## Паспорт»", () => {
    const md =
      "# x — имя\n\n## Паспорт\n\n- **семья** — писатели\n- **вход** — новость\n\n## Приёмка\n\n- 0 · машина";
    expect(parsePassport(md)).toEqual({ семья: "писатели", вход: "новость" });
  });

  it("рецепт — таблица со ссылкой первой колонкой, путь считается от файла рецепта", () => {
    const md = [
      "| канон | секция | зачем |",
      "| --- | --- | --- |",
      "| [reels](../../reels.md) | `## История` | носитель |",
      "| [gus](../../research/2026-09-20-gus-formula/README.md) | весь файл | форма |",
      "| [чужое](../../../package.json) | весь файл | вне docs — не берётся |",
    ].join("\n");
    expect(parseRecipe(md, "docs/brains/short-videos/recipe.md")).toEqual([
      { label: "reels", file: "docs/reels.md", section: "## История", why: "носитель" },
      {
        label: "gus",
        file: "docs/research/2026-09-20-gus-formula/README.md",
        section: null,
        why: "форма",
      },
    ]);
  });

  it("раздел берётся до следующего заголовка того же уровня, подразделы входят", () => {
    const md = "# T\n\n## A\n\na\n\n### A1\n\na1\n\n## B\n\nb";
    expect(extractSection(md, "## A")).toBe("a\n\n### A1\n\na1");
    expect(extractSection(md, "## Нет")).toBeNull();
  });

  it("слова считаются без аудио-тегов", () => {
    expect(wordCount("[calm, unhurried narrator] Роботу дали нож — и всё.")).toBe(5);
  });
});

describe("реестр из папки docs/brains", () => {
  it("писатель коротких роликов в реестре, его рецепт указывает на живые файлы", async () => {
    const brains = await listBrains();
    const brain = brains.find((b) => b.id === "short-videos");
    expect(brain).toBeDefined();
    expect(brain!.family).toBe("писатели");
    expect(brain!.recipe.length).toBeGreaterThan(0);
    expect(hrefOf(brain!.doc)).toBe("/admin/brains/short-videos");
    for (const row of brain!.recipe) {
      expect(existsSync(row.file), row.file).toBe(true);
      if (row.section) {
        expect(
          extractSection(readFileSync(row.file, "utf8"), row.section),
          row.section,
        ).not.toBeNull();
      }
    }
    expect(brain!.acceptance.length).toBeGreaterThanOrEqual(3);
  });

  it("голова собирается из рецепта целиком, часть на каждую строку", async () => {
    const brain = (await loadBrain("short-videos"))!;
    const head = await assembleHead(brain);
    expect(head.parts.length).toBe(brain.recipe.length);
    expect(head.parts.every((p) => !p.missing)).toBe(true);
    expect(head.words).toBeGreaterThan(500);
    expect(head.text).toContain("Заголовок — 2–5 слов");
  });

  it("след прогонов — файлы историй с битами", async () => {
    const brain = (await loadBrain("short-videos"))!;
    const runs = await listRuns(brain);
    const first = runs.find((r) => r.id === "robot-knife");
    expect(first).toBeDefined();
    expect(first!.beats).toBeGreaterThan(5);
    expect(first!.words).toBeGreaterThan(50);
  });

  it("мозга без рецепта нет: id с точками и без папки — null", async () => {
    expect(await loadBrain("../admin")).toBeNull();
    expect(await loadBrain("net-takogo")).toBeNull();
  });
});

describe("стекло мозгов", () => {
  it("реестр показывает семью писателей и ссылку на профиль", async () => {
    const html = renderToStaticMarkup(await BrainsPage());
    expect(html).toContain('data-testid="family-писатели"');
    expect(html).toContain('href="/admin/brains/short-videos"');
  });

  it("профиль несёт селектор, рецепт, голову и прогоны", async () => {
    const html = renderToStaticMarkup(
      await BrainProfilePage({
        params: Promise.resolve({ brainId: "short-videos" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-testid="recipe"');
    expect(html).toContain('data-testid="head"');
    expect(html).toContain('data-testid="runs"');
    expect(html).toContain("robot-knife");
  });

  it("незнакомый id отвечает экраном «мозга нет», не падением", async () => {
    const html = renderToStaticMarkup(
      await BrainProfilePage({
        params: Promise.resolve({ brainId: "net-takogo" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain("Нет docs/brains/net-takogo/README.md");
  });
});
