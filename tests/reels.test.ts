import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SECONDS,
  audioFilter,
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
  collapseSilence,
  dotToComma,
  elevenTempo,
  flowGap,
  gapStats,
  groupBeatsByLimit,
  joinVoiceText,
  layoutFromAlignment,
  letterDurations,
  mapWordsToSpans,
  parseFlow,
  parseStory,
  parseVoice,
  rangesInAlignment,
  scaleSpans,
  silenceGaps,
  splitWords,
  parseStability,
  storyAudioFilter,
  storyStability,
  storyTotal,
  storyVoiceKeyParts,
  storyVoiceTexts,
  tagMask,
  toElevenMarkup,
  trustHeard,
  voiceCacheParts,
  voiceTextFor,
  wordDrift,
  wordSpans,
} from "@/scripts/reels/story.mjs";
import { elevenError, report } from "@/scripts/reels/render-story.mjs";

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
    expect(parsed.voice.engine).toBe("eleven");
    expect(parsed.speed).toBeGreaterThan(0);
    expect(parsed.beats).toHaveLength(story.beats.length);
    expect(parseVoice("say:Milena")).toEqual({
      engine: "say",
      name: "Milena",
      role: null,
      model: null,
    });
    expect(parseVoice("yandex:alexander:good")).toEqual({
      engine: "yandex",
      name: "alexander",
      role: "good",
      model: null,
    });
    expect(() => parseVoice("elevenlabs:bob")).toThrow(/say/);
    expect(() => parseVoice("say:Milena:good")).toThrow(/амплуа/);
    expect(() => parseStory({ ...story, beats: [] })).toThrow(/beats/);
  });

  it("третий голос — ElevenLabs: v3 по умолчанию, v2 по просьбе", () => {
    expect(parseVoice("eleven:ogi2DyUAKJb7CEdqqvlU")).toEqual({
      engine: "eleven",
      name: "ogi2DyUAKJb7CEdqqvlU",
      role: null,
      model: STORY.eleven.model,
    });
    expect(parseVoice("eleven:ogi2DyUAKJb7CEdqqvlU:v2").model).toBe(STORY.eleven.modelV2);
    expect(STORY.eleven.model).toBe("eleven_v3");
    expect(STORY.eleven.modelV2).toBe("eleven_multilingual_v2");
    expect(() => parseVoice("eleven:bob:good")).toThrow(/v2/);
    expect(() => parseVoice("eleven:")).toThrow(/не назван/);
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

  it("аудио-теги и многоточия тоже не доходят до зрителя", () => {
    const raw = "[calm, unhurried narrator] Роботу дали нож... [sighs] И он ударил.";
    expect(cleanText(raw)).toBe("Роботу дали нож. И он ударил.");
    expect(splitWords(raw)).toEqual(["Роботу", "дали", "нож.", "И", "он", "ударил."]);
    const layout = layoutBeats(
      [{ text: raw, visual: { kind: "card" } }],
      [],
      [{ start: 0, end: 3 }],
    );
    const ass = buildAss(layout, storyTotal(layout));
    expect(ass).not.toContain("[calm");
    expect(ass).not.toContain("[sighs]");
    expect(ass).not.toContain("...");
  });
});

describe("разметка для ElevenLabs", () => {
  it("разметка Яндекса переводится: паузы в многоточия, ударения в слова", () => {
    const raw = "sil<[300]> Это не хоррор. Это **тест**.";
    expect(toElevenMarkup(raw)).toBe("... Это не хоррор. Это тест.");
    expect(toElevenMarkup("Ударить **куклу**. sil<[500]> Ножом.")).toBe(
      "Ударить куклу. ... Ножом.",
    );
  });

  it("теги остаются голосу ElevenLabs и вырезаются у SpeechKit", () => {
    const beat = { text: "[thoughtful] Робот ударил sil<[300]> куклу.", say: null };
    expect(voiceTextFor("eleven", beat)).toBe("[thoughtful] Робот ударил ... куклу.");
    expect(voiceTextFor("yandex", beat)).toBe("Робот ударил sil<[300]> куклу.");
    expect(voiceTextFor("say", beat)).toBe("Робот ударил sil<[300]> куклу.");
  });

  it("say уходит голосу, а text остаётся на экране", () => {
    const beat = {
      text: "GPT-6 Astra выполнила **97** команд.",
      say: "[thoughtful] Джи-пи-ти шесть Астра выполнила девяносто семь команд.",
    };
    expect(voiceTextFor("eleven", beat)).toContain("девяносто семь");
    expect(voiceTextFor("eleven", beat)).not.toContain("97");
    expect(cleanText(beat.text)).toBe("GPT-6 Astra выполнила 97 команд.");
    expect(splitWords(beat.text)).toContain("97");
    // У SpeechKit своя разметка: say она не читает, ей остаётся text.
    expect(voiceTextFor("yandex", beat)).toBe(beat.text);
  });

  it("ключ кеша звука помнит модель, stability и скорость", () => {
    const beat = { text: "Робот ударил куклу.", say: null };
    const v3 = { voice: parseVoice("eleven:abc"), speed: 1.0 };
    const v2 = { voice: parseVoice("eleven:abc:v2"), speed: 1.0 };
    const parts = voiceCacheParts(v3, beat);
    expect(parts).toContain(STORY.eleven.model);
    expect(parts).toContain(STORY.eleven.stability);
    expect(parts).toContain(1.0);
    // Другая модель, другая скорость, другой текст для голоса — другой ключ.
    expect(voiceCacheParts(v2, beat)).not.toEqual(parts);
    expect(voiceCacheParts({ ...v3, speed: 1.1 }, beat)).not.toEqual(parts);
    expect(voiceCacheParts(v3, { ...beat, say: "Робот ударил кук+лу." })).not.toEqual(parts);
    // У SpeechKit stability не бывает: в ключ идёт пустое место, не число.
    expect(voiceCacheParts({ voice: parseVoice("yandex:ermil:good"), speed: 1.25 }, beat)).toEqual([
      "Робот ударил куклу.",
      "yandex",
      "ermil",
      "good",
      null,
      null,
      1.25,
    ]);
  });

  it("ровность чтения: поле истории старше умолчания канала", () => {
    // Поля нет — умолчание; поле есть — оно и побеждает, даже если это ноль.
    expect(parseStability(undefined)).toBe(STORY.eleven.stability);
    expect(parseStability("")).toBe(STORY.eleven.stability);
    expect(parseStability(0.25)).toBe(0.25);
    expect(parseStability(0)).toBe(0);
    expect(() => parseStability(1.4)).toThrow(/stability/);
    expect(() => parseStability("тихо")).toThrow(/stability/);
    // Уровень экспрессии канала записан прямо в файле истории.
    expect(parseStory(story).stability).toBe(0.25);
    expect(parseStory({ ...story, stability: undefined }).stability).toBe(STORY.eleven.stability);
    // И он входит в ключ кеша: сменил ровность — переозвучили.
    const parsed = parseStory(story);
    const parts = storyVoiceKeyParts(parsed, "текст");
    expect(parts).toContain(storyStability(parsed));
    expect(storyVoiceKeyParts({ ...parsed, stability: 0.55 }, "текст")).not.toEqual(parts);
    expect(
      voiceCacheParts({ ...parsed, stability: 0.55 }, { text: "Раз.", say: null }),
    ).not.toEqual(voiceCacheParts(parsed, { text: "Раз.", say: null }));
  });

  it("скорость у v3 подрезается до краёв: высоту голоса не трогаем", () => {
    expect(elevenTempo(1.0)).toBe(1);
    expect(elevenTempo(1.25)).toBe(STORY.eleven.tempoMax);
    expect(elevenTempo(0.5)).toBe(STORY.eleven.tempoMin);
    expect(STORY.eleven.tempoMin).toBe(0.85);
    expect(STORY.eleven.tempoMax).toBe(1.15);
  });

  it("отказ по тарифу объясняется словами, а не кодом", () => {
    const paid = elevenError(402, '{"detail":{"status":"paid_plan_required"}}');
    expect(paid).toContain("Starter");
    expect(paid).not.toContain("402");
    expect(elevenError(401, "unauthorized")).toContain("ELEVENLABS_API_KEY");
    expect(elevenError(429, "slow down")).toContain("Подожди");
  });
});

type Align = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** Синтетические таймкоды: каждый символ звучит step секунд, один за другим. */
function alignOf(text: string, step = 0.1): Align {
  const characters = [...text];
  const at = (i: number) => Math.round(i * step * 1000) / 1000;
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => at(i)),
    character_end_times_seconds: characters.map((_, i) => at(i + 1)),
  };
}

describe("вся история одним запросом к ElevenLabs", () => {
  const beats = [
    { text: "[calm] Робот взял нож.", visual: { kind: "card", big: "1", small: "x" } },
    {
      text: "GPT-6 выполнила 97 команд.",
      say: "Джи-пи-ти шесть выполнила девяносто семь команд.",
      visual: { kind: "card", big: "2", small: "y" },
    },
  ];
  // Здесь проверяется прежний режим: биты через пустую строку.
  const parsed = { voice: parseVoice("eleven:abc"), speed: 1.0, flow: "paused", beats };
  const texts: string[] = storyVoiceTexts(parsed);
  const whole: string = joinVoiceText(texts);

  it("биты склеиваются в один текст, между ними пустая строка", () => {
    expect(texts).toHaveLength(2);
    expect(whole).toBe(`${texts[0]}\n\n${texts[1]}`);
    expect(whole).toContain("девяносто семь");
    expect(STORY.eleven.beatGap).toBe("\n\n");
    expect(STORY.eleven.oneShot).toBeLessThanOrEqual(5000);
  });

  it("ключ кеша — весь текст истории, а не один бит", () => {
    const parts = storyVoiceKeyParts(parsed, whole);
    expect(parts).toContain(whole);
    expect(parts).toContain(STORY.eleven.model);
    expect(parts).toContain(STORY.eleven.stability);
    // Правка одного бита меняет ключ всей истории — так и задумано.
    const other = joinVoiceText([texts[0], "Другой текст."]);
    expect(storyVoiceKeyParts(parsed, other)).not.toEqual(parts);
  });

  it("отрезки тегов выбрасываются: они не звучат", () => {
    const mask = tagMask("[calm] Робот");
    expect(mask.slice(0, 6).every(Boolean)).toBe(true);
    expect(mask[6]).toBe(false);
    const align = alignOf("[calm] Раз два.");
    const spans = wordSpans(align);
    expect(spans.map((w: Word) => w.text)).toEqual(["Раз", "два."]);
    // «Раз» — седьмой символ: тег занял время, но словом не стал.
    expect(spans[0].start).toBeCloseTo(0.7, 6);
    expect(spans[1].end).toBeCloseTo(1.5, 6);
    // Многоточие-пауза словом тоже не считается.
    expect(wordSpans(alignOf("Раз ... два")).map((w: Word) => w.text)).toEqual(["Раз", "два"]);
  });

  it("границы битов берутся из времён символов их куска", () => {
    const align = alignOf(whole);
    const ranges = rangesInAlignment(align, texts);
    expect(ranges[0]).toEqual({ start: 0, end: texts[0].length });
    expect(ranges[1].start).toBe(texts[0].length + 2);
    const spans = ranges.map((r: Bound) => wordSpans(align, r));
    const layout = layoutFromAlignment(beats, spans);
    expect(layout[0].byAlignment).toBe(true);
    expect(layout[1].byAlignment).toBe(true);
    // Первый бит начинается там, где кончился тег, а не в нуле.
    expect(layout[0].start).toBeCloseTo(0.7, 6);
    expect(layout[0].end).toBeCloseTo(spans[0].at(-1)!.end, 6);
    expect(layout[1].start).toBeCloseTo(spans[1][0].start, 6);
    // Между битами есть пауза: второй начинается позже конца первого.
    expect(layout[1].start).toBeGreaterThan(layout[0].end);
    expect(() => rangesInAlignment(align, [...texts, "чего тут нет"])).toThrow(/таймкоды/);
  });

  it("слов на экране меньше, чем у голоса, — раскладка по счёту слов", () => {
    const align = alignOf(whole);
    const ranges = rangesInAlignment(align, texts);
    const spans = ranges.map((r: Bound) => wordSpans(align, r));
    const layout = layoutFromAlignment(beats, spans);
    // «97» голос говорит двумя словами — слов у голоса больше, чем на экране.
    expect(spans[1]).toHaveLength(6);
    const words = layout[1].words as Word[];
    expect(words.map((w) => w.text)).toEqual(["GPT-6", "выполнила", "97", "команд."]);
    for (const [i, word] of words.entries()) {
      expect(word.end - word.start).toBeGreaterThanOrEqual(STORY.minWord - 1e-9);
      if (i > 0) expect(word.start).toBeGreaterThan(words[i - 1].start);
    }
    expect(words[0].start).toBe(layout[1].start);
    expect(words.at(-1)!.end).toBe(layout[1].end);
    // Первое слово экрана встаёт на первое слово голоса, а не в начало бита.
    expect(words[0].start).toBeCloseTo(spans[1][0].start, 6);
    // В субтитры разметка не попадает никогда.
    const ass = buildAss(layout, storyTotal(layout));
    expect(ass).not.toContain("[calm");
    expect(ass).toContain("GPT-6");
  });

  it("слова экрана ложатся на времена голоса один к одному, когда их поровну", () => {
    const spans = [
      { text: "раз", start: 1, end: 1.4 },
      { text: "два", start: 1.6, end: 2 },
    ];
    const out = mapWordsToSpans(["раз", "два"], spans, { start: 1, end: 2 });
    expect(out!.map((w: Word) => w.start)).toEqual([1, 1.6]);
    expect(out!.at(-1)!.end).toBe(2);
    // Слов больше, чем времени с минимальной длиной, — раскладка не выйдет.
    expect(mapWordsToSpans(Array(50).fill("x"), spans, { start: 1, end: 2 })).toBeNull();
  });

  it("atempo двигает и времена: дорожку ускорили — слова поехали раньше", () => {
    const spans = wordSpans(alignOf("Раз два."));
    const fast = scaleSpans(spans, STORY.eleven.tempoMax);
    expect(scaleSpans(spans, 1)).toBe(spans);
    expect(fast[0].start).toBeCloseTo(0, 6);
    expect(fast.at(-1)!.end).toBeCloseTo(0.8 / 1.15, 3);
    expect(scaleSpans(spans, STORY.eleven.tempoMin).at(-1)!.end).toBeCloseTo(0.8 / 0.85, 3);
    // Слова остаются собой: меняются только времена.
    expect(fast.map((w: Word) => w.text)).toEqual(spans.map((w: Word) => w.text));
  });

  it("скорость не входит в ключ кеша у v3: подбор темпа не стоит кредитов", () => {
    const at1 = storyVoiceKeyParts({ ...parsed, speed: 1.0 }, whole);
    const at11 = storyVoiceKeyParts({ ...parsed, speed: 1.1 }, whole);
    expect(at11).toEqual(at1);
    // У v2 скорость — параметр запроса, значит в ключ она идёт.
    const v2 = { voice: parseVoice("eleven:abc:v2"), speed: 1.0, beats };
    expect(storyVoiceKeyParts({ ...v2, speed: 1.1 }, whole)).not.toEqual(
      storyVoiceKeyParts(v2, whole),
    );
  });

  it("сценарий длиннее предела режется по границам битов", () => {
    expect(groupBeatsByLimit(["ааа", "ббб", "ввв"], 8)).toEqual([[0, 1], [2]]);
    expect(groupBeatsByLimit(["ааа", "ббб", "ввв"], 500)).toEqual([[0, 1, 2]]);
    // Бит длиннее предела целиком остаётся в своём куске: пополам не рвём.
    expect(groupBeatsByLimit(["а".repeat(20), "б"], 8)).toEqual([[0], [1]]);
    expect(groupBeatsByLimit(texts)).toEqual([[0, 1]]);
  });
});

/** Кусок «речи»: ровный тон, который детектор тишины точно слышит. */
function tone(seconds: number, hz = 220, amp = 8000): Buffer {
  const n = Math.round(48000 * seconds);
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i += 1) {
    buf.writeInt16LE(Math.round(amp * Math.sin((2 * Math.PI * hz * i) / 48000)), i * 2);
  }
  return buf;
}

/** Кусок тишины ровно на seconds секунд. */
function hush(seconds: number): Buffer {
  return Buffer.alloc(Math.round(48000 * seconds) * 2);
}

describe("поток без пауз", () => {
  const beats = [
    { text: "Это не хоррор. Это тест.", visual: { kind: "card", big: "1", small: "x" } },
    { text: "А что если нет?", visual: { kind: "card", big: "2", small: "y" } },
    { text: "Нож лучше убрать.", visual: { kind: "card", big: "3", small: "z" } },
  ];

  it("flow бывает двух значений, и по умолчанию история идёт без пауз", () => {
    expect(parseFlow(undefined)).toBe("continuous");
    expect(parseFlow("")).toBe("continuous");
    expect(parseFlow("paused")).toBe("paused");
    expect(() => parseFlow("slow")).toThrow(/flow/);
    expect(parseStory(story).flow).toBe("continuous");
    expect(parseStory({ ...story, flow: "paused" }).flow).toBe("paused");
    // Шов между битами: по донору пробел, в прежнем режиме пустая строка.
    expect(flowGap("continuous")).toBe(" ");
    expect(flowGap("paused")).toBe(STORY.eleven.beatGap);
    expect(flowGap(undefined)).toBe(" ");
  });

  it("точка в конце бита становится запятой, а знак вопроса и многоточие — нет", () => {
    expect(dotToComma("Это тест.")).toBe("Это тест,");
    expect(dotToComma('Он сказал "да".')).toBe('Он сказал "да",');
    expect(dotToComma("А что если нет?")).toBe("А что если нет?");
    expect(dotToComma("Хватит!")).toBe("Хватит!");
    // Многоточие — явная пауза автора, её не трогают.
    expect(dotToComma("Роботу дали нож...")).toBe("Роботу дали нож...");
  });

  it("в режиме continuous биты сшиты пробелом, и точка стоит только у последнего", () => {
    const flowing = { voice: parseVoice("eleven:abc"), speed: 1, flow: "continuous", beats };
    const texts: string[] = storyVoiceTexts(flowing);
    expect(texts[0]).toBe("Это не хоррор. Это тест,");
    // Знак вопроса остаётся: там пауза и есть смысл фразы.
    expect(texts[1]).toBe("А что если нет?");
    // Последний бит кончается точкой: после него тишина законна.
    expect(texts[2]).toBe("Нож лучше убрать.");
    const whole = joinVoiceText(texts, flowGap(flowing.flow));
    expect(whole).toBe("Это не хоррор. Это тест, А что если нет? Нож лучше убрать.");
    expect(whole).not.toContain("\n");
    // В прежнем режиме ничего из этого не происходит.
    const paused = storyVoiceTexts({ ...flowing, flow: "paused" });
    expect(paused[0]).toBe("Это не хоррор. Это тест.");
    expect(joinVoiceText(paused, flowGap("paused"))).toContain("\n\n");
    // Зритель разметки и растяжек не видит: на экране всегда text бита.
    expect(splitWords(beats[0].text)).toEqual(["Это", "не", "хоррор.", "Это", "тест."]);
  });

  it("растяжка живёт только в say и на экран не попадает", () => {
    const beat = { text: "Это не хоррор. Это тест.", say: "Это не хоррор, это тесст." };
    const said = voiceTextFor("eleven", beat, { flow: "continuous", last: false });
    expect(said).toBe("Это не хоррор, это тесст,");
    expect(cleanText(beat.text)).toBe("Это не хоррор. Это тест.");
    expect(splitWords(beat.text)).not.toContain("тесст");
  });

  it("сведение режет паузу до maxGap и сдвигает времена ровно на вырезанное", () => {
    // Две «фразы» и 0.8 с тишины между ними.
    const pcm = Buffer.concat([tone(0.5), hush(0.8), tone(0.5)]);
    const words = [
      { text: "раз", start: 0.1, end: 0.4 },
      { text: "два", start: 1.35, end: 1.6 },
      { text: "три", start: 1.6, end: 1.75 },
    ];
    const before = gapStats(pcm);
    expect(before.count).toBe(1);
    expect(before.median).toBeCloseTo(0.8, 2);

    const cut = collapseSilence(pcm, words);
    const maxGap = STORY.collapse.maxGap;
    expect(maxGap).toBe(0.12);
    expect(STORY.collapse.xfade).toBe(0.04);
    // Вырезано ровно то, что было сверх maxGap.
    expect(cut.removed).toBeCloseTo(0.8 - maxGap, 3);
    // Дорожка укоротилась ровно на вырезанное, ни на сэмпл больше.
    expect(pcm.length - cut.pcm.length).toBe(Math.round(48000 * cut.removed) * 2);
    // Пауз длиннее maxGap в дорожке не осталось.
    for (const gap of silenceGaps(cut.pcm, { min: 0.02 })) {
      expect(gap.seconds).toBeLessThanOrEqual(maxGap + 1e-9);
    }
    expect(gapStats(cut.pcm).count).toBe(0);
    // Слова первой фразы не двинулись, слова второй уехали ровно на вырезанное.
    expect(cut.words[0]).toEqual(words[0]);
    expect(cut.words[1].start).toBeCloseTo(words[1].start - cut.removed, 3);
    expect(cut.words[1].end).toBeCloseTo(words[1].end - cut.removed, 3);
    expect(cut.words[2].start).toBeCloseTo(words[2].start - cut.removed, 3);
    expect(cut.words[2].text).toBe("три");
    // Времена не перестали расти.
    for (let i = 1; i < cut.words.length; i += 1) {
      expect(cut.words[i].start).toBeGreaterThanOrEqual(cut.words[i - 1].start);
    }
  });

  it("дорожка без длинных пауз возвращается как есть", () => {
    const pcm = Buffer.concat([tone(0.4), hush(0.05), tone(0.4)]);
    const words = [{ text: "раз", start: 0.1, end: 0.8 }];
    const cut = collapseSilence(pcm, words);
    expect(cut.removed).toBe(0);
    expect(cut.pcm).toBe(pcm);
    expect(cut.words).toBe(words);
  });
});

describe("длина ролика истории", () => {
  /** Отчёт рендера на выдуманном исходе: длину и слова задаём сами. */
  const reportOf = (expected: number, words: number) =>
    report({
      id: "x",
      title: "т",
      out: "out/x.mp4",
      beats: 16,
      oneShot: true,
      requests: 1,
      byWhisper: 0,
      byAlignment: 16,
      resynth: 1,
      words,
      heard: words,
      drift: 0,
      voice: parseVoice("eleven:abc"),
      speed: 1,
      tempo: 1,
      format: "pcm_48000",
      music: null,
      subs: "out/x.ass",
      expected,
      info: { duration: expected, width: 1080, height: 1920, sizeMb: "9", audio: "aac" },
    });

  it("ролик длиннее минуты — предупреждение, а не падение", () => {
    expect(STORY.maxSeconds).toBe(60);
    const long = reportOf(78.4, 149);
    expect(long).toContain("длиннее 60 с");
    expect(long).toContain("убери около");
    expect(reportOf(54.2, 110)).not.toContain("длиннее");
  });

  it("сценарий robot-knife укладывается в ориентир по словам", () => {
    const count = parseStory(story)
      .beats.map((beat: { text: string }) => splitWords(beat.text).length)
      .reduce((a: number, b: number) => a + b, 0);
    expect(count).toBeLessThanOrEqual(STORY.targetWords + 10);
    expect(STORY.targetWords).toBe(110);
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

describe("дорожка звука", () => {
  it("звук не переписывает свои времена счётчиком сэмплов", () => {
    // asetpts=N/SR/TB рядом с видео из склейки сминает часть дорожки в точку.
    expect(storyAudioFilter(66.494, false)).not.toContain("asetpts");
    expect(storyAudioFilter(66.494, true)).not.toContain("asetpts");
    expect(audioFilter(27, false)).not.toContain("asetpts");
    expect(audioFilter(27, true)).not.toContain("asetpts");
    expect(storyAudioFilter(66.494, false)).toContain("atrim=0:66.494");
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
    // Пауза не принадлежит ни одному биту: между ними ровно её длина.
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
