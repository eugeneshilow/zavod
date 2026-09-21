// Механика рельсы «История»: разбор файла истории, раскладка слов по битам,
// субтитры .ass по одному слову и фильтры ffmpeg для кадров.
// Канон зоны — docs/reels.md, раздел «История».

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { FPS, escapeHtml, templateHead } from "./lib.mjs";

/** Постоянные истории: хвост после последнего слова, темп донора, вид субтитров. */
export const STORY = {
  tail: 0.6,
  donorWpm: 160,
  sayRate: 170,
  // SpeechKit читает медленнее донора: 1.0 даёт ~115 слов в минуту.
  speed: 1.1,
  // Синхронный SpeechKit v3 берёт короткими кусками — 250 знаков за запрос.
  chunk: 240,
  // ElevenLabs: настройки голоса канала — спокойный невозмутимый рассказчик.
  eleven: {
    model: "eleven_v3",
    modelV2: "eleven_multilingual_v2",
    stability: 0.55,
    language: "ru",
    // Один запрос берёт до 5000 знаков: вся история уходит одним куском,
    // сценарий длиннее — режется по границам битов (запасной путь).
    oneShot: 4500,
    // Шов между битами внутри одного запроса: пустая строка — пауза у v3.
    beatGap: "\n\n",
    // У v3 регулятора скорости нет: темп правит atempo, и только в этих краях.
    tempoMin: 0.85,
    tempoMax: 1.15,
  },
  // Шов между кусками внутри бита: столько тишины, чтобы фразы не слипались.
  chunkPauseMs: 120,
  // Тишина между соседними битами: по ней и проходит граница бита.
  beatPause: 0.25,
  // Ни одно слово не висит на экране меньше этого.
  minWord: 0.12,
  // Слово с точкой или запятой на конце держится чуть дольше: речь тормозит.
  punctTail: 0.15,
  musicDb: -14,
  fadeSeconds: 1.5,
  zoomTo: 1.06,
  // Карточка дольше этого не стоит статично — включается наезд.
  stillSeconds: 3.0,
  // Субтитры: нижняя треть кадра, водяной знак под ними.
  // Слово на экране: 62 % высоты кадра, чтобы не упираться в подвал.
  sub: { font: "Arial", size: 116, outline: 8, shadow: 3, marginV: 660 },
  mark: { size: 34, marginV: 96, text: "vibecoding.ru" },
  // Где стоит картинка в кадре: центр полосы и её предел по высоте.
  art: { centerY: 700, maxHeight: 1500 },
};

const VISUAL_KINDS = ["image", "video", "card", "tweet"];
const round3 = (n) => Math.round(n * 1000) / 1000;

// Аудио-тег ElevenLabs — `[quietly]`. Скобка после `<` тегом не считается:
// это пауза SpeechKit `sil<[300]>`, у неё своя судьба.
const AUDIO_TAG = /(?<!<)\[[^\]\n]*\]/g;
// Пробел перед знаком препинания съедается, а перед многоточием — остаётся:
// «...» у ElevenLabs это пауза, и приклеивать её к прошлому слову нельзя.
const GLUE_PUNCT = /\s+(?=[,.!?:;…])(?!\.\.)/g;

function need(value, what) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`История: не хватает поля ${what}`);
  }
  return value;
}

/**
 * Голос трёх движков: `eleven:<voice_id>` — ElevenLabs v3 с аудио-тегами,
 * `eleven:<voice_id>:v2` — ElevenLabs Multilingual v2 (у неё есть скорость),
 * `yandex:<голос>[:<амплуа>]` — SpeechKit (амплуа: good, neutral, strict),
 * `say:<имя>` — встроенный в macOS черновик. Канон — docs/reels.md.
 */
export function parseVoice(value) {
  const [engine, name, role] = String(value ?? "")
    .trim()
    .split(":")
    .map((part) => part.trim());
  if (engine !== "say" && engine !== "yandex" && engine !== "eleven") {
    throw new Error(
      "История: голос бывает eleven:<voice_id>[:v2], yandex:<голос>[:<амплуа>] " +
        `или say:<имя>, а не «${value}»`,
    );
  }
  if (!name) throw new Error(`История: у голоса «${engine}» не назван голос: ${engine}:<имя>`);
  if (engine === "eleven") {
    if (role && role !== "v2" && role !== "v3") {
      throw new Error(`История: у голоса eleven бывает только модель v2 или v3, а не «${role}»`);
    }
    return {
      engine,
      name,
      role: null,
      model: role === "v2" ? STORY.eleven.modelV2 : STORY.eleven.model,
    };
  }
  if (role && engine !== "yandex") {
    throw new Error(`История: амплуа бывает только у голоса yandex, а не у «${engine}»`);
  }
  return { engine, name, role: role || null, model: null };
}

function parseVisual(raw, i) {
  const kind = need(raw?.kind, `beats[${i}].visual.kind`);
  if (!VISUAL_KINDS.includes(kind)) {
    throw new Error(`История: beats[${i}].visual.kind бывает ${VISUAL_KINDS.join(", ")}`);
  }
  if (kind === "image" || kind === "video") {
    const visual = { kind, src: need(raw?.src, `beats[${i}].visual.src`) };
    if (kind === "video") {
      visual.from = Number(raw?.from ?? 0);
      if (raw?.crop) visual.crop = String(raw.crop);
    }
    return visual;
  }
  if (kind === "card") {
    return {
      kind,
      big: need(raw?.big, `beats[${i}].visual.big`),
      small: need(raw?.small, `beats[${i}].visual.small`),
    };
  }
  return {
    kind,
    name: need(raw?.name, `beats[${i}].visual.name`),
    handle: need(raw?.handle, `beats[${i}].visual.handle`),
    text: need(raw?.text, `beats[${i}].visual.text`),
    meta: raw?.meta ? String(raw.meta) : "",
  };
}

/** Разбирает файл истории: id, заголовок, голос, цвета и биты по порядку. */
export function parseStory(raw) {
  const beats = raw?.beats;
  if (!Array.isArray(beats) || beats.length === 0) {
    throw new Error("История: beats должен быть непустым списком");
  }
  return {
    id: need(raw?.id, "id"),
    title: need(raw?.title, "title"),
    voice: parseVoice(need(raw?.voice, "voice")),
    colors: {
      bg: need(raw?.colors?.bg, "colors.bg"),
      ink: need(raw?.colors?.ink, "colors.ink"),
      accent: need(raw?.colors?.accent, "colors.accent"),
    },
    music: raw?.music || null,
    speed: Number(raw?.speed ?? STORY.speed),
    sources: Array.isArray(raw?.sources) ? raw.sources : [],
    beats: beats.map((beat, i) => ({
      text: String(need(beat?.text, `beats[${i}].text`)).trim(),
      // Текст для голоса, когда он отличается от экранного: числа и латиница
      // словами. Поля нет — голос читает text.
      say: beat?.say ? String(beat.say).trim() : null,
      visual: parseVisual(beat?.visual, i),
    })),
  };
}

/**
 * Текст бита может нести разметку трёх видов: пауза `sil<[300]>` и ударение
 * `**слово**` (SpeechKit), аудио-теги `[thoughtful]` и многоточия-паузы
 * (ElevenLabs). Голосу она уходит по правилам своего движка, зрителю — никогда:
 * субтитры и счёт слов идут по очищенному тексту. Канон — docs/reels.md.
 */
export function cleanText(text) {
  return String(text)
    .replace(/sil<\[\d+\]>/g, " ")
    .replace(AUDIO_TAG, " ")
    .replace(/\*\*/g, "")
    .replace(/\s*(?:\.{2,}|…)\s*/g, ". ")
    .replace(GLUE_PUNCT, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Разметка SpeechKit на языке ElevenLabs: паузы `sil<[N]>` становятся
 * многоточием (SSML-пауз у v3 нет, паузу держит «...»), ударения `**слово**`
 * теряют звёздочки — ударений v3 не знает. Аудио-теги `[…]` остаются: они и
 * есть разметка этого движка.
 */
export function toElevenMarkup(text) {
  return String(text)
    .replace(/sil<\[\d+\]>/g, "...")
    .replace(/\*\*/g, "")
    .replace(GLUE_PUNCT, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Текст, который слышит голос. У ElevenLabs это `say` бита, если он есть, —
 * там числа и латиница написаны словами; разметка переводится на его язык.
 * У SpeechKit и macOS всё как было: их собственная разметка уходит как есть,
 * а чужие аудио-теги вырезаются — иначе голос прочитает их вслух.
 */
export function voiceTextFor(engine, beat) {
  if (engine === "eleven") return toElevenMarkup(beat.say ?? beat.text);
  return String(beat.text)
    .replace(AUDIO_TAG, " ")
    .replace(GLUE_PUNCT, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Слова так, как их видит зритель: текст истории со своей пунктуацией.
 * Одиночное тире — не слово: на экран не идёт и в счёт не входит.
 */
export function splitWords(text) {
  return cleanText(text)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w && !/^[—–-]+$/.test(w));
}

/**
 * SpeechKit v3 берёт за раз короткий кусок (250 знаков), поэтому текст режется
 * по концам фраз и склеивается обратно уже звуком. Фраза длиннее предела
 * режется по запятой, потом по пробелу.
 */
export function chunkText(text, limit = STORY.chunk) {
  const sentences = String(text)
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pieces = [];
  for (const sentence of sentences) {
    if (sentence.length <= limit) {
      pieces.push(sentence);
      continue;
    }
    let rest = sentence;
    while (rest.length > limit) {
      const head = rest.slice(0, limit);
      const at = Math.max(head.lastIndexOf(", "), head.lastIndexOf(" "));
      const cut = at > limit / 2 ? at + 1 : limit;
      pieces.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) pieces.push(rest);
  }
  const out = [];
  for (const piece of pieces) {
    const last = out[out.length - 1];
    if (last && `${last} ${piece}`.length <= limit) out[out.length - 1] = `${last} ${piece}`;
    else out.push(piece);
  }
  return out;
}

/**
 * Ключ звука бита: по нему решается, переозвучивать его или взять с диска.
 * В ключ входит всё, что меняет звучание, — текст ДЛЯ ГОЛОСА, сам голос,
 * модель, stability и скорость. Канон — docs/reels.md.
 */
export function voiceCacheParts(story, beat) {
  const { engine, name, role, model } = story.voice;
  return [
    voiceTextFor(engine, beat),
    engine,
    name,
    role ?? null,
    model ?? null,
    engine === "eleven" ? STORY.eleven.stability : null,
    story.speed,
  ];
}

/**
 * Темп для ElevenLabs v3: регулятора скорости у неё нет, поэтому `speed`
 * истории правит уже готовый звук бита фильтром `atempo` — высота при этом не
 * меняется. За краями 0.85–1.15 слышно, что запись тянут, поэтому значение вне
 * предела подрезается до края, и рендер говорит об этом в отчёте.
 */
export function elevenTempo(speed) {
  const { tempoMin, tempoMax } = STORY.eleven;
  const wanted = Number(speed);
  if (!Number.isFinite(wanted) || wanted <= 0) return 1;
  return Math.min(tempoMax, Math.max(tempoMin, wanted));
}

/**
 * Тексты битов для голоса по порядку — по одному на бит. У ElevenLabs они
 * склеиваются в один текст и уходят одним запросом; у остальных движков
 * каждый едет своим. Канон — docs/reels.md.
 */
export function storyVoiceTexts(story) {
  return story.beats.map((beat) => voiceTextFor(story.voice.engine, beat));
}

/** Один текст на всю историю: между соседними битами пустая строка — пауза у v3. */
export function joinVoiceText(texts, gap = STORY.eleven.beatGap) {
  return texts.join(gap);
}

/**
 * Ключ звука всей истории: у ElevenLabs она озвучивается одним куском, поэтому
 * в ключ входит весь текст для голоса, сам голос, модель, stability и скорость.
 * Правка одного бита меняет ключ целиком — так и задумано. Канон — docs/reels.md.
 */
export function storyVoiceKeyParts(story, text) {
  const { engine, name, model } = story.voice;
  return [text, engine, name, model ?? null, STORY.eleven.stability, story.speed];
}

/**
 * Сценарий длиннее предела режется на куски ПО ГРАНИЦАМ БИТОВ — бит целиком
 * остаётся в одном запросе. Возвращает номера битов по кускам. Запасной путь:
 * между кусками слышен шов. Канон — docs/reels.md.
 */
export function groupBeatsByLimit(texts, limit = STORY.eleven.oneShot, gap = STORY.eleven.beatGap) {
  const groups = [];
  let current = [];
  let length = 0;
  for (const [i, text] of texts.entries()) {
    const add = current.length === 0 ? text.length : gap.length + text.length;
    if (current.length > 0 && length + add > limit) {
      groups.push(current);
      current = [i];
      length = text.length;
      continue;
    }
    current.push(i);
    length += add;
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

/**
 * Какие символы текста — аудио-тег `[…]`. В таймкодах у тега свой отрезок
 * времени, хотя вслух он не звучит: его выбрасывают, иначе первое слово встанет
 * на экран раньше речи.
 */
export function tagMask(text) {
  const mask = new Array(text.length).fill(false);
  let open = -1;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "[") open = i;
    else if (text[i] === "]" && open >= 0) {
      for (let j = open; j <= i; j += 1) mask[j] = true;
      open = -1;
    }
  }
  return mask;
}

/**
 * Слова куска текста со временами их символов: слово идёт от первого своего
 * символа до последнего. Отрезки тегов выброшены, а кусок без единой буквы и
 * цифры (например многоточие-пауза) словом не считается.
 */
export function wordSpans(alignment, range) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const from = range?.start ?? 0;
  const to = range?.end ?? chars.length;
  const text = chars.slice(from, to).join("");
  const mask = tagMask(text);
  const spans = [];
  let current = null;
  for (let i = 0; i < text.length; i += 1) {
    if (mask[i] || /\s/.test(text[i])) {
      if (current) spans.push(current);
      current = null;
      continue;
    }
    if (current) {
      current.text += text[i];
      current.end = Math.max(current.end, ends[from + i]);
    } else {
      current = { text: text[i], start: starts[from + i], end: ends[from + i] };
    }
  }
  if (current) spans.push(current);
  return spans
    .filter((w) => /[\p{L}\p{N}]/u.test(w.text))
    .map((w) => ({ text: w.text, start: round3(w.start), end: round3(w.end) }));
}

/**
 * Где в таймкодах лежит текст каждого бита. Движок возвращает символы того
 * текста, который мы отправили, поэтому каждый бит ищется по порядку от места,
 * где кончился предыдущий.
 */
export function rangesInAlignment(alignment, texts) {
  const joined = alignment.characters.join("");
  const ranges = [];
  let at = 0;
  for (const [i, text] of texts.entries()) {
    const found = joined.indexOf(text, at);
    if (found < 0) {
      throw new Error(`История: ElevenLabs вернул таймкоды без текста бита ${i + 1}`);
    }
    ranges.push({ start: found, end: found + text.length });
    at = found + text.length;
  }
  return ranges;
}

/**
 * Темп меняет всю дорожку целиком, значит и времена таймкодов делятся на тот же
 * коэффициент: ускорили звук в 1.15 раза — все времена стали в 1.15 раза раньше.
 */
export function scaleAlignment(alignment, tempo) {
  const k = Number(tempo);
  if (!Number.isFinite(k) || k <= 0 || Math.abs(k - 1) < 1e-9) return alignment;
  return {
    characters: alignment.characters,
    character_start_times_seconds: alignment.character_start_times_seconds.map((t) =>
      round3(t / k),
    ),
    character_end_times_seconds: alignment.character_end_times_seconds.map((t) => round3(t / k)),
  };
}

/**
 * Слова экрана на честные времена слов голоса. Их число обычно не совпадает:
 * зритель видит «97», а голос говорит «девяносто семь». Поэтому слова экрана
 * раскладываются по словам голоса по счёту — j-е из n встаёт туда, где начинается
 * слово голоса номер j×m/n. Слова не влезли с минимальной длиной — null,
 * и раскладка уходит на буквы.
 */
export function mapWordsToSpans(words, spans, bound, min = STORY.minWord) {
  const n = words.length;
  const m = spans.length;
  if (n === 0 || m === 0) return null;
  const starts = [];
  let cursor = bound.start;
  for (let j = 0; j < n; j += 1) {
    const span = spans[Math.min(m - 1, Math.floor((j * m) / n))];
    const want = Math.min(Math.max(span.start, bound.start), bound.end);
    const start = Math.max(cursor, want);
    starts.push(start);
    cursor = start + min;
  }
  if (cursor > bound.end + 1e-9) return null;
  return starts.map((start, j) => ({
    text: words[j],
    start: round3(start),
    end: round3(j + 1 < n ? starts[j + 1] : bound.end),
  }));
}

/**
 * Раскладка по таймкодам ElevenLabs: граница бита — от первого до последнего
 * звучащего символа его куска, время слова — оттуда же. Распознавание здесь не
 * участвует вовсе. Инвариант тот же, что у layoutBeats: времена строго
 * возрастают, слово не короче STORY.minWord, конец последнего слова бита равен
 * концу бита.
 */
export function layoutFromAlignment(beats, spansByBeat) {
  let prev = 0;
  return beats.map((beat, i) => {
    const words = splitWords(beat.text);
    const spans = spansByBeat[i] || [];
    const bound =
      spans.length > 0
        ? { start: spans[0].start, end: spans[spans.length - 1].end }
        : { start: prev, end: round3(prev + Math.max(0.05, words.length * STORY.minWord)) };
    prev = bound.end;
    let out = mapWordsToSpans(words, spans, bound);
    const aligned = Boolean(out);
    if (!out) {
      const seconds = Math.max(0.05, bound.end - bound.start);
      const fitted = fitDurations(letterDurations(words, seconds), seconds);
      let at = bound.start;
      out = words.map((text, j) => {
        const start = round3(at);
        at = j === words.length - 1 ? bound.end : at + fitted[j];
        return { text, start, end: round3(at) };
      });
    }
    return {
      index: i,
      start: round3(bound.start),
      end: round3(bound.end),
      byWhisper: false,
      byAlignment: aligned,
      words: out,
    };
  });
}

/**
 * Границы битов из точных длин их звука: между соседними битами лежит пауза
 * тишины, и она не принадлежит ни одному из них. Распознавание здесь не
 * участвует вовсе — в этом весь смысл.
 */
export function beatBounds(seconds, pause = STORY.beatPause) {
  let at = 0;
  return seconds.map((value, i) => {
    if (i > 0) at = round3(at + pause);
    const start = at;
    at = round3(at + value);
    return { start, end: at };
  });
}

/** Есть ли у машины слова хотя бы примерно столько же, сколько в тексте. */
export function wordDrift(textCount, heardCount) {
  if (textCount === 0) return 0;
  return Math.abs(heardCount - textCount) / textCount;
}

const ENDS_PHRASE = /[.,!?;:…]["»)]?$/;

function letterCount(word) {
  const letters = String(word).match(/[\p{L}\p{N}]/gu);
  return letters ? letters.length : 1;
}

/**
 * Запасная раскладка: слово занимает время по числу своих букв, а слово с
 * точкой или запятой на конце получает лишние STORY.punctTail секунд — там
 * речь и правда притормаживает. Лишнее время не съедает больше половины бита.
 */
export function letterDurations(words, seconds) {
  const extra = words.map((w) => (ENDS_PHRASE.test(w) ? STORY.punctTail : 0));
  let held = extra.reduce((a, b) => a + b, 0);
  if (held > seconds / 2) {
    const k = seconds / 2 / held;
    for (let i = 0; i < extra.length; i += 1) extra[i] *= k;
    held = seconds / 2;
  }
  const letters = words.map(letterCount);
  const sum = letters.reduce((a, b) => a + b, 0) || 1;
  const rest = Math.max(0, seconds - held);
  return words.map((_, i) => (rest * letters[i]) / sum + extra[i]);
}

/**
 * Можно ли верить словам whisper внутри этого бита. Три проверки: он услышал
 * столько же слов, сколько в тексте (±1); ни одно не нулевой длины; времена
 * не убывают. Не прошло — слова раскладываются по буквам.
 */
export function trustHeard(heard, words) {
  if (!Array.isArray(heard) || heard.length === 0 || words.length === 0) return false;
  if (Math.abs(heard.length - words.length) > 1) return false;
  let prev = -Infinity;
  for (const w of heard) {
    if (!(w.end > w.start)) return false;
    if (w.start < prev) return false;
    prev = w.start;
  }
  return true;
}

/**
 * Времена слов прямо от whisper: слово встаёт туда, где машина его услышала,
 * и висит до следующего. Слова не влезли в границы бита с минимальной длиной —
 * возвращается null, и раскладка уходит на буквы.
 */
function spansFromHeard(heard, words, bound, min) {
  const m = heard.length;
  const n = words.length;
  const at = (j) => heard[Math.min(m - 1, Math.floor((j * m) / n))];
  const starts = [];
  let cursor = bound.start;
  for (let j = 0; j < n; j += 1) {
    const want = Math.min(Math.max(at(j).start, bound.start), bound.end);
    const start = Math.max(cursor, want);
    starts.push(start);
    cursor = start + min;
  }
  if (cursor > bound.end) return null;
  const tail = Math.min(bound.end, Math.max(heard[m - 1].end, starts[n - 1] + min));
  return starts.map((start, j) => ({
    start: round3(start),
    end: round3(j + 1 < n ? starts[j + 1] : tail),
  }));
}

/**
 * Длительности слов под точную длину бита: сумма равна ей ровно, ни одно слово
 * не короче STORY.minWord. Слов столько, что минимум не влезает, — делим поровну.
 */
export function fitDurations(durs, seconds, min = STORY.minWord) {
  const n = durs.length;
  if (n === 0) return [];
  if (seconds <= n * min) return durs.map(() => seconds / n);
  let d = durs.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  if (d.every((x) => x === 0)) d = durs.map(() => 1);
  const start = d.reduce((a, b) => a + b, 0);
  d = d.map((x) => (x * seconds) / start);
  for (let pass = 0; pass <= n; pass += 1) {
    const small = d.map((x) => x < min - 1e-9);
    const count = small.filter(Boolean).length;
    if (count === 0) break;
    const free = seconds - count * min;
    const rest = d.reduce((s, x, i) => s + (small[i] ? 0 : x), 0);
    d = d.map((x, i) => {
      if (small[i]) return min;
      return rest > 0 ? (x * free) / rest : free / (n - count);
    });
  }
  return d;
}

/**
 * Раскладывает слова текста внутри ТОЧНЫХ границ бита. Границы приходят из
 * длины звука каждого бита (`bounds`), а whisper только уточняет время слов
 * внутри бита и только когда он услышал этот кусок честно (`trustHeard`).
 * Инвариант: времена строго возрастают, слово не короче STORY.minWord,
 * конец последнего слова бита равен концу бита.
 */
export function layoutBeats(beats, heardByBeat = [], bounds = []) {
  if (!Array.isArray(bounds) || bounds.length !== beats.length) {
    throw new Error("История: у каждого бита должна быть граница по длине его звука");
  }
  return beats.map((beat, i) => {
    const words = splitWords(beat.text);
    const bound = bounds[i];
    const seconds = Math.max(0.05, bound.end - bound.start);
    const heard = heardByBeat[i] || [];
    const spans = trustHeard(heard, words)
      ? spansFromHeard(heard, words, bound, STORY.minWord)
      : null;
    let out;
    if (spans) {
      out = words.map((text, j) => ({ text, start: spans[j].start, end: spans[j].end }));
    } else {
      const fitted = fitDurations(letterDurations(words, seconds), seconds);
      let at = bound.start;
      out = words.map((text, j) => {
        const start = round3(at);
        at = j === words.length - 1 ? bound.end : at + fitted[j];
        return { text, start, end: round3(at) };
      });
    }
    return {
      index: i,
      start: round3(bound.start),
      end: round3(bound.end),
      byWhisper: Boolean(spans),
      words: out,
    };
  });
}

/** Все слова ролика подряд — из них собираются субтитры. */
export function flatWords(layout) {
  return layout.flatMap((beat) => beat.words);
}

/** Длина ролика: конец последнего бита плюс хвост. */
export function storyTotal(layout, tail = STORY.tail) {
  return round3(layout[layout.length - 1].end + tail);
}

/**
 * Клипы идут встык: кадр бита живёт от его первого слова до первого слова
 * следующего, первый начинается с нуля, последний тянется до конца ролика.
 */
export function clipDurations(layout, total) {
  return layout.map((beat, i) => {
    const from = i === 0 ? 0 : beat.start;
    const to = i === layout.length - 1 ? total : layout[i + 1].start;
    return round3(Math.max(0.2, to - from));
  });
}

/** Слов в минуту — тем же счётом, каким мерили донора. */
export function wordsPerMinute(layout, total) {
  const count = flatWords(layout).length;
  return Math.round((count / total) * 60);
}

function assTime(seconds) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s - h * 3600 - m * 60;
  return `${h}:${String(m).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
}

function assText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\n/g, " ").replace(/\{/g, "(");
}

/** Субтитры: одно слово — одно событие, под ними водяной знак на весь ролик. */
export function buildAss(layout, total, { sub = STORY.sub, mark = STORY.mark } = {}) {
  const words = flatWords(layout);
  const head = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour," +
      " BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle," +
      " BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Word,${sub.font},${sub.size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,` +
      `-1,0,0,0,100,100,0,0,1,${sub.outline},${sub.shadow},2,60,60,${sub.marginV},1`,
    `Style: Mark,${sub.font},${mark.size},&H4CFFFFFF,&H4CFFFFFF,&H90000000,&H00000000,` +
      `0,0,0,0,100,100,2,0,1,2,0,2,60,60,${mark.marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  // Слово висит до следующего слова: так его видно всегда, а не вспышкой.
  const events = words.map((w, i) => {
    const end = i === words.length - 1 ? total : Math.max(w.end, words[i + 1].start);
    return `Dialogue: 0,${assTime(w.start)},${assTime(end)},Word,,0,0,0,,${assText(w.text)}`;
  });
  events.push(`Dialogue: 0,${assTime(0)},${assTime(total)},Mark,,0,0,0,,${assText(mark.text)}`);
  return `${head.join("\n")}\n${events.join("\n")}\n`;
}

/** Длинная цифра на карточке не влезает в кадр — ей свой размер по лекалу. */
export function bigSize(value) {
  const len = String(value).length;
  if (len > 9) return "len3";
  if (len > 6) return "len2";
  return "len1";
}

/** Карточка истории по лекалу серии: те же шрифты и те же цвета. */
export function cardHtml(template, visual, story) {
  const { bg, ink, accent } = story.colors;
  const style = `--bg:${bg};--ink:${ink};--accent:${accent}`;
  let body;
  if (visual.kind === "card") {
    body =
      `<div class="big ${bigSize(visual.big)}">${escapeHtml(visual.big)}</div>` +
      `<div class="small">${escapeHtml(visual.small)}</div>`;
  } else {
    body =
      `<div class="tweet">` +
      `<div class="who"><span class="name">${escapeHtml(visual.name)}</span>` +
      `<span class="handle">${escapeHtml(visual.handle)}</span></div>` +
      `<div class="says">${escapeHtml(visual.text)}</div>` +
      (visual.meta ? `<div class="meta">${escapeHtml(visual.meta)}</div>` : "") +
      `</div>`;
  }
  // Водяного знака здесь нет: он один на весь ролик и живёт в субтитрах.
  return (
    `${templateHead(template)}<div class="story" style="${style}">\n` +
    `  <div class="stage">${body}</div>\n` +
    `</div>\n`
  );
}

/** Медленный наезд 1.00 -> zoomTo за всю длину клипа, кадр 1080×1920. */
export function zoomPart(seconds) {
  const frames = Math.max(2, Math.round(seconds * FPS));
  const step = (STORY.zoomTo - 1) / (frames - 1);
  return (
    `zoompan=z='min(1+${step.toFixed(8)}*on,${STORY.zoomTo})':d=1:` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS}`
  );
}

/**
 * Кадр 1080×1920 из картинки или куска видео: кроп заполняет кадр целиком —
 * сначала обрезка до 9:16 по центру, потом масштаб. Ни подложки, ни полей;
 * центральная обрезка заодно срезает чужие подписи по углам панели.
 * У картинки и у длинного кадра — медленный наезд.
 */
export function mediaFilter({ crop, zoom = false, seconds = 1 } = {}) {
  const scale = zoom ? 2 : 1;
  const cropPart = crop ? `crop=${crop},` : "";
  const fill =
    `scale=${1080 * scale}:${1920 * scale}:force_original_aspect_ratio=increase:flags=lanczos,` +
    `crop=${1080 * scale}:${1920 * scale}`;
  const tail = zoom ? `${zoomPart(seconds)},` : "";
  return `[0:v]${cropPart}${fill},${tail}format=yuv420p,setsar=1[vout]`;
}

/**
 * Готовый кадр 1080×1920 (карточка). Короткий бит держится статично, длинный
 * едет медленным наездом — карточка не стоит на экране дольше stillSeconds.
 */
export function stillFilter(seconds = 0) {
  if (seconds <= STORY.stillSeconds) {
    return `[0:v]scale=1080:1920,fps=${FPS},format=yuv420p,setsar=1[vout]`;
  }
  return `[0:v]scale=2160:3840:flags=lanczos,${zoomPart(seconds)},format=yuv420p,setsar=1[vout]`;
}

/** Голос и музыка: музыка тише голоса на musicDb, затухание в конце. */
export function storyAudioFilter(total, hasMusic, opts = {}) {
  const db = opts.musicDb ?? STORY.musicDb;
  const fade = opts.fadeSeconds ?? STORY.fadeSeconds;
  const fadeAt = round3(Math.max(0, total - fade));
  // Времена звука не переписываются счётчиком сэмплов: с входом concat
  // `asetpts=N/SR/TB` сминает часть дорожки в одну точку (см. docs/reels.md).
  const voice = `[1:a]aresample=48000,apad,atrim=0:${total}`;
  if (!hasMusic) return `${voice}[aout]`;
  return (
    `${voice}[va];` +
    `[2:a]aresample=48000,volume=${db}dB,apad,atrim=0:${total},` +
    `afade=t=out:st=${fadeAt}:d=${fade}[ma];` +
    `[va][ma]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`
  );
}

/** Строка лицензии на каждый файл медиа: без неё файл в ролик не идёт. */
export function licensedFiles(licensesText) {
  return new Set(
    licensesText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("`") || /^[\w.-]+\.\w+ ·/.test(line))
      .map((line) => line.replace(/^`/, "").split(/[`\s]/)[0]),
  );
}

/** Проверяет, что каждый файл медиа истории назван в LICENSES.md. */
export function checkLicenses(story, mediaDir, licensesPath) {
  const used = story.beats
    .map((b) => b.visual)
    .filter((v) => v.kind === "image" || v.kind === "video")
    .map((v) => path.basename(v.src));
  if (used.length === 0) return [];
  if (!existsSync(licensesPath)) {
    throw new Error(`Медиа без лицензий: нет файла ${licensesPath}`);
  }
  const known = licensedFiles(readFileSync(licensesPath, "utf8"));
  const missing = [...new Set(used)].filter((file) => !known.has(file));
  if (missing.length > 0) {
    throw new Error(
      `Медиа без строки в ${licensesPath}: ${missing.join(", ")} (папка ${mediaDir})`,
    );
  }
  return used;
}
