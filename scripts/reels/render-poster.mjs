#!/usr/bin/env node
// Одна картинка 1024x1536 -> вертикальный ролик с медленным наездом.
// node scripts/reels/render-poster.mjs <image.png> --line "текст" [--music path.mp3] [--out path.mp4]
// Канон зоны — docs/reels.md.

import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  FPS,
  POSTER,
  audioFilter,
  audioInputArgs,
  encodeArgs,
  escapeHtml,
  parseFlags,
  probe,
  run,
} from "./lib.mjs";

/** Кадр плаката: размытый затемнённый фон, картинка по ширине, одна строка снизу. */
export function posterHtml(dataUri, line) {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:Inter,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .frame{position:relative;width:1080px;height:1920px;background:#000;overflow:hidden}
  .bg{position:absolute;inset:-80px;background-image:url("${dataUri}");background-size:cover;background-position:center;filter:blur(48px) brightness(.75)}
  .art{position:absolute;left:0;top:150px;width:1080px;display:block}
  .line{position:absolute;left:96px;right:96px;bottom:220px;color:#fff;font-size:64px;line-height:1.16;font-weight:600;letter-spacing:-.01em;text-shadow:0 2px 16px rgba(0,0,0,.55)}
</style>
<div class="frame">
  <div class="bg"></div>
  <img class="art" src="${dataUri}" alt="">
  <div class="line">${escapeHtml(line)}</div>
</div>
`;
}

export async function shootPoster(imagePath, line, framePath) {
  const bytes = readFileSync(imagePath);
  const mime = path.extname(imagePath).toLowerCase() === ".jpg" ? "image/jpeg" : "image/png";
  const dataUri = `data:${mime};base64,${bytes.toString("base64")}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  try {
    await page.setContent(posterHtml(dataUri, line), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: framePath, type: "png" });
  } finally {
    await browser.close();
  }
  return framePath;
}

/** Наезд zoomFrom -> zoomTo за всю длину ролика; увеличенный исходник убирает дрожь. */
export function zoomFilter(seconds = POSTER.seconds) {
  const frames = Math.round(seconds * FPS);
  const step = (POSTER.zoomTo - POSTER.zoomFrom) / (frames - 1);
  return (
    `[0:v]scale=2160:3840:flags=lanczos,` +
    `zoompan=z='min(${POSTER.zoomFrom}+${step.toFixed(8)}*on,${POSTER.zoomTo})':d=1:` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},` +
    `format=yuv420p,setsar=1[vout]`
  );
}

export async function renderPoster(imagePath, { line, music, out, id } = {}) {
  if (!line) throw new Error("Плакату нужна строка: --line «текст»");
  const name = id || path.basename(imagePath).replace(/\.[^.]+$/, "");
  const target = out || path.join("out", "reels", `${name}.mp4`);
  const framesDir = path.join("out", "reels", name, "frames");
  mkdirSync(framesDir, { recursive: true });
  mkdirSync(path.dirname(target), { recursive: true });

  const frame = await shootPoster(imagePath, line, path.join(framesDir, "000.png"));
  const total = POSTER.seconds;

  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(FPS),
    "-t",
    String(total),
    "-i",
    frame,
    ...audioInputArgs(total, music),
    "-filter_complex",
    `${zoomFilter(total)};${audioFilter(total, Boolean(music), 1)}`,
    ...encodeArgs(total),
    target,
  ]);

  return { id: name, out: target, expected: total, music: music || null, info: probe(target) };
}

export function report(r) {
  const audio = r.music ? `music ${path.basename(r.music)}` : "silent (черновик: музыки нет)";
  return (
    `${r.id}: ${r.out}\n` +
    `  плакат · ожидали ${r.expected} с · вышло ${r.info.duration.toFixed(2)} с\n` +
    `  ${r.info.width}x${r.info.height} · ${r.info.fps} fps · ${r.info.sizeMb} МБ · audio: ${r.info.audio || "нет"} · ${audio}`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { flags, rest } = parseFlags(process.argv.slice(2));
  if (rest.length === 0) {
    console.error(
      'Нужна картинка: node scripts/reels/render-poster.mjs <image.png> --line "текст"',
    );
    process.exit(1);
  }
  const r = await renderPoster(rest[0], { line: flags.line, music: flags.music, out: flags.out });
  console.log(report(r));
}
