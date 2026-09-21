#!/usr/bin/env node
// История -> вертикальный ролик: закадровый голос, кадр под каждую фразу,
// по одному слову на экране в такт речи.
// node scripts/reels/render-story.mjs content/reels/stories/<id>.json
//   [--voice eleven:<voice_id>|yandex:filipp|say:Milena]
//   [--music assets/music/<файл>.mp3] [--out путь.mp4]
// Канон зоны — docs/reels.md, раздел «История».

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { FPS, encodeArgs, parseFlags, probe, run } from "./lib.mjs";
import {
  STORY,
  beatBounds,
  buildAss,
  cardHtml,
  checkLicenses,
  chunkText,
  clipDurations,
  collapseSilence,
  elevenTempo,
  flatWords,
  flowGap,
  gapStats,
  groupBeatsByLimit,
  joinVoiceText,
  layoutBeats,
  layoutFromAlignment,
  mediaFilter,
  parseFlow,
  parseStory,
  parseVoice,
  rangesInAlignment,
  scaleSpans,
  stillFilter,
  storyAudioFilter,
  storyStability,
  storyTotal,
  storyVoiceKeyParts,
  storyVoiceTexts,
  voiceCacheParts,
  voiceTextFor,
  wordDrift,
  wordSpans,
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

// Звук истории живёт сырым PCM: по его длине и проходят границы битов.
const PCM_RATE = 48000;
const secondsOfPcm = (bytes) => bytes / (PCM_RATE * 2);
const round3 = (n) => Math.round(n * 1000) / 1000;

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
function sayPcm(name, text, dir) {
  const txt = path.join(dir, "say.txt");
  const aiff = path.join(dir, "say.aiff");
  const raw = path.join(dir, "say.pcm");
  writeFileSync(txt, `${text}\n`);
  run("say", ["-v", name, "-r", String(STORY.sayRate), "-f", txt, "-o", aiff]);
  run("ffmpeg", ["-y", "-i", aiff, "-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1", raw]);
  return readFileSync(raw);
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
 * (alexander, anton, kirill) живут только здесь — v1 их не знает. Текст бита
 * длиннее предела куска режется по концам фраз и склеивается обратно звуком.
 */
async function yandexPcm(voice, text, speed, auth) {
  const hints = [{ voice: voice.name }];
  if (voice.role) hints.push({ role: voice.role });
  hints.push({ speed });
  const pause = Buffer.alloc(Math.round((PCM_RATE * STORY.chunkPauseMs) / 1000) * 2);
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
        outputAudioSpec: { rawAudio: { audioEncoding: "LINEAR16_PCM", sampleRateHertz: PCM_RATE } },
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
  return Buffer.concat(parts);
}

const ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech";
// Сырой PCM открыт не на всех планах: на отказ по формату идёт MP3 и перекод.
const ELEVEN_PCM = "pcm_48000";
const ELEVEN_MP3 = "mp3_44100_128";
// Каким форматом вошли в этот прогон — строка для отчёта, не для решений.
let elevenFormat = null;

/** Чем говорил ElevenLabs в этом прогоне: формат звука или null, если не звал. */
export function elevenFormatUsed() {
  return elevenFormat;
}

/**
 * Отказ ElevenLabs человеческими словами. Ключ сюда не попадает никогда:
 * наружу идёт только код ответа и текст ошибки движка.
 */
export function elevenError(status, body) {
  const text = String(body || "")
    .replace(/\s+/g, " ")
    .slice(0, 240);
  if (status === 401 || status === 403) {
    return `ElevenLabs не принял ключ (${status}): проверь ELEVENLABS_API_KEY в .env.local.`;
  }
  if (status === 402 || /paid_plan_required/.test(text)) {
    return (
      "ElevenLabs: этот голос закрыт тарифом. Голоса из библиотеки идут через API " +
      "только на плане Starter и выше; на бесплатном работают встроенные голоса " +
      "(category: premade). Возьми встроенный голос или подключи Starter."
    );
  }
  if (status === 429) {
    return "ElevenLabs: запросов подряд больше, чем разрешает тариф. Подожди и повтори.";
  }
  if (status === 422) return `ElevenLabs не принял запрос (422): ${text}`;
  return `ElevenLabs ответил ${status}: ${text}`;
}

/** MP3 от движка -> тот же PCM s16le 48 kHz моно, что у остальных голосов. */
function mp3ToPcm(buffer, dir) {
  const src = path.join(dir, "eleven.mp3");
  const raw = path.join(dir, "eleven.pcm");
  writeFileSync(src, buffer);
  run("ffmpeg", ["-y", "-i", src, "-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1", raw]);
  return readFileSync(raw);
}

/** Темп готового звука без смены высоты: atempo прямо по сырому PCM. */
function retempoPcm(pcm, tempo, dir) {
  if (Math.abs(tempo - 1) < 1e-4) return pcm;
  const src = path.join(dir, "tempo-in.pcm");
  const dst = path.join(dir, "tempo-out.pcm");
  const raw = ["-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1"];
  writeFileSync(src, pcm);
  run("ffmpeg", ["-y", ...raw, "-i", src, "-filter:a", `atempo=${tempo.toFixed(4)}`, ...raw, dst]);
  return readFileSync(dst);
}

/**
 * Один запрос к ElevenLabs со временем каждого символа. Ответ — JSON:
 * `audio_base64` и `alignment` (символы, начала, концы). `previous_text` и
 * `next_text` — соседние куски сценария: по ним движок держит интонацию на шве.
 */
async function elevenAskTimed(voice, text, speed, stability, key, format, context = {}) {
  const isV3 = voice.model === STORY.eleven.model;
  const settings = { stability };
  // У v3 регулятора скорости нет — её правит atempo; у v2 скорость своя.
  if (!isV3) settings.speed = speed;
  const body = {
    text,
    model_id: voice.model,
    language_code: STORY.eleven.language,
    voice_settings: settings,
  };
  if (context.previous) body.previous_text = context.previous;
  if (context.next) body.next_text = context.next;
  const res = await fetch(
    `${ELEVEN_URL}/${encodeURIComponent(voice.name)}/with-timestamps?output_format=${format}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const error = new Error(elevenError(res.status, await res.text()));
    error.status = res.status;
    throw error;
  }
  const json = await res.json();
  if (!json?.audio_base64 || !Array.isArray(json?.alignment?.characters)) {
    throw new Error(
      "ElevenLabs ответил без звука или без таймкодов: эндпоинт with-timestamps " +
        "вернул не то, чего мы ждём (см. край канона в docs/reels.md).",
    );
  }
  return { audio: Buffer.from(json.audio_base64, "base64"), alignment: json.alignment };
}

/** Тот же запрос, но с одной повторной попыткой при отказе ПО ФОРМАТУ звука. */
async function elevenTimed(voice, text, speed, stability, key, dir, context) {
  let format = elevenFormat || ELEVEN_PCM;
  let answer;
  try {
    answer = await elevenAskTimed(voice, text, speed, stability, key, format, context);
  } catch (error) {
    // Всё, кроме формата (тариф, ключ, сеть), летит человеку как есть: вторая
    // попытка тем же запросом только сожгла бы кредиты.
    const aboutFormat = [400, 422].includes(error.status);
    if (!aboutFormat || elevenFormat || format === ELEVEN_MP3) throw error;
    format = ELEVEN_MP3;
    answer = await elevenAskTimed(voice, text, speed, stability, key, format, context);
  }
  elevenFormat = format;
  return {
    pcm: format === ELEVEN_PCM ? answer.audio : mp3ToPcm(answer.audio, dir),
    alignment: answer.alignment,
  };
}

/**
 * ElevenLabs: вся история одним запросом. Биты склеиваются в один текст через
 * пустую строку (у v3 это пауза), и движок возвращает звук вместе со временем
 * каждого символа — из них и берутся границы битов и время слов. Распознавание
 * здесь не участвует вовсе. Сценарий длиннее предела режется по границам битов,
 * и каждый кусок едет с текстами соседей. Канон — docs/reels.md.
 */
export async function elevenStoryVoice(story, dir, { collapse } = {}) {
  const voiceDir = path.join(dir, "voice");
  mkdirSync(voiceDir, { recursive: true });
  const key = envValue("ELEVENLABS_API_KEY");
  if (!key) {
    throw new Error(
      "Голос eleven просит ELEVENLABS_API_KEY в .env.local (ключ из профиля elevenlabs.io).",
    );
  }
  const flow = parseFlow(story.flow);
  const gap = flowGap(flow);
  const smooth = collapse ?? flow === "continuous";
  const texts = storyVoiceTexts(story);
  const whole = joinVoiceText(texts, gap);
  const cacheKey = keyOf(storyVoiceKeyParts(story, whole));
  const raw = path.join(voiceDir, `${cacheKey}.pcm`);
  const meta = path.join(voiceDir, `${cacheKey}.json`);
  const wav = path.join(dir, "voice.wav");
  const tempo = story.voice.model === STORY.eleven.model ? elevenTempo(story.speed) : 1;

  let saved = null;
  if (existsSync(raw) && existsSync(meta)) {
    try {
      saved = JSON.parse(readFileSync(meta, "utf8"));
    } catch {
      saved = null;
    }
  }
  if (saved?.format) elevenFormat = saved.format;

  let fresh = 0;
  if (!saved?.spans) {
    // В кеш ложится звук и времена ДО темпа: atempo применяется на выходе,
    // поэтому подбор скорости не стоит ни одного кредита.
    const groups = groupBeatsByLimit(texts, STORY.eleven.oneShot, gap);
    const pause = Buffer.alloc(Math.round(PCM_RATE * STORY.beatPause) * 2);
    const parts = [];
    const spans = [];
    let at = 0;
    for (const [g, group] of groups.entries()) {
      const pieces = group.map((i) => texts[i]);
      const answer = await elevenTimed(
        story.voice,
        joinVoiceText(pieces, gap),
        story.speed,
        storyStability(story),
        key,
        dir,
        {
          previous:
            g > 0
              ? joinVoiceText(
                  groups[g - 1].map((i) => texts[i]),
                  gap,
                )
              : null,
          next:
            g + 1 < groups.length
              ? joinVoiceText(
                  groups[g + 1].map((i) => texts[i]),
                  gap,
                )
              : null,
        },
      );
      if (parts.length > 0) {
        parts.push(pause);
        at = round3(at + STORY.beatPause);
      }
      parts.push(answer.pcm);
      const ranges = rangesInAlignment(answer.alignment, pieces);
      for (const [k, i] of group.entries()) {
        const offset = at;
        spans[i] = wordSpans(answer.alignment, ranges[k]).map((w) => ({
          text: w.text,
          start: round3(w.start + offset),
          end: round3(w.end + offset),
        }));
      }
      at = round3(at + secondsOfPcm(answer.pcm.length));
    }
    writeFileSync(raw, Buffer.concat(parts));
    saved = { spans, groups: groups.length, format: elevenFormat };
    writeFileSync(meta, `${JSON.stringify(saved, null, 2)}\n`);
    fresh = 1;
  }
  // Сведение, потом темп — оба шага на выходе, оба и к звуку, и к временам.
  // В кеше лежит звук ДО них, поэтому подбор maxGap не стоит кредитов.
  let pcm = readFileSync(raw);
  let spansByBeat = story.beats.map((_, i) => saved.spans[i] || []);
  const before = gapStats(pcm);
  let removed = 0;
  if (smooth) {
    const counts = spansByBeat.map((list) => list.length);
    const cut = collapseSilence(pcm, spansByBeat.flat());
    pcm = cut.pcm;
    removed = cut.removed;
    let at = 0;
    spansByBeat = counts.map((count) => cut.words.slice(at, (at += count)));
  }
  const gaps = { before, after: gapStats(pcm), removed, collapsed: smooth };
  const tuned = path.join(dir, "voice.pcm");
  writeFileSync(tuned, retempoPcm(pcm, tempo, voiceDir));
  run("ffmpeg", ["-y", "-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1", "-i", tuned, wav]);
  return {
    kind: "aligned",
    wav,
    spansByBeat: spansByBeat.map((list) => scaleSpans(list, tempo)),
    groups: saved.groups,
    gaps,
    fresh,
  };
}

/** Звук одного бита в PCM s16le 48 kHz моно — что бы его ни произносило. */
async function speakBeat(voice, text, speed, dir, auth) {
  if (voice.engine === "say") return sayPcm(voice.name, text, dir);
  return yandexPcm(voice, text, speed, auth);
}

/**
 * Голос по битам: у каждого бита свой запрос и свой файл с ключом по тексту,
 * голосу и скорости, поэтому переозвучивается только изменившийся бит. Биты
 * склеиваются через STORY.beatPause тишины, и границы битов берутся из ТОЧНОЙ
 * длины звука каждого из них — не из распознавания. Канон — docs/reels.md.
 */
export async function voiceByBeats(story, dir) {
  const voiceDir = path.join(dir, "voice");
  mkdirSync(voiceDir, { recursive: true });
  const auth = story.voice.engine === "yandex" ? yandexAuth() : null;
  const silence = Buffer.alloc(Math.round(PCM_RATE * STORY.beatPause) * 2);
  const parts = [];
  const files = [];
  let fresh = 0;
  for (const beat of story.beats) {
    const key = keyOf(voiceCacheParts(story, beat));
    const said = voiceTextFor(story.voice.engine, beat);
    const raw = path.join(voiceDir, `${key}.pcm`);
    const wav = path.join(voiceDir, `${key}.wav`);
    if (!existsSync(raw) || !existsSync(wav)) {
      const pcm = await speakBeat(story.voice, said, story.speed, voiceDir, auth);
      writeFileSync(raw, pcm);
      run("ffmpeg", ["-y", "-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1", "-i", raw, wav]);
      fresh += 1;
    }
    parts.push(readFileSync(raw));
    files.push({ key, wav });
  }
  const bounds = beatBounds(parts.map((pcm) => secondsOfPcm(pcm.length)));
  // Сюда приходят только say и yandex: у ElevenLabs своя дорога, одним куском.
  const whole = [];
  for (const [i, pcm] of parts.entries()) {
    if (i > 0) whole.push(silence);
    whole.push(pcm);
  }
  const raw = path.join(dir, "voice.pcm");
  const wav = path.join(dir, "voice.wav");
  writeFileSync(raw, Buffer.concat(whole));
  run("ffmpeg", ["-y", "-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1", "-i", raw, wav]);
  return { wav, bounds, files, fresh };
}

/**
 * Время слов внутри одного бита: whisper-cli с -ml 1 -sow на звуке этого бита.
 * Короткий кусок он размечает честнее длинного, но всё равно врёт, поэтому его
 * слова проходят проверку в layoutBeats. Разметка кеширована по ключу бита.
 */
export function hearWords(wavPath, outBase) {
  mkdirSync(path.dirname(outBase), { recursive: true });
  if (!existsSync(`${outBase}.json`)) {
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
      outBase,
      "-f",
      wavPath,
    ]);
  }
  let data;
  try {
    data = JSON.parse(readFileSync(`${outBase}.json`, "utf8"));
  } catch {
    return [];
  }
  return (data.transcription || [])
    .map((seg) => ({
      text: String(seg.text || "").trim(),
      start: (seg.offsets?.from ?? 0) / 1000,
      end: (seg.offsets?.to ?? 0) / 1000,
    }))
    .filter((w) => w.text && !/^\[.*\]$/.test(w.text));
}

/** Слова каждого бита во времени всего ролика: сдвиг на начало бита. */
export function hearByBeats(files, bounds, dir) {
  return files.map((file, i) =>
    hearWords(file.wav, path.join(dir, "words", file.key)).map((w) => ({
      text: w.text,
      start: round3(w.start + bounds[i].start),
      end: round3(w.end + bounds[i].start),
    })),
  );
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

/** Один кадр истории -> клип своей длительности, 1080×1920, без звука. */
export function renderClip(visual, seconds, target, cardFile) {
  const ff = "ffmpeg";
  const args = ["-y"];
  let filter;
  if (visual.kind === "card" || visual.kind === "tweet") {
    args.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", cardFile);
    filter = stillFilter(seconds);
  } else if (visual.kind === "image") {
    const src = path.join(MEDIA_DIR, visual.src);
    args.push("-loop", "1", "-framerate", String(FPS), "-t", String(seconds), "-i", src);
    filter = mediaFilter({ zoom: true, seconds });
  } else {
    const src = path.join(MEDIA_DIR, visual.src);
    const duration = sizeOf(src).duration;
    const from = Math.max(0, Math.min(visual.from || 0, Math.max(0, duration - 0.2)));
    args.push("-stream_loop", "-1", "-ss", String(from), "-t", String(seconds), "-i", src);
    filter = mediaFilter({ crop: visual.crop, seconds });
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

  // У ElevenLabs вся история озвучивается одним запросом, и времена слов
  // приходят таймкодами символов; у say и SpeechKit — по битам плюс whisper.
  const oneShot = story.voice.engine === "eleven";
  const sound = oneShot ? await elevenStoryVoice(story, dir) : await voiceByBeats(story, dir);
  const heardByBeat = oneShot ? sound.spansByBeat : hearByBeats(sound.files, sound.bounds, dir);
  const layout = oneShot
    ? layoutFromAlignment(story.beats, sound.spansByBeat)
    : layoutBeats(story.beats, heardByBeat, sound.bounds);
  const total = storyTotal(layout);
  const durations = clipDurations(layout, total);
  const words = flatWords(layout);
  const heardCount = heardByBeat.reduce((sum, list) => sum + list.length, 0);
  const drift = wordDrift(words.length, heardCount);
  const wav = sound.wav;

  writeFileSync(
    path.join(dir, "beats.json"),
    `${JSON.stringify(
      {
        pause: STORY.beatPause,
        total,
        beats: layout.map((beat) => ({
          index: beat.index,
          start: beat.start,
          end: beat.end,
          byWhisper: beat.byWhisper,
          byAlignment: Boolean(beat.byAlignment),
          words: beat.words.length,
          text: story.beats[beat.index].text,
        })),
      },
      null,
      2,
    )}\n`,
  );

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
    oneShot,
    requests: oneShot ? sound.groups : story.beats.length,
    byWhisper: layout.filter((beat) => beat.byWhisper).length,
    byAlignment: layout.filter((beat) => beat.byAlignment).length,
    resynth: sound.fresh,
    words: words.length,
    heard: heardCount,
    drift,
    voice: story.voice,
    speed: story.speed,
    stability: storyStability(story),
    flow: story.flow,
    // Сколько пауз было и стало и сколько секунд вырезано — только у eleven.
    gaps: sound.gaps || null,
    // Темп, который реально применили: у v3 он подрезан до края (см. канон).
    tempo: story.voice.engine === "eleven" ? elevenTempo(story.speed) : story.speed,
    format: elevenFormatUsed(),
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
      `${r.voice.model ? ` · модель ${r.voice.model}` : ""}` +
      `${r.format ? ` · формат ${r.format}` : ""}` +
      ` · скорость ${r.speed}` +
      `${r.voice.engine === "eleven" ? ` · ровность ${r.stability}` : ""}` +
      `${r.voice.engine === "say" ? " (черновик: озвучить живым движком)" : ""}` +
      ` · ${r.music ? `music ${path.basename(r.music)}` : "музыки нет"} · субтитры ${r.subs}`,
    r.oneShot
      ? `  озвучено ${r.resynth ? "заново" : "из кеша"} · вся история ${r.requests} запросом(ами)` +
        ` · время слов от таймкодов ElevenLabs в ${r.byAlignment} битах из ${r.beats},` +
        ` в остальных по буквам`
      : `  озвучено заново битов ${r.resynth} из ${r.beats} · время слов от whisper` +
        ` в ${r.byWhisper} битах, в остальных по буквам`,
  ];
  // Поток без пауз: сколько их было и стало. Канон — docs/reels.md.
  if (r.gaps) {
    const { before, after, removed, collapsed } = r.gaps;
    lines.push(
      `  поток: ${r.flow} · пауз ≥${STORY.collapse.heard} с: ${before.count} → ${after.count}` +
        ` (медиана ${before.median} → ${after.median} с, тишина ${before.share} → ${after.share} %)` +
        ` · вырезано ${removed} с${collapsed ? "" : " (сведение выключено)"}`,
    );
  }
  // Ролик длиннее минуты не останавливает сборку, но о нём говорят вслух:
  // лечится он короче написанным текстом, а не ускорением голоса.
  if (r.expected > STORY.maxSeconds) {
    const cut = Math.max(1, Math.round(r.words - (STORY.maxSeconds / 60) * wpm));
    lines.push(
      `  ⚠️ ролик ${r.expected.toFixed(1)} с — длиннее ${STORY.maxSeconds} с:` +
        ` убери около ${cut} слов (ориентир — ${STORY.targetWords} слов на ролик)`,
    );
  }
  if (r.tempo !== undefined && Math.abs(r.tempo - r.speed) > 1e-4) {
    lines.push(
      `  ⚠️ скорость ${r.speed} вне краёв ${STORY.eleven.tempoMin}–${STORY.eleven.tempoMax}:` +
        ` звук ускорен до ${r.tempo}`,
    );
  }
  if (r.drift > 0.15) {
    lines.push(
      r.oneShot
        ? `  ⚠️ голос сказал ${r.heard} слов против ${r.words} на экране` +
            ` (расхождение ${Math.round(r.drift * 100)} %): так бывает от чисел словами в say`
        : `  ⚠️ машина услышала ${r.heard} слов против ${r.words} в тексте` +
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
