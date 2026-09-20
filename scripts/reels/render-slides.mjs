#!/usr/bin/env node
// Серия слайдов -> вертикальный ролик.
// node scripts/reels/render-slides.mjs <series.json> [--music path.mp3] [--out out/reels/<id>.mp4]
// Канон зоны — docs/reels.md.

import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  audioFilter,
  audioInputArgs,
  buildXfadeFilter,
  encodeArgs,
  parseFlags,
  parseSeries,
  probe,
  renderSlideHtml,
  run,
} from "./lib.mjs";

const TEMPLATE = "content/reels/template.html";

/** Снимает каждый слайд в PNG 1080x1920 и отдаёт пути кадров по порядку. */
export async function shootFrames(series, template, framesDir) {
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  const frames = [];
  try {
    for (const [i, slide] of series.slides.entries()) {
      const file = path.join(framesDir, `${String(i).padStart(3, "0")}.png`);
      await page.setContent(renderSlideHtml(template, slide, series), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: file, type: "png" });
      frames.push(file);
    }
  } finally {
    await browser.close();
  }
  return frames;
}

export async function renderSeries(seriesPath, { music, out } = {}) {
  const template = readFileSync(TEMPLATE, "utf8");
  const series = parseSeries(JSON.parse(readFileSync(seriesPath, "utf8")));
  const target = out || path.join("out", "reels", `${series.id}.mp4`);
  const framesDir = path.join("out", "reels", series.id, "frames");

  const frames = await shootFrames(series, template, framesDir);
  const { filter, durations, total } = buildXfadeFilter(series.slides);

  const inputs = [];
  for (const [i, frame] of frames.entries()) {
    inputs.push("-loop", "1", "-framerate", "30", "-t", String(durations[i]), "-i", frame);
  }
  inputs.push(...audioInputArgs(total, music));

  mkdirSync(path.dirname(target), { recursive: true });
  run("ffmpeg", [
    "-y",
    ...inputs,
    "-filter_complex",
    `${filter};${audioFilter(total, Boolean(music), frames.length)}`,
    ...encodeArgs(total),
    target,
  ]);

  const info = probe(target);
  return {
    id: series.id,
    out: target,
    slides: frames.length,
    expected: total,
    music: music || null,
    info,
  };
}

export function report(r) {
  const audio = r.music ? `music ${path.basename(r.music)}` : "silent (черновик: музыки нет)";
  return (
    `${r.id}: ${r.out}\n` +
    `  слайдов ${r.slides} · ожидали ${r.expected} с · вышло ${r.info.duration.toFixed(2)} с\n` +
    `  ${r.info.width}x${r.info.height} · ${r.info.fps} fps · ${r.info.sizeMb} МБ · audio: ${r.info.audio || "нет"} · ${audio}`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { flags, rest } = parseFlags(process.argv.slice(2));
  if (rest.length === 0) {
    console.error("Нужен путь к серии: node scripts/reels/render-slides.mjs <series.json>");
    process.exit(1);
  }
  const r = await renderSeries(rest[0], { music: flags.music, out: flags.out });
  console.log(report(r));
}
