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
  beatBounds,
  buildAss,
  clipDurations,
  fitDurations,
  flatWords,
  layoutBeats,
  chunkText,
  cleanText,
  letterDurations,
  parseStory,
  parseVoice,
  splitWords,
  storyTotal,
  trustHeard,
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
type Bound = { start: number; end: number };

/** Честные слова whisper внутри бита: ровный ряд, ни одного нулевой длины. */
function heardIn(bound: Bound, count: number): Word[] {
  const step = (bound.end - bound.start) / count;
  return Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    start: bound.start + i * step,
    end: bound.start + i * step + step * 0.8,
  }));
}

/** Как whisper врёт на длинном файле: слова схлопываются в одну точку. */
function heardFlat(bound: Bound, count: number): Word[] {
  return Array.from({ length: count }, (_, i) => ({
    text: `w${i}`,
    start: bound.start,
    end: bound.start,
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
    const layout = layoutBeats(beats, [], [{ start: 0, end: 2 }]);
    const ass = buildAss(layout, storyTotal(layout));
    expect(ass).not.toContain("sil<[");
    expect(ass).not.toContain("**");
    expect(ass).toContain("куклу.");
  });
});

describe("куски для голоса", () => {
  it("режет текст по концам фраз и держит предел куска", () => {
    const text = parseStory(story)
      .beats.map((beat: { text: string }) => beat.text)
      .join(" ");
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

describe("границы битов", () => {
  it("границы равны накопленным длинам звука плюс паузы между битами", () => {
    const bounds = beatBounds([2, 1.5, 3]);
    const pause = STORY.beatPause;
    expect(bounds[0]).toEqual({ start: 0, end: 2 });
    expect(bounds[1]).toEqual({ start: 2 + pause, end: 2 + pause + 1.5 });
    expect(bounds[2]).toEqual({
      start: 2 + pause + 1.5 + pause,
      end: 2 + pause + 1.5 + pause + 3,
    });
    // Паузa не принадлежит ни одному биту: между ними ровно её длина.
    expect(bounds[1].start - bounds[0].end).toBeCloseTo(pause, 6);
    expect(bounds[2].start - bounds[1].end).toBeCloseTo(pause, 6);
  });
});

describe("раскладка слов по битам", () => {
  const beats = [
    { text: "раз два три", visual: { kind: "card", big: "1", small: "x" } },
    { text: "четыре пять", visual: { kind: "card", big: "2", small: "y" } },
    { text: "шесть", visual: { kind: "card", big: "3", small: "z" } },
  ];
  const bounds = beatBounds([3, 2, 1]);

  it("бит живёт ровно в границах своего звука, а не там, где услышала машина", () => {
    const layout = layoutBeats(beats, [], bounds);
    expect(layout.map((b: { words: unknown[] }) => b.words.length)).toEqual([3, 2, 1]);
    expect(layout.map((b: Bound) => [b.start, b.end])).toEqual(
      bounds.map((b: Bound) => [b.start, b.end]),
    );
    expect(flatWords(layout).map((w: Word) => w.text)).toEqual([
      "раз",
      "два",
      "три",
      "четыре",
      "пять",
      "шесть",
    ]);
  });

  it("бит с честными словами машины берёт её времена", () => {
    const honest = heardIn(bounds[0], 3);
    const layout = layoutBeats(beats, [honest, [], []], bounds);
    expect(trustHeard(honest, ["раз", "два", "три"])).toBe(true);
    expect(layout[0].byWhisper).toBe(true);
    const words = layout[0].words as Word[];
    expect(words.map((w) => w.start)).toEqual(honest.map((h) => h.start));
    expect(words.at(-1)!.end).toBeLessThanOrEqual(bounds[0].end);
    for (const [i, word] of words.entries()) {
      expect(word.end - word.start).toBeGreaterThanOrEqual(STORY.minWord - 1e-9);
      if (i > 0) expect(word.start).toBeGreaterThan(words[i - 1].start);
    }
  });

  it("бит с нулевыми длинами у машины раскладывается по буквам и монотонно", () => {
    const broken = heardFlat(bounds[0], 3);
    expect(trustHeard(broken, ["раз", "два", "три"])).toBe(false);
    const layout = layoutBeats(beats, [broken, [], []], bounds);
    expect(layout[0].byWhisper).toBe(false);
    const words = layout[0].words as Word[];
    for (const [i, word] of words.entries()) {
      expect(word.end).toBeGreaterThan(word.start);
      expect(word.end - word.start).toBeGreaterThanOrEqual(STORY.minWord - 1e-9);
      if (i > 0) expect(word.start).toBe(words[i - 1].end);
    }
    expect(words[0].start).toBe(bounds[0].start);
    expect(words.at(-1)!.end).toBe(bounds[0].end);
    // Слова одной длины делят бит поровну, а не схлопываются к его началу.
    expect(words[0].end - words[0].start).toBeCloseTo(1, 1);
  });

  it("слово с точкой на конце держится дольше соседа той же длины", () => {
    const [plain, dotted] = letterDurations(["дом", "дом."], 4);
    expect(dotted).toBeGreaterThan(plain);
    expect(plain + dotted).toBeCloseTo(4, 6);
  });

  it("сумма длительностей равна биту, и ни одно слово не короче минимума", () => {
    const fitted = fitDurations([10, 0, 0, 1], 4);
    expect(fitted.reduce((a: number, b: number) => a + b, 0)).toBeCloseTo(4, 6);
    for (const d of fitted) expect(d).toBeGreaterThanOrEqual(STORY.minWord - 1e-9);
  });

  it("длина ролика — конец последнего бита плюс хвост, клипы идут встык", () => {
    const layout = layoutBeats(beats, [], bounds);
    const total = storyTotal(layout);
    expect(total).toBeCloseTo(bounds.at(-1)!.end + STORY.tail, 6);
    expect(STORY.tail).toBe(0.6);
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
  const bounds = beatBounds([2, 1]);

  it("событий столько же, сколько слов, плюс водяной знак", () => {
    const layout = layoutBeats(beats, [], bounds);
    const ass = buildAss(layout, storyTotal(layout));
    const events = ass.split("\n").filter((line) => line.startsWith("Dialogue:"));
    expect(events.filter((e) => e.includes(",Word,"))).toHaveLength(3);
    expect(events.filter((e) => e.includes(",Mark,"))).toHaveLength(1);
    expect(ass).toContain("PlayResX: 1080");
    expect(ass).toContain(STORY.mark.text);
  });

  it("у каждого слова своё время на экране, без вспышек", () => {
    const layout = layoutBeats(beats, [], bounds);
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
    const layout = layoutBeats(beats, [heardIn(bounds[0], 2), heardIn(bounds[1], 1)], bounds);
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
