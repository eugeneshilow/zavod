#!/usr/bin/env node
// Объяснялка -> горизонтальный ролик 1920×1080: голос ElevenLabs со временем
// каждой буквы, сцены рисуются кодом в браузере кадр за кадром, ffmpeg сводит.
// node scripts/explainers/render.mjs content/explainers/<id>
//   [--draft]            без голоса: тайминг по числу знаков, звука нет
//   [--stills 3,12.5]    только кадры PNG в эти секунды, без видео
//   [--no-music]         без музыкальной подложки
//   [--out путь.mp4]
// Канон зоны — docs/explainers.md.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { probe, run } from "../reels/lib.mjs";
import { elevenError, envValue } from "../reels/render-story.mjs";
import {
  EXPLAINER,
  buildTimeline,
  draftClock,
  letterClock,
  parseExplainer,
  voiceScript,
  wordsPerMinute,
} from "./timeline.mjs";

const KIT = "content/explainers/kit.js";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500" +
  "&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&display=block";

const keyOf = (parts) =>
  createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);

/** Одна страница: шрифты, холст, набор и сцены ролика, таймлайн. */
export function shellHtml(kit, scene, timeline) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>html,body{margin:0;background:#090D17;overflow:hidden}canvas{display:block}</style>
</head><body><canvas id="stage"></canvas>
<script>${kit}</script>
<script>${scene}</script>
<script>K.run(window.SCENES, ${JSON.stringify(timeline)});</script>
</body></html>`;
}

/** Голос всего сценария одним запросом: звук и время каждой буквы. Кеш по тексту. */
async function elevenVoice(script, text, dir) {
  const [engine, voiceId] = script.voice.split(":");
  if (engine !== "eleven" || !voiceId) {
    throw new Error(`Голос ${script.voice}: объяснялка пока говорит только голосом eleven:<id>.`);
  }
  if (text.length > EXPLAINER.maxChars) {
    throw new Error(
      `Текст для голоса — ${text.length} знаков, предел одного запроса ${EXPLAINER.maxChars}. Режь сценарий.`,
    );
  }
  const voiceDir = path.join(dir, "voice");
  mkdirSync(voiceDir, { recursive: true });
  const key = keyOf([voiceId, EXPLAINER.model, script.stability, text]);
  const mp3 = path.join(voiceDir, `${key}.mp3`);
  const meta = path.join(voiceDir, `${key}.json`);
  if (existsSync(mp3) && existsSync(meta)) {
    return { mp3, alignment: JSON.parse(readFileSync(meta, "utf8")), fresh: false };
  }
  const apiKey = envValue("ELEVENLABS_API_KEY");
  if (!apiKey) throw new Error("Голос eleven просит ELEVENLABS_API_KEY в .env.local.");
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: EXPLAINER.model,
        language_code: "ru",
        voice_settings: { stability: script.stability },
      }),
    },
  );
  if (!res.ok) throw new Error(elevenError(res.status, await res.text()));
  const json = await res.json();
  if (!json?.audio_base64 || !Array.isArray(json?.alignment?.characters)) {
    throw new Error("ElevenLabs ответил без звука или без таймкодов (with-timestamps).");
  }
  writeFileSync(mp3, Buffer.from(json.audio_base64, "base64"));
  writeFileSync(meta, `${JSON.stringify(json.alignment)}\n`);
  return { mp3, alignment: json.alignment, fresh: true };
}

/** Голос в WAV с темпом и тишиной до первого слова. Ответ — путь и длина до темпа. */
function voiceTrack(mp3, tempo, dir) {
  const wav = path.join(dir, "voice.wav");
  const raw = probe(mp3).duration;
  const filter = [
    tempo !== 1 ? `atempo=${tempo.toFixed(4)}` : null,
    `adelay=${Math.round(EXPLAINER.lead * 1000)}:all=1`,
    "aresample=48000",
  ]
    .filter(Boolean)
    .join(",");
  run("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-af", filter, "-ac", "1", wav]);
  return { wav, seconds: raw };
}

async function openStage(kit, scene, timeline) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: EXPLAINER.width, height: EXPLAINER.height },
    deviceScaleFactor: 1,
  });
  await page.setContent(shellHtml(kit, scene, timeline), { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('500 64px "Literata"'),
      document.fonts.load('italic 400 46px "Literata"'),
      document.fonts.load('400 40px "Inter"'),
      document.fonts.load('400 40px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
  });
  return { browser, page };
}

/** Кадры прямо в ffmpeg через трубу: JPEG на вход, H.264 на выход, без звука. */
async function shootVideo(page, timeline, silent) {
  const frames = Math.ceil(timeline.total * EXPLAINER.fps);
  const ff = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(EXPLAINER.fps),
      "-c:v",
      "mjpeg",
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      silent,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const closed = new Promise((resolve, reject) => {
    ff.on("error", reject);
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg вышел с кодом ${code}`)),
    );
  });
  for (let f = 0; f < frames; f += 1) {
    await page.evaluate((t) => window.drawFrame(t), f / EXPLAINER.fps);
    const jpg = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 300 === 0) process.stdout.write(`  кадр ${f}/${frames}\n`);
  }
  ff.stdin.end();
  await closed;
  return frames;
}

/** Сведение: картинка + голос (+ тихая музыка с затуханием в конце). */
function mux(silent, voiceWav, musicPath, total, out) {
  const args = ["-y", "-loglevel", "error", "-i", silent];
  if (voiceWav) args.push("-i", voiceWav);
  if (voiceWav && musicPath) args.push("-stream_loop", "-1", "-i", musicPath);
  if (!voiceWav) {
    args.push("-c:v", "copy", "-movflags", "+faststart", out);
    run("ffmpeg", args);
    return;
  }
  const fadeAt = Math.max(0, total - 2).toFixed(2);
  const filter = musicPath
    ? `[1:a]apad,atrim=0:${total}[v];[2:a]volume=0.07,atrim=0:${total},afade=t=in:d=1,afade=t=out:st=${fadeAt}:d=2[m];[v][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5[a]`
    : `[1:a]apad,atrim=0:${total},loudnorm=I=-16:TP=-1.5[a]`;
  args.push(
    "-filter_complex",
    filter,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-t",
    String(total),
    "-movflags",
    "+faststart",
    out,
  );
  run("ffmpeg", args);
}

const BOOLEAN_FLAGS = new Set(["draft", "no-music"]);

/** Флаги: --draft и --no-music без значения, остальные — со значением. */
export function parseArgs(argv) {
  const flags = {};
  let folder = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      folder ??= a;
      continue;
    }
    const name = a.slice(2);
    if (BOOLEAN_FLAGS.has(name)) flags[name] = true;
    else {
      flags[name] = argv[i + 1];
      i += 1;
    }
  }
  return { folder, flags };
}

export async function renderExplainer(folder, flags = {}) {
  const started = Date.now();
  const script = parseExplainer(readFileSync(path.join(folder, "script.json"), "utf8"));
  const scene = readFileSync(path.join(folder, "scene.js"), "utf8");
  const kit = readFileSync(KIT, "utf8");
  const dir = path.join("out", "explainers", script.id);
  mkdirSync(dir, { recursive: true });

  const voice = voiceScript(script.scenes);
  let clock;
  let voiceSeconds;
  let tempo = script.tempo;
  let voiceWav = null;
  let fresh = false;
  if (flags.draft) {
    clock = draftClock(voice.text);
    voiceSeconds = voice.text.length / EXPLAINER.draftCharsPerSecond;
    tempo = 1;
  } else {
    const spoken = await elevenVoice(script, voice.text, dir);
    fresh = spoken.fresh;
    clock = letterClock(voice.text, spoken.alignment);
    const track = voiceTrack(spoken.mp3, tempo, dir);
    voiceWav = track.wav;
    voiceSeconds = track.seconds;
  }
  const timeline = buildTimeline({ scenes: script.scenes, voice, clock, voiceSeconds, tempo });
  writeFileSync(path.join(dir, "timeline.json"), `${JSON.stringify(timeline, null, 2)}\n`);

  const { browser, page } = await openStage(kit, scene, timeline);
  try {
    if (flags.stills) {
      const at = String(flags.stills)
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v));
      const files = [];
      for (const t of at) {
        await page.evaluate((x) => window.drawFrame(x), t);
        const file = path.join(dir, `still-${String(t).replace(".", "_")}.png`);
        await page.screenshot({ path: file });
        files.push(file);
      }
      return { id: script.id, stills: files, timeline };
    }
    const silent = path.join(dir, "silent.mp4");
    const frames = await shootVideo(page, timeline, silent);
    const out =
      flags.out || path.join("out", "explainers", `${script.id}${flags.draft ? "-draft" : ""}.mp4`);
    const music = flags["no-music"] || !script.music ? null : script.music;
    mux(silent, voiceWav, music, timeline.total, out);
    return {
      id: script.id,
      out,
      seconds: timeline.total,
      frames,
      wpm: flags.draft ? null : wordsPerMinute(voice.text, voiceSeconds / tempo),
      chars: voice.text.length,
      freshVoice: fresh,
      tookSeconds: Math.round((Date.now() - started) / 1000),
    };
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { folder, flags } = parseArgs(process.argv.slice(2));
  if (!folder) {
    console.error("Укажи папку ролика: node scripts/explainers/render.mjs content/explainers/<id>");
    process.exit(1);
  }
  renderExplainer(folder, flags)
    .then((r) => {
      if (r.stills) {
        console.log(`Кадры: ${r.stills.join(", ")}`);
        console.log(r.timeline.scenes.map((s) => `${s.id} ${s.start}–${s.end}`).join(" · "));
        return;
      }
      console.log(`Готово: ${r.out}`);
      console.log(
        `  ${r.seconds.toFixed(1)} с · ${r.frames} кадров · ${r.chars} знаков голоса` +
          (r.wpm ? ` · ${r.wpm} слов/мин` : " · черновик без голоса") +
          (r.freshVoice ? " · голос заказан заново" : r.wpm ? " · голос из кеша" : "") +
          ` · собран за ${r.tookSeconds} с`,
      );
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exit(1);
    });
}
