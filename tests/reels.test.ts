import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SECONDS,
  buildXfadeFilter,
  parseSeries,
  renderSlideHtml,
  timeline,
} from "@/scripts/reels/lib.mjs";
import {
  STORY,
  buildAss,
  clipDurations,
  flatWords,
  layoutBeats,
  chunkText,
  cleanText,
  parseStory,
  parseVoice,
  splitWords,
  storyText,
  storyTotal,
  wordDrift,
} from "@/scripts/reels/story.mjs";

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

const story = JSON.parse(readFileSync("content/reels/stories/robot-knife.json", "utf8"));

type Word = { text: string; start: number; end: number };

/** Услышанные машиной слова: ровный ряд по секунде на слово. */
function heard(count: number, step = 1): Word[] {
  return Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    start: i * step,
    end: i * step + step * 0.8,
  }));
}

describe("история", () => {
  it("разбирает файл истории и голос", () => {
    const parsed = parseStory(story);
    expect(parsed.id).toBe("robot-knife");
    expect(parsed.voice.engine).toBe("yandex");
    expect(parsed.speed).toBeGreaterThan(0);
    expect(parsed.beats).toHaveLength(story.beats.length);
    expect(parseVoice("say:Milena")).toEqual({ engine: "say", name: "Milena", role: null });
    expect(parseVoice("yandex:alexander:good")).toEqual({
      engine: "yandex",
      name: "alexander",
      role: "good",
    });
    expect(() => parseVoice("elevenlabs:bob")).toThrow(/say/);
    expect(() => parseVoice("say:Milena:good")).toThrow(/амплуа/);
    expect(() => parseStory({ ...story, beats: [] })).toThrow(/beats/);
  });

  it("каждый кадр историй — один из четырёх видов", () => {
    const kinds = new Set(
      parseStory(story).beats.map((b: { visual: { kind: string } }) => b.visual.kind),
    );
    for (const kind of kinds) expect(["image", "video", "card", "tweet"]).toContain(kind);
  });
});

describe("разметка голоса", () => {
  it("паузы и ударения уходят голосу, а зрителю — чистый текст", () => {
    const raw = "Это не хоррор. sil<[300]> Это **тест**.";
    expect(cleanText(raw)).toBe("Это не хоррор. Это тест.");
    expect(splitWords(raw)).toEqual(["Это", "не", "хоррор.", "Это", "тест."]);
  });

  it("субтитры истории не показывают разметку", () => {
    const beats = [{ text: "sil<[500]> Ударить **куклу**.", visual: { kind: "card" } }];
    const layout = layoutBeats(beats, heard(2));
    const ass = buildAss(layout, storyTotal(layout));
    expect(ass).not.toContain("sil<[");
    expect(ass).not.toContain("**");
    expect(ass).toContain("куклу.");
  });
});

describe("куски для голоса", () => {
  it("режет текст по концам фраз и держит предел куска", () => {
    const story = parseStory(
      JSON.parse(readFileSync("content/reels/stories/robot-knife.json", "utf8")),
    );
    const text = storyText(story.beats);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(STORY.chunk);
    expect(chunks.join(" ")).toBe(text);
  });

  it("фраза длиннее предела режется, ничего не теряя", () => {
    const long = `${"слово ".repeat(80).trim()}.`;
    const chunks = chunkText(long, 60);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(60);
    expect(chunks.join(" ")).toBe(long);
  });
});

describe("раскладка слов по битам", () => {
  const beats = [
    { text: "раз два три", visual: { kind: "card", big: "1", small: "x" } },
    { text: "четыре пять", visual: { kind: "card", big: "2", small: "y" } },
    { text: "шесть", visual: { kind: "card", big: "3", small: "z" } },
  ];

  it("бит с k словами из N получает свою долю услышанных слов", () => {
    const layout = layoutBeats(beats, heard(6));
    expect(layout.map((b) => b.words.length)).toEqual([3, 2, 1]);
    expect(layout[0].start).toBe(0);
    expect(layout[1].start).toBe(3);
    expect(layout[2].start).toBe(5);
    expect(flatWords(layout).map((w: Word) => w.text)).toEqual([
      "раз",
      "два",
      "три",
      "четыре",
      "пять",
      "шесть",
    ]);
  });

  it("слов машина услышала больше, чем в тексте — доли те же", () => {
    const layout = layoutBeats(beats, heard(12, 0.5));
    expect(layout.map((b) => b.words.length)).toEqual([3, 2, 1]);
    expect(layout[0].start).toBe(0);
    expect(layout[2].end).toBeCloseTo(5.9, 6);
    const times = flatWords(layout).map((w: Word) => w.start);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("слов машина услышала меньше — бит делится ровно по времени", () => {
    const layout = layoutBeats(beats, heard(3, 2));
    expect(layout.map((b) => b.words.length)).toEqual([3, 2, 1]);
    for (const beat of layout) {
      for (const word of beat.words) expect(word.end).toBeGreaterThan(word.start);
    }
  });

  it("длина ролика — последнее слово плюс хвост, клипы идут встык", () => {
    const layout = layoutBeats(beats, heard(6));
    const total = storyTotal(layout);
    expect(total).toBeCloseTo((flatWords(layout).at(-1) as Word).end + STORY.tail, 6);
    const durations = clipDurations(layout, total);
    expect(durations.reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(total, 6);
  });

  it("расхождение слов считается долей", () => {
    expect(wordDrift(100, 120)).toBeCloseTo(0.2, 6);
    expect(wordDrift(100, 95)).toBeCloseTo(0.05, 6);
  });
});

describe("субтитры", () => {
  const beats = [
    { text: "раз два", visual: { kind: "card", big: "1", small: "x" } },
    { text: "три", visual: { kind: "card", big: "2", small: "y" } },
  ];

  it("событий столько же, сколько слов, плюс водяной знак", () => {
    const layout = layoutBeats(beats, heard(3));
    const ass = buildAss(layout, storyTotal(layout));
    const events = ass.split("\n").filter((line) => line.startsWith("Dialogue:"));
    expect(events.filter((e) => e.includes(",Word,"))).toHaveLength(3);
    expect(events.filter((e) => e.includes(",Mark,"))).toHaveLength(1);
    expect(ass).toContain("PlayResX: 1080");
    expect(ass).toContain(STORY.mark.text);
  });

  it("у каждого слова своё время на экране, без вспышек", () => {
    const layout = layoutBeats(beats, heard(3));
    const total = storyTotal(layout);
    const ass = buildAss(layout, total);
    const events = ass
      .split("\n")
      .filter((line) => line.startsWith("Dialogue:") && line.includes(",Word,"));
    // Поля события — ровно по Format, иначе libass печатает лишнюю запятую.
    const format = ass.split("\n").find((line) => line.startsWith("Format: Layer"))!;
    expect(format.split(",")).toHaveLength(events[0].split(",").length);
    for (const line of events) {
      const [, start, end] = line.split(",");
      expect(end > start).toBe(true);
    }
    // Последнее слово держится до конца ролика.
    expect(events.at(-1)!.split(",")[2]).toBe(`0:00:${total.toFixed(2).padStart(5, "0")}`);
  });

  it("времена не убывают и слова взяты из текста", () => {
    const layout = layoutBeats(beats, heard(6, 0.5));
    const ass = buildAss(layout, storyTotal(layout));
    const starts = ass
      .split("\n")
      .filter((line) => line.startsWith("Dialogue:") && line.includes(",Word,"))
      .map((line) => line.split(",")[1]);
    expect([...starts].sort()).toEqual(starts);
    expect(ass).toContain("раз");
    expect(ass).toContain("три");
  });
});
