#!/usr/bin/env node
// История -> вертикальный ролик: закадровый голос, кадр под каждую фразу,
// по одному слову на экране в такт речи.
// node scripts/reels/render-story.mjs content/reels/stories/<id>.json
//   [--voice say:Milena|yandex:filipp] [--music assets/music/<файл>.mp3] [--out путь.mp4]
// Канон зоны — docs/reels.md, раздел «История».

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { FPS, encodeArgs, parseFlags, probe, run } from "./lib.mjs";
import {
  STORY,
  buildAss,
  cardHtml,
  checkLicenses,
  chunkText,
  clipDurations,
  flatWords,
  layoutBeats,
  mediaFilter,
  parseStory,
  parseVoice,
  stillFilter,
  storyAudioFilter,
  storyText,
  storyTotal,
  wordDrift,
  wordsPerMinute,
} from "./story.mjs";

const TEMPLATE = "content/reels/template.html";
const MEDIA_DIR = "content/reels/media";
const LICENSES = path.join(MEDIA_DIR, "LICENSES.md");
const WHISPER_MODEL =
  process.env.WHISPER_MODEL ||
  path.join(homedir(), ".cache/whisper-cpp/ggml-large-v3-turbo-q5_0.bin");
// Субтитры вжигает libass; сборка ffmpeg из PATH бывает без него.
const FFMPEG_CANDIDATES = [
  process.env.FFMPEG_ASS,
  "ffmpeg",
  "/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg",
].filter(Boolean);

let ffmpegAssCache = null;

/** Первый ffmpeg, который умеет фильтр ass. Без него субтитры не вжечь. */
export function ffmpegWithAss() {
  if (ffmpegAssCache) return ffmpegAssCache;
  for (const bin of FFMPEG_CANDIDATES) {
    try {
      if (/^\s*\.\. ass\b/m.test(run(bin, ["-hide_banner", "-filters"]))) {
        ffmpegAssCache = bin;
        return bin;
      }
    } catch {
      // нет такого ffmpeg — пробуем следующий
    }
  }
  throw new Error(
    "Не нашёл ffmpeg с фильтром ass (libass): субтитры не вжечь. " +
      "Поставь ffmpeg с libass или укажи путь переменной FFMPEG_ASS.",
  );
}

/** Ключи из .env.local, если их нет в окружении. Значения наружу не печатаются. */
export function envValue(name) {
  if (process.env[name]) return process.env[name];
  if (!existsSync(".env.local")) return "";
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const at = line.indexOf("=");
    if (at > 0 && line.slice(0, at).trim() === name) {
      return line
        .slice(at + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

/** Встроенный голос macOS: черновик, чтобы увидеть монтаж. */
function sayVoice(name, text, dir) {
  const txt = path.join(dir, "text.txt");
  const aiff = path.join(dir, "voice.aiff");
  const wav = path.join(dir, "voice.wav");
  writeFileSync(txt, `${text}\n`);
  run("say", ["-v", name, "-r", String(STORY.sayRate), "-f", txt, "-o", aiff]);
  run("ffmpeg", ["-y", "-i", aiff, "-ar", "48000", "-ac", "1", wav]);
  return wav;
}

/** Тихий вызов `yc`: пусто, если консоли нет или она не отвечает. */
function ycSay(args) {
  try {
    return run("yc", args).trim();
  } catch {
    return "";
  }
}

/**
 * Доступ к SpeechKit: либо ключ из .env.local (заголовок `Api-Key`), либо
 * живая консоль `yc` (заголовок `Bearer`). Значения не печатаются ни в лог,
 * ни в отчёт — наружу идёт только строка «чем вошли».
 */
export function yandexAuth() {
  const key = envValue("YC_API_KEY");
  let folder = envValue("YC_FOLDER_ID");
  if (!folder) folder = ycSay(["config", "get", "folder-id"]);
  if (key) {
    if (!folder) throw new Error("Голос yandex: есть YC_API_KEY, но не назван YC_FOLDER_ID.");
    return { header: `Api-Key ${key}`, folder, via: "ключ из .env.local" };
  }
  const token = ycSay(["iam", "create-token"]);
  if (!token) {
    throw new Error(
      "Голос yandex просит либо YC_API_KEY и YC_FOLDER_ID в .env.local, " +
        "либо живую консоль yc (`yc iam create-token`).",
    );
  }
  if (!folder) throw new Error("Голос yandex: не понял folderId — назови YC_FOLDER_ID.");
  return { header: `Bearer ${token}`, folder, via: "консоль yc" };
}

/** Ответ v3 — поток строк JSON; звук лежит кусками в result.audioChunk.data. */
export function joinAudioChunks(stream) {
  const chunks = [];
  for (const line of String(stream).split("\n")) {
    const text = line.trim();
    if (!text) continue;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    const data = parsed?.result?.audioChunk?.data;
    if (data) chunks.push(Buffer.from(data, "base64"));
  }
  if (chunks.length === 0) throw new Error("SpeechKit вернул ответ без звука");
  return Buffer.concat(chunks);
}

/**
 * Яндекс SpeechKit, REST v3: один путь для всех голосов. Голоса с амплуа
 * (alexander, anton, kirill) живут только здесь — v1 их не знает.
 */
async function yandexVoice(voice, text, dir, speed) {
  const auth = yandexAuth();
  const hints = [{ voice: voice.name }];
  if (voice.role) hints.push({ role: voice.role });
  hints.push({ speed });
  const pause = Buffer.alloc(Math.round((48000 * STORY.chunkPauseMs) / 1000) * 2);
  const parts = [];
  for (const piece of chunkText(text)) {
    const res = await fetch("https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis", {
      method: "POST",
      headers: {
        Authorization: auth.header,
        "x-folder-id": auth.folder,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: piece,
        outputAudioSpec: { rawAudio: { audioEncoding: "LINEAR16_PCM", sampleRateHertz: 48000 } },
        hints,
        loudnessNormalizationType: "LUFS",
      }),
    });
    if (!res.ok) {
      throw new Error(
        `SpeechKit ответил ${res.status} на куске «${piece.slice(0, 40)}…»: ` +
          `${(await res.text()).slice(0, 160)}`,
      );
    }
    if (parts.length > 0) parts.push(pause);
    parts.push(joinAudioChunks(await res.text()));
  }
  const raw = path.join(dir, "voice.pcm");
  const wav = path.join(dir, "voice.wav");
  writeFileSync(raw, Buffer.concat(parts));
  run("ffmpeg", ["-y", "-f", "s16le", "-ar", "48000", "-ac", "1", "-i", raw, wav]);
  return wav;
}

export async function synthVoice(voice, text, dir, speed = STORY.speed) {
  if (voice.engine === "say") return sayVoice(voice.name, text, dir);
  return yandexVoice(voice, text, dir, speed);
}

/** Время каждого слова: whisper-cli с -ml 1 -sow режет речь по словам. */
export function hearWords(wavPath, dir) {
  const of = path.join(dir, "words");
  run("whisper-cli", [
    "-m",
    WHISPER_MODEL,
    "-l",
    "ru",
    "-ml",
    "1",
    "-sow",
    "-oj",
    "-of",
    of,
    "-f",
    wavPath,
  ]);
  const data = JSON.parse(readFileSync(`${of}.json`, "utf8"));
  return (data.transcription || [])
    .map((seg) => ({
      text: String(seg.text || "").trim(),
      start: (seg.offsets?.from ?? 0) / 1000,
      end: (seg.offsets?.to ?? 0) / 1000,
    }))
    .filter((w) => w.text && !/^\[.*\]$/.test(w.text));
}

/** Ключ кеша: кадр пересобирается, только когда меняется он сам. */
export function keyOf(value) {
  return createHash("sha1").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

/** Что уже посчитано в прошлый раз: путь -> ключ. */
function readCache(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Карточки истории снимает тот же Playwright, что и слайды серии. Уже снятая
 * карточка берётся из кеша: переозвучка не гоняет браузер заново.
 */
export async function shootCards(story, template, framesDir) {
  const cards = story.beats
    .map((beat, i) => ({ i, visual: beat.visual }))
    .filter(({ visual }) => visual.kind === "card" || visual.kind === "tweet");
  const files = new Map();
  if (cards.length === 0) return files;
  const cacheFile = path.join(framesDir, "cache.json");
  const cache = readCache(cacheFile);
  const fresh = {};
  const todo = [];
  for (const card of cards) {
    const file = path.join(framesDir, `${String(card.i).padStart(3, "0")}.png`);
    const key = keyOf([card.visual, story.colors]);
    fresh[file] = key;
    files.set(card.i, file);
    if (cache[file] === key && existsSync(file)) continue;
    todo.push({ ...card, file });
  }
  writeFileSync(cacheFile, `${JSON.stringify(fresh, null, 2)}\n`);
  if (todo.length === 0) return files;
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  try {
    for (const { visual, file } of todo) {
      await page.setContent(cardHtml(template, visual, story), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: file, type: "png" });
    }
  } finally {
    await browser.close();
  }
  return files;
}

function sizeOf(file) {
  const info = probe(file);
  return { w: info.width, h: info.height, duration: info.duration };
}

function cropSize(crop, size) {
  if (!crop) return size;
  const [w, h] = String(crop).split(":").map(Number);
  return { w, h };
}

/** Один кадр истории -> клип своей длительности, 1080×1920, без звука. */
export function renderClip(visual, seconds, target, cardFile) {
  const ff = "ffmpeg";
  const args = ["-y"];
  let filter;
  if (visual.kind === "card" || visual.kind === "tweet") {
    args.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", cardFile);
    filter = stillFilter();
  } else if (visual.kind === "image") {
    const src = path.join(MEDIA_DIR, visual.src);
    const size = sizeOf(src);
    args.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", src);
    filter = mediaFilter({ size, zoom: true, seconds });
  } else {
    const src = path.join(MEDIA_DIR, visual.src);
    const size = sizeOf(src);
    const from = Math.max(0, Math.min(visual.from || 0, Math.max(0, size.duration - 0.2)));
    args.push("-stream_loop", "-1", "-ss", String(from), "-t", String(seconds), "-i", src);
    filter = mediaFilter({ size: cropSize(visual.crop, size), crop: visual.crop, seconds });
  }
  args.push(
    "-filter_complex",
    filter,
    "-map",
    "[vout]",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-t",
    String(seconds),
    target,
  );
  run(ff, args);
  return target;
}

export async function renderStory(storyPath, { voice, music, out } = {}) {
  const template = readFileSync(TEMPLATE, "utf8");
  const story = parseStory(JSON.parse(readFileSync(storyPath, "utf8")));
  if (voice) story.voice = parseVoice(voice);
  const track = music || story.music || null;
  checkLicenses(story, MEDIA_DIR, LICENSES);

  const dir = path.join("out", "reels", story.id);
  const framesDir = path.join(dir, "frames");
  const clipsDir = path.join(dir, "clips");
  mkdirSync(framesDir, { recursive: true });
  mkdirSync(clipsDir, { recursive: true });

  const text = storyText(story.beats);
  const wav = await synthVoice(story.voice, text, dir, story.speed);
  const heard = hearWords(wav, dir);
  const layout = layoutBeats(story.beats, heard);
  const total = storyTotal(layout);
  const durations = clipDurations(layout, total);
  const words = flatWords(layout);
  const drift = wordDrift(words.length, heard.length);

  const assPath = path.join(dir, "subs.ass");
  writeFileSync(assPath, buildAss(layout, total));

  const cards = await shootCards(story, template, framesDir);
  const clipCacheFile = path.join(clipsDir, "cache.json");
  const clipCache = readCache(clipCacheFile);
  const clipKeys = {};
  const clips = story.beats.map((beat, i) => {
    const file = path.join(clipsDir, `${String(i).padStart(3, "0")}.mp4`);
    const key = keyOf([beat.visual, durations[i]]);
    clipKeys[file] = key;
    if (clipCache[file] === key && existsSync(file)) return file;
    return renderClip(beat.visual, durations[i], file, cards.get(i));
  });
  writeFileSync(clipCacheFile, `${JSON.stringify(clipKeys, null, 2)}\n`);

  const listPath = path.join(dir, "clips.txt");
  writeFileSync(listPath, `${clips.map((c) => `file '${path.resolve(c)}'`).join("\n")}\n`);

  const target = out || path.join("out", "reels", `${story.id}.mp4`);
  mkdirSync(path.dirname(target), { recursive: true });
  const inputs = ["-f", "concat", "-safe", "0", "-i", listPath, "-i", wav];
  if (track) inputs.push("-i", track);
  run(ffmpegWithAss(), [
    "-y",
    ...inputs,
    "-filter_complex",
    `[0:v]ass=${assPath}[vout];${storyAudioFilter(total, Boolean(track))}`,
    ...encodeArgs(total),
    target,
  ]);

  return {
    id: story.id,
    title: story.title,
    out: target,
    beats: story.beats.length,
    words: words.length,
    heard: heard.length,
    drift,
    voice: story.voice,
    speed: story.speed,
    music: track,
    subs: assPath,
    expected: total,
    info: probe(target),
  };
}

export function report(r) {
  const wpm = wordsPerMinute([{ words: Array(r.words).fill({}) }], r.expected);
  const lines = [
    `${r.id}: ${r.out}`,
    `  «${r.title}» · битов ${r.beats} · слов ${r.words} · ${wpm} слов в минуту` +
      ` (донор ${STORY.donorWpm})`,
    `  ожидали ${r.expected} с · вышло ${r.info.duration.toFixed(2)} с · ${r.info.width}x${r.info.height}` +
      ` · ${r.info.sizeMb} МБ · audio: ${r.info.audio || "нет"}`,
    `  voice: ${r.voice.engine}:${r.voice.name}${r.voice.role ? `:${r.voice.role}` : ""}` +
      ` · скорость ${r.speed}${r.voice.engine === "say" ? " (черновик: озвучить SpeechKit)" : ""}` +
      ` · ${r.music ? `music ${path.basename(r.music)}` : "музыки нет"} · субтитры ${r.subs}`,
  ];
  if (r.drift > 0.15) {
    lines.push(
      `  ⚠️ машина услышала ${r.heard} слов против ${r.words} в тексте` +
        ` (расхождение ${Math.round(r.drift * 100)} %): проверь субтитры`,
    );
  }
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { flags, rest } = parseFlags(process.argv.slice(2));
  if (rest.length === 0) {
    console.error("Нужен путь к истории: node scripts/reels/render-story.mjs <story.json>");
    process.exit(1);
  }
  const r = await renderStory(rest[0], {
    voice: flags.voice,
    music: flags.music,
    out: flags.out,
  });
  console.log(report(r));
}
