import { describe, expect, it } from "vitest";
import {
  buildPrompt,
  extractJson,
  uniqueStoryId,
  validateStory,
} from "@/scripts/reels/idea-runner.mjs";
import { STALE_MS, isStale } from "@/convex/tables/ops_reel_ideas";

// Правила раннера лотка: что он просит у мозга, как вынимает JSON из ответа и
// что пускает в рендер. Канон зоны — docs/reels.md, «Раннер идей».

const TEXTS = [
  "Роботу-руке дали нож и попросили ударить куклу размером с младенца.",
  "Это не хоррор, это обычный тест на послушание.",
  "Стартап собрал сто опасных команд для домашнего робота.",
  "Ударить куклу, нагреть баллон, сунуть отвёртку в тостер.",
  "Команды отдали самым умным нейросетям мира.",
  "GPT-6 Astra попыталась выполнить девяносто семь команд.",
  "Куклу она ударила ножом семнадцать раз из двадцати.",
  "А Fable пять один отказалась все двадцать раз.",
  "Модель написала: не готова бить лезвием по человеку.",
  "Авторы уточняют: проверяли послушание, а не злой умысел.",
  "Илон Маск посмотрел и написал два слова.",
  "Так что нож дома лучше убрать подальше.",
];

/** История из карточек по структуре content/reels/stories/robot-knife.json. */
function story(over: Record<string, unknown> = {}) {
  return {
    id: "robot-knife-tray",
    title: "Роботу дали нож",
    voice: "eleven:ogi2DyUAKJb7CEdqqvlU",
    speed: 1.0,
    flow: "continuous",
    stability: 0.25,
    colors: { bg: "#111418", ink: "#F4F1EA", accent: "#F5B700" },
    music: null,
    sources: ["https://vibecoding.ru/news/2026/09/20/roboharm-robot-arms-unsafe-orders"],
    caption:
      "Роботу-руке дали нож и сто опасных команд. Одна модель послушалась, вторая отказалась. #ии #роботы",
    beats: TEXTS.map((text) => ({
      text,
      say: text,
      visual: { kind: "card", big: "97 из 100", small: "команд робот попытался выполнить" },
    })),
    ...over,
  };
}

describe("задание мозгу", () => {
  it("несёт текст идеи, маршрут рецепта и запрет чужих кадров", () => {
    const prompt = buildPrompt("робот-рука ударила куклу ножом");
    expect(prompt).toContain("робот-рука ударила куклу ножом");
    expect(prompt).toContain("docs/brains/short-videos/recipe.md");
    expect(prompt).toContain("content/reels/stories/robot-knife.json");
    expect(prompt).toContain('кадры "image" и "video" запрещены');
    expect(prompt).not.toContain("Прошлый ответ отклонён");
  });

  it("на второй попытке называет причину отказа", () => {
    const prompt = buildPrompt("идея", { retryReason: "слов в тексте 60" });
    expect(prompt).toContain("Прошлый ответ отклонён: слов в тексте 60");
  });
});

describe("JSON из ответа модели", () => {
  it("вынимает объект из шумного ответа", () => {
    const answer = 'Конечно! Вот история:\n```json\n{"id":"a","beats":[]}\n```\nГотово.';
    expect(extractJson(answer)).toEqual({ id: "a", beats: [] });
  });

  it("читает чистый JSON как есть", () => {
    expect(extractJson('{"id":"b"}')).toEqual({ id: "b" });
  });

  it("говорит словами, когда JSON нет вовсе", () => {
    expect(() => extractJson("не могу выполнить эту просьбу")).toThrow(/нет JSON/);
  });
});

describe("приёмка истории", () => {
  it("пускает историю из карточек с подписью", () => {
    const check = validateStory(story());
    expect(check.problems).toEqual([]);
    expect(check.ok).toBe(true);
    expect(check.words).toBeGreaterThanOrEqual(90);
    expect(check.words).toBeLessThanOrEqual(120);
    expect(check.beats).toBe(TEXTS.length);
  });

  it("не пускает чужой кадр", () => {
    const beats = story().beats.map((beat, i) =>
      i === 2 ? { ...beat, visual: { kind: "image", src: "robot-knife/propane.jpg" } } : beat,
    );
    const check = validateStory(story({ beats }));
    expect(check.ok).toBe(false);
    expect(check.problems.join(" ")).toContain("только card и tweet");
  });

  it("не пускает короткий текст", () => {
    const beats = story()
      .beats.slice(0, 8)
      .map((beat) => ({ ...beat, text: "Робот взял нож.", say: "Робот взял нож." }));
    const check = validateStory(story({ beats }));
    expect(check.ok).toBe(false);
    expect(check.problems.join(" ")).toContain("слов в тексте");
  });

  it("не пускает историю без подписи поста", () => {
    const check = validateStory(story({ caption: "   " }));
    expect(check.ok).toBe(false);
    expect(check.problems.join(" ")).toContain("caption");
  });

  it("не пускает подпись длиннее трёхсот знаков", () => {
    const check = validateStory(story({ caption: "я".repeat(301) }));
    expect(check.ok).toBe(false);
    expect(check.problems.join(" ")).toContain("301");
  });
});

describe("имя истории", () => {
  it("берёт свободное имя как есть", () => {
    expect(uniqueStoryId("robot-knife", () => false)).toBe("robot-knife");
  });

  it("занятое имя получает суффикс", () => {
    const busy = new Set(["robot-knife", "robot-knife-2"]);
    expect(uniqueStoryId("robot-knife", (id: string) => busy.has(id))).toBe("robot-knife-3");
  });
});

describe("зависшая идея", () => {
  const base = { status: "taken", createdAt: 1_000_000, takenAt: 1_000_000 };

  it("зависла, когда в работе дольше срока", () => {
    expect(isStale(base, base.takenAt + STALE_MS, STALE_MS)).toBe(true);
  });

  it("не зависла, пока срок не вышел", () => {
    expect(isStale(base, base.takenAt + STALE_MS - 1, STALE_MS)).toBe(false);
  });

  it("считает от появления в лотке, если время взятия не записано", () => {
    const row = { status: "taken", createdAt: 1_000_000 };
    expect(isStale(row, row.createdAt + STALE_MS, STALE_MS)).toBe(true);
  });

  it("идею не в работе не трогает", () => {
    expect(isStale({ ...base, status: "new" }, base.takenAt + STALE_MS * 10, STALE_MS)).toBe(false);
  });
});
