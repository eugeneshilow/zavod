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
  // Шов между кусками: столько тишины, чтобы фразы не слипались.
  chunkPauseMs: 120,
  musicDb: -14,
  fadeSeconds: 1.5,
  zoomTo: 1.06,
  // Субтитры: нижняя треть кадра, водяной знак под ними.
  sub: { font: "Arial", size: 96, outline: 6, marginV: 420 },
  mark: { size: 40, marginV: 280, text: "vibecoding.ru" },
  // Где стоит картинка в кадре: центр полосы и её предел по высоте.
  art: { centerY: 700, maxHeight: 1500 },
};

const VISUAL_KINDS = ["image", "video", "card", "tweet"];
const round3 = (n) => Math.round(n * 1000) / 1000;

function need(value, what) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`История: не хватает поля ${what}`);
  }
  return value;
}

/**
 * Голос: `say:<имя>` (встроенный в macOS) или `yandex:<голос>[:<амплуа>]`
 * (SpeechKit). Амплуа — настроение голоса: good, neutral, strict.
 */
export function parseVoice(value) {
  const [engine, name, role] = String(value ?? "")
    .trim()
    .split(":")
    .map((part) => part.trim());
  if (engine !== "say" && engine !== "yandex") {
    throw new Error(
      `История: голос бывает say:<имя> или yandex:<голос>[:<амплуа>], а не «${value}»`,
    );
  }
  if (!name) throw new Error(`История: у голоса «${engine}» не назван голос: ${engine}:<имя>`);
  if (role && engine !== "yandex") {
    throw new Error(`История: амплуа бывает только у голоса yandex, а не у «${engine}»`);
  }
  return { engine, name, role: role || null };
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
      visual: parseVisual(beat?.visual, i),
    })),
  };
}

/** Слова так, как их видит зритель: текст истории со своей пунктуацией. */
export function splitWords(text) {
  return String(text)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
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

/** Весь текст истории одним куском — его и читает голос. */
export function storyText(beats) {
  return beats.map((b) => b.text).join(" ");
}

/** Есть ли у машины слова хотя бы примерно столько же, сколько в тексте. */
export function wordDrift(textCount, heardCount) {
  if (textCount === 0) return 0;
  return Math.abs(heardCount - textCount) / textCount;
}

function evenSpan(start, end, count) {
  const step = (end - start) / count;
  return Array.from({ length: count }, (_, j) => ({
    start: round3(start + j * step),
    end: round3(start + (j + 1) * step),
  }));
}

/**
 * Раскладывает услышанные машиной слова по битам ДОЛЕЙ слов текста: бит с k
 * словами из N получает k/N услышанных слов по порядку. Показываются всегда
 * слова текста, время берётся у услышанных.
 */
export function layoutBeats(beats, heard) {
  const perBeat = beats.map((b) => splitWords(b.text));
  const total = perBeat.reduce((sum, w) => sum + w.length, 0);
  const heardCount = heard.length;
  if (heardCount === 0) throw new Error("История: машина не услышала ни одного слова");
  const bounds = [0];
  let seen = 0;
  for (const words of perBeat) {
    seen += words.length;
    bounds.push(Math.min(heardCount, Math.round((seen / total) * heardCount)));
  }
  bounds[bounds.length - 1] = heardCount;

  const out = [];
  for (const [i, words] of perBeat.entries()) {
    const from = Math.min(bounds[i], heardCount - 1);
    const to = Math.max(bounds[i + 1], from + 1);
    const mine = heard.slice(from, to);
    const start = mine[0].start;
    const end = mine[mine.length - 1].end;
    let spans;
    if (mine.length >= words.length) {
      spans = words.map((_, j) => {
        const a = Math.floor((j * mine.length) / words.length);
        const b = Math.max(a + 1, Math.floor(((j + 1) * mine.length) / words.length));
        return { start: mine[a].start, end: mine[Math.min(b, mine.length) - 1].end };
      });
    } else {
      spans = evenSpan(start, end, words.length);
    }
    out.push({
      index: i,
      start: round3(start),
      end: round3(end),
      words: words.map((text, j) => ({ text, start: spans[j].start, end: spans[j].end })),
    });
  }
  return out;
}

/** Все слова ролика подряд — из них собираются субтитры. */
export function flatWords(layout) {
  return layout.flatMap((beat) => beat.words);
}

/** Длина ролика: последнее слово плюс хвост. */
export function storyTotal(layout, tail = STORY.tail) {
  const words = flatWords(layout);
  return round3(words[words.length - 1].end + tail);
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
    `Style: Word,${sub.font},${sub.size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,` +
      `-1,0,0,0,100,100,0,0,1,${sub.outline},0,2,60,60,${sub.marginV},1`,
    `Style: Mark,${sub.font},${mark.size},&H30FFFFFF,&H30FFFFFF,&H90000000,&H00000000,` +
      `0,0,0,0,100,100,2,0,1,3,0,2,60,60,${mark.marginV},1`,
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

function even(n) {
  const v = Math.max(2, Math.round(n));
  return v % 2 === 0 ? v : v + 1;
}

/**
 * Размер и место картинки в кадре: по ширине кадра, но не выше полосы, и
 * центром выше субтитров. Всё, что осталось, закрывает размытая подложка.
 */
export function artBox(width, height, art = STORY.art) {
  let w = 1080;
  let h = (height / width) * 1080;
  if (h > art.maxHeight) {
    h = art.maxHeight;
    w = (width / height) * art.maxHeight;
  }
  w = even(w);
  h = even(h);
  const y = Math.round(Math.min(Math.max(art.centerY - h / 2, 0), 1920 - h));
  return { w, h, y };
}

/**
 * Кадр 1080×1920 из картинки или куска видео: размытая подложка на весь кадр,
 * поверх — сам кадр по ширине. Чёрных полей нет. У картинки медленный наезд.
 */
export function mediaFilter({ size, crop, zoom = false, seconds = 1 }) {
  const scale = zoom ? 2 : 1;
  const box = artBox(size.w, size.h);
  const W = 1080 * scale;
  const H = 1920 * scale;
  const cropPart = crop ? `crop=${crop},` : "";
  const parts = [
    `[0:v]${cropPart}split=2[a][b]`,
    `[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},` +
      `boxblur=${20 * scale}:2,eq=brightness=-0.22,setsar=1[bg]`,
    `[b]scale=${box.w * scale}:${box.h * scale}:flags=lanczos,setsar=1[fg]`,
  ];
  const overlay = `[bg][fg]overlay=(W-w)/2:${box.y * scale}`;
  if (!zoom) {
    parts.push(`${overlay},fps=${FPS},format=yuv420p,setsar=1[vout]`);
    return parts.join(";");
  }
  const frames = Math.max(2, Math.round(seconds * FPS));
  const step = (STORY.zoomTo - 1) / (frames - 1);
  parts.push(
    `${overlay},zoompan=z='min(1+${step.toFixed(8)}*on,${STORY.zoomTo})':d=1:` +
      `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},` +
      `format=yuv420p,setsar=1[vout]`,
  );
  return parts.join(";");
}

/** Готовый кадр 1080×1920 (карточка): просто держится нужное время. */
export function stillFilter() {
  return `[0:v]scale=1080:1920,fps=${FPS},format=yuv420p,setsar=1[vout]`;
}

/** Голос и музыка: музыка тише голоса на musicDb, затухание в конце. */
export function storyAudioFilter(total, hasMusic, opts = {}) {
  const db = opts.musicDb ?? STORY.musicDb;
  const fade = opts.fadeSeconds ?? STORY.fadeSeconds;
  const fadeAt = round3(Math.max(0, total - fade));
  const voice = `[1:a]aresample=48000,apad,atrim=0:${total},asetpts=N/SR/TB`;
  if (!hasMusic) return `${voice}[aout]`;
  return (
    `${voice}[va];` +
    `[2:a]aresample=48000,volume=${db}dB,apad,atrim=0:${total},asetpts=N/SR/TB,` +
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
