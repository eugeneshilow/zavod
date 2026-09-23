import { describe, expect, it } from "vitest";
import {
  buildPrompt,
  doorsArg,
  extractJson,
  parseQueueIds,
  parseStorageId,
  uniqueStoryId,
  usageFromClaudeJson,
  validateStory,
  voiceChars,
  voiceCost,
} from "@/scripts/reels/idea-runner.mjs";
import { STALE_MS, isStale } from "@/convex/tables/ops_reel_ideas";

// Правила раннера идей: что он просит у мозга, как вынимает JSON из ответа,
// что пускает в рендер и во что считает заход — токены модели, знаки озвучки и
// строки очереди из вывода публикации. Канон зоны — docs/reels.md.

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

  it("заказ из кабинета: голос покупателя и пожелание в задании", () => {
    const prompt = buildPrompt("идея", { voice: "eleven:6A9D8WSMm4rFsg2DWFeE", wish: "без шуток" });
    expect(prompt).toContain('voice: "eleven:6A9D8WSMm4rFsg2DWFeE"');
    expect(prompt).toContain("Пожелание покупателя");
    expect(prompt).toContain("без шуток");
    expect(buildPrompt("идея")).not.toContain("Пожелание покупателя");
  });

  it("двери заказа для публикации: список, только скачать, без заказа все", () => {
    expect(doorsArg(null)).toBe("all");
    expect(doorsArg({ to: ["telegram"] })).toBe("telegram");
    expect(doorsArg({ to: ["instagram", "telegram"] })).toBe("instagram,telegram");
    expect(doorsArg({ to: [] })).toBe("none");
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

  it("считает от появления идеи, если время взятия не записано", () => {
    const row = { status: "taken", createdAt: 1_000_000 };
    expect(isStale(row, row.createdAt + STALE_MS, STALE_MS)).toBe(true);
  });

  it("идею не в работе не трогает", () => {
    expect(isStale({ ...base, status: "new" }, base.takenAt + STALE_MS * 10, STALE_MS)).toBe(false);
  });
});

describe("счёт за заход к модели", () => {
  it("кеш считается входом, цена берётся из конверта", () => {
    const envelope = JSON.stringify({
      type: "result",
      result: "{}",
      total_cost_usd: 0.1934,
      usage: {
        input_tokens: 12,
        cache_creation_input_tokens: 888,
        cache_read_input_tokens: 38_000,
        output_tokens: 2_100,
      },
    });
    expect(usageFromClaudeJson(envelope)).toEqual({
      inputTokens: 38_900,
      outputTokens: 2_100,
      costUsd: 0.1934,
    });
  });

  it("без конверта и без usage — счёта нет, а не ноль из воздуха", () => {
    expect(usageFromClaudeJson("просто текст")).toBeNull();
    expect(usageFromClaudeJson('{"result":"{}"}')).toBeNull();
  });
});

describe("счёт за озвучку", () => {
  it("знаки считаются по тексту для голоса, а не по тексту на экране", () => {
    const raw = {
      beats: [{ text: "На экране", say: "Голос говорит так" }, { text: "Только текст" }],
    };
    expect(voiceChars(raw)).toBe("Голос говорит так".length + "Только текст".length);
    expect(voiceChars({})).toBe(0);
  });

  it("цена — знаки на прайс за тысячу", () => {
    expect(voiceCost(1000, 0.3)).toBe(0.3);
    expect(voiceCost(690, 0.3)).toBeCloseTo(0.207, 4);
    expect(voiceCost(0, 0.3)).toBe(0);
  });
});

describe("вывод публикации", () => {
  const output = [
    "заливаю robot-knife.mp4 в хранилище Convex...",
    "файл на месте (kg2abc123); ставлю в очередь: instagram, telegram · аккаунт ruvibecoding...",
    'instagram: в очереди · {"id":"j57queue1","channel":"instagram","scheduledAt":1758000000000}',
    'telegram: в очереди · {"id":"j57queue2","channel":"telegram","scheduledAt":1758000000000}',
    "Ролик в очереди. Опубликует крон, когда дверь включена и настанет плановое время.",
  ].join("\n");

  it("вынимает строки очереди по одной на дверь", () => {
    expect(parseQueueIds(output)).toEqual(["j57queue1", "j57queue2"]);
  });

  it("вынимает файл в хранилище", () => {
    expect(parseStorageId(output)).toBe("kg2abc123");
  });

  it("дверь, которая не встала в очередь, id не даёт", () => {
    const broken = 'instagram: не встало в очередь — дубль\ntelegram: в очереди · {"id":"j57only"}';
    expect(parseQueueIds(broken)).toEqual(["j57only"]);
    expect(parseStorageId(broken)).toBeNull();
  });
});
