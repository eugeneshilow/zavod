import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractSection, listRuns, loadBrain } from "@/lib/brains";
import {
  EXPLAINER,
  buildTimeline,
  draftClock,
  letterClock,
  nextLetter,
  parseExplainer,
  voiceScript,
  wordsPerMinute,
} from "@/scripts/explainers/timeline.mjs";

const scenes = [
  { id: "one", say: "Привет, {mark}мир." },
  { id: "two", say: "Второй {b}кадр." },
];

/** Выравнивание, как его отдаёт ElevenLabs: символ за символом, 0.1 с на каждый. */
function fakeAlignment(text: string) {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * 0.1),
    character_end_times_seconds: characters.map((_, i) => i * 0.1 + 0.1),
  };
}

describe("объяснялка: сценарий", () => {
  it("пилот в репозитории проходит проверку и у каждой сцены есть функция", () => {
    const folder = "content/explainers/how-chatgpt-writes";
    const script = parseExplainer(readFileSync(`${folder}/script.json`, "utf8"));
    const code = readFileSync(`${folder}/scene.js`, "utf8");
    expect(script.scenes.length).toBeGreaterThanOrEqual(5);
    for (const scene of script.scenes) expect(code).toMatch(new RegExp(`\\b${scene.id}\\b`));
    expect(script.tempo).toBeGreaterThanOrEqual(EXPLAINER.tempoMin);
    expect(script.tempo).toBeLessThanOrEqual(EXPLAINER.tempoMax);
  });

  it("ловит дубли сцен, дубли меток и пустой текст", () => {
    expect(() => parseExplainer({ id: "x", scenes: [] })).toThrow(/scenes/);
    expect(() =>
      parseExplainer({
        id: "x",
        scenes: [
          { id: "a", say: "раз" },
          { id: "a", say: "два" },
        ],
      }),
    ).toThrow(/дважды/);
    expect(() => parseExplainer({ id: "x", scenes: [{ id: "a", say: "{m}раз {m}два" }] })).toThrow(
      /\{m\}/,
    );
    expect(() => parseExplainer({ id: "x", scenes: [{ id: "a", say: "  " }] })).toThrow(/пустой/);
    expect(() => parseExplainer({ id: "x", tempo: 2, scenes: [{ id: "a", say: "раз" }] })).toThrow(
      /tempo/,
    );
  });
});

describe("объяснялка: текст для голоса", () => {
  it("метки вырезаны, сцены через шов, позиции считаются по итоговому тексту", () => {
    const v = voiceScript(scenes);
    expect(v.text).toBe("Привет, мир.\n\nВторой кадр.");
    expect(v.starts).toEqual([0, 14]);
    expect(v.marks).toEqual([
      { scene: "one", name: "mark", at: 8 },
      { scene: "two", name: "b", at: 21 },
    ]);
    expect(v.text.slice(v.marks[0].at)).toMatch(/^мир/);
  });

  it("часы букв находят время слова, даже если движок вернул знаки иначе", () => {
    const text = "Привет, мир.";
    const exact = letterClock(text, fakeAlignment(text));
    expect(exact(8)).toBeCloseTo(0.8);
    // Движок съел запятую и точку: буквы те же, время берётся по букве.
    const lossy = letterClock(text, fakeAlignment("Привет мир"));
    expect(lossy(8)).toBeCloseTo(0.7);
    expect(nextLetter(text, 6)).toBe(8);
  });
});

describe("объяснялка: таймлайн", () => {
  it("сцена начинается чуть раньше своего первого слова, метки — время сцены", () => {
    const v = voiceScript(scenes);
    const clock = letterClock(v.text, fakeAlignment(v.text));
    const tl = buildTimeline({ scenes, voice: v, clock, voiceSeconds: 2.6, tempo: 1 });
    const [one, two] = tl.scenes;
    expect(one.start).toBe(0);
    expect(two.start).toBeCloseTo(EXPLAINER.lead + 1.4 - EXPLAINER.sceneLead, 3);
    expect(one.end).toBe(two.start);
    expect(one.marks.mark).toBeCloseTo(EXPLAINER.lead + 0.8, 3);
    expect(two.end).toBeCloseTo(EXPLAINER.lead + 2.6 + EXPLAINER.tail, 3);
    expect(tl.total).toBe(two.end);
  });

  it("темп сжимает время голоса, но не тишину до первого слова", () => {
    const v = voiceScript(scenes);
    const clock = letterClock(v.text, fakeAlignment(v.text));
    const tl = buildTimeline({ scenes, voice: v, clock, voiceSeconds: 2.6, tempo: 1.1 });
    expect(tl.scenes[0].marks.mark).toBeCloseTo(EXPLAINER.lead + 0.8 / 1.1, 3);
  });

  it("черновик без голоса считает время по знакам; темп слов — строка отчёта", () => {
    expect(draftClock("абв", 10)(3)).toBeCloseTo(0.3);
    expect(wordsPerMinute("раз два три — четыре", 2)).toBe(120);
  });
});

describe("объяснялка: мозг explainer", () => {
  it("рецепт указывает на живые разделы, след прогонов видит папку пилота", async () => {
    const brain = (await loadBrain("explainer"))!;
    expect(brain).toBeTruthy();
    expect(brain.family).toBe("писатели");
    for (const row of brain.recipe) {
      const md = readFileSync(row.file, "utf8");
      if (row.section) expect(extractSection(md, row.section), row.section).not.toBeNull();
    }
    const runs = await listRuns(brain);
    const pilot = runs.find((r) => r.id === "how-chatgpt-writes");
    expect(pilot?.beats).toBe(8);
    expect(pilot!.words).toBeGreaterThan(100);
  });
});
