#!/usr/bin/env node
// Гоняет всю рельсу: каждая серия из content/reels/series и каждый плакат
// из content/reels/posters. Выход — out/reels/<id>.mp4. Канон — docs/reels.md.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseFlags } from "./lib.mjs";
import { renderSeries, report as seriesReport } from "./render-slides.mjs";
import { renderPoster, report as posterReport } from "./render-poster.mjs";

const SERIES_DIR = "content/reels/series";
const POSTERS_DIR = "content/reels/posters";

function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join(dir, f));
}

const { flags } = parseFlags(process.argv.slice(2));
const music = flags.music;
const done = [];
const failed = [];

for (const file of jsonFiles(SERIES_DIR)) {
  try {
    const r = await renderSeries(file, { music });
    console.log(seriesReport(r));
    done.push(r.out);
  } catch (e) {
    console.error(`серия ${file}: ${e.message}`);
    failed.push(file);
  }
}

for (const file of jsonFiles(POSTERS_DIR)) {
  try {
    const poster = JSON.parse(readFileSync(file, "utf8"));
    const r = await renderPoster(poster.image, { line: poster.line, id: poster.id, music });
    console.log(posterReport(r));
    done.push(r.out);
  } catch (e) {
    console.error(`плакат ${file}: ${e.message}`);
    failed.push(file);
  }
}

console.log(
  `\nготово ${done.length}, упало ${failed.length}${music ? "" : " · музыки нет: ролики черновые"}`,
);
process.exit(failed.length === 0 ? 0 : 1);
