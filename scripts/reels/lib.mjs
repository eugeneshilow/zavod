// Общая механика рельсы роликов: разбор серии, вёрстка слайда по лекалу,
// тайминг и фильтр склейки для ffmpeg. Канон зоны — docs/reels.md.

import { spawnSync } from "node:child_process";

export const FPS = 30;

// Сколько слайд держится на экране и сколько длится переход, в секундах.
export const SECONDS = { cover: 3.0, item: 3.4, outro: 3.0, xfade: 0.35 };

// Плакат: длина ролика и наезд от и до.
export const POSTER = { seconds: 8.0, zoomFrom: 1.0, zoomTo: 1.06 };

const round3 = (n) => Math.round(n * 1000) / 1000;

function need(value, what) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Серия: не хватает поля ${what}`);
  }
  return value;
}

/**
 * Разбирает серию в плоский список слайдов: обложка, пункты, финал.
 * Слайдов всегда items.length + 2.
 */
export function parseSeries(raw) {
  const id = need(raw?.id, "id");
  const kicker = need(raw?.kicker, "kicker");
  const items = raw?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Серия: items должен быть непустым списком");
  }
  const colors = {
    bg: need(raw?.colors?.bg, "colors.bg"),
    ink: need(raw?.colors?.ink, "colors.ink"),
    accent: need(raw?.colors?.accent, "colors.accent"),
  };
  const total = items.length;
  const slides = [
    {
      kind: "cover",
      title: need(raw?.cover?.title, "cover.title"),
      sub: need(raw?.cover?.sub, "cover.sub"),
      dots: { total, on: -1 },
    },
    ...items.map((item, i) => ({
      kind: "item",
      n: need(item?.n, `items[${i}].n`),
      title: need(item?.title, `items[${i}].title`),
      text: need(item?.text, `items[${i}].text`),
      dots: { total, on: i },
    })),
    {
      kind: "outro",
      title: need(raw?.outro?.title, "outro.title"),
      sub: need(raw?.outro?.sub, "outro.sub"),
      dots: { total, on: total },
    },
  ];
  return { id, kicker, colors, slides };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Берёт из лекала всё до образца слайда (доктайп, мета, style) и дописывает
 * свой слайд теми же классами. Дизайн живёт в лекале, здесь только данные.
 */
export function templateHead(template) {
  const at = template.indexOf('<div class="slide"');
  if (at < 0) throw new Error('Лекало: не найден блок <div class="slide"');
  return template.slice(0, at);
}

function dotsHtml(dots) {
  const cells = [];
  for (let i = 0; i < dots.total; i += 1) {
    cells.push(i <= dots.on ? '<i class="on"></i>' : "<i></i>");
  }
  return `<div class="dots">${cells.join("")}</div>`;
}

export function renderSlideHtml(template, slide, series) {
  const { bg, ink, accent } = series.colors;
  const style = `--bg:${bg};--ink:${ink};--accent:${accent}`;
  const kicker = `<div class="kicker">${escapeHtml(series.kicker)}</div>`;
  let body;
  if (slide.kind === "cover") {
    body = `${kicker}<h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.sub)}</p>`;
  } else if (slide.kind === "outro") {
    body = `<h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.sub)}</p>`;
  } else {
    body =
      `${kicker}<div class="num">${escapeHtml(slide.n)}</div>` +
      `<h1>${escapeHtml(slide.title)}</h1><p>${escapeHtml(slide.text)}</p>`;
  }
  const cls = slide.kind === "cover" ? "slide cover" : "slide";
  return (
    `${templateHead(template)}<div class="${cls}" style="${style}">\n` +
    `  <div class="safe">${body}</div>\n` +
    `  <div class="foot"><span>vibecoding.tech</span>${dotsHtml(slide.dots)}</div>\n` +
    `</div>\n`
  );
}

export function slideSeconds(slide) {
  return SECONDS[slide.kind] ?? SECONDS.item;
}

/**
 * Длительности слайдов, смещения кроссфейдов и общая длина ролика.
 * Кроссфейд съедает по SECONDS.xfade на каждом стыке:
 *   total = cover + N*item + outro - (N+1)*xfade
 */
export function timeline(slides, xfade = SECONDS.xfade) {
  const durations = slides.map(slideSeconds);
  const offsets = [];
  let acc = durations[0] ?? 0;
  for (let i = 1; i < durations.length; i += 1) {
    offsets.push(round3(acc - xfade));
    acc = acc + durations[i] - xfade;
  }
  return { durations, offsets, total: round3(acc) };
}

/** Цепочка xfade для ffmpeg: каждый следующий слайд въезжает в накопленное видео. */
export function buildXfadeFilter(slides, xfade = SECONDS.xfade) {
  const { durations, offsets, total } = timeline(slides, xfade);
  const parts = durations.map((_, i) => `[${i}:v]fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
  let last = "[v0]";
  for (let i = 1; i < durations.length; i += 1) {
    const out = i === durations.length - 1 ? "[vout]" : `[x${i}]`;
    parts.push(
      `${last}[v${i}]xfade=transition=fade:duration=${xfade}:offset=${offsets[i - 1]}${out}`,
    );
    last = out;
  }
  if (durations.length === 1) {
    parts[0] = `[0:v]fps=${FPS},format=yuv420p,setsar=1[vout]`;
  }
  return { filter: parts.join(";"), durations, offsets, total };
}

/** Дорожка звука: трек с затуханием в конце либо тишина той же длины. */
export function audioFilter(total, hasMusic, inputIndex = 1, fadeSeconds = 1.5) {
  const fadeAt = round3(Math.max(0, total - fadeSeconds));
  const head = `[${inputIndex}:a]aresample=48000`;
  // Времена звука не переписываются счётчиком сэмплов (`asetpts=N/SR/TB`):
  // он ломает дорожку, когда видео приходит склейкой. Канон — docs/reels.md.
  if (!hasMusic) return `${head},atrim=0:${total}[aout]`;
  return `${head},apad,atrim=0:${total},afade=t=out:st=${fadeAt}:d=${fadeSeconds}[aout]`;
}

/** Аргументы входа звука: сам трек либо генератор тишины нужной длины. */
export function audioInputArgs(total, musicPath) {
  if (musicPath) return ["-i", musicPath];
  return [
    "-f",
    "lavfi",
    "-t",
    String(total),
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=48000",
  ];
}

/** Хвост кодирования, одинаковый для серии и плаката. */
export function encodeArgs(total) {
  return [
    "-map",
    "[vout]",
    "-map",
    "[aout]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-t",
    String(total),
  ];
}

export function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (r.error) throw new Error(`${cmd} не запустился: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(
      `${cmd} упал (код ${r.status}):\n${(r.stderr || "").split("\n").slice(-20).join("\n")}`,
    );
  }
  return r.stdout;
}

/** Короткий паспорт готового файла: размер кадра, длительность, есть ли звук. */
export function probe(file) {
  const out = run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_entries",
    "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate",
    file,
  ]);
  const data = JSON.parse(out);
  const video = data.streams.find((s) => s.codec_type === "video");
  const audio = data.streams.find((s) => s.codec_type === "audio");
  return {
    width: video?.width,
    height: video?.height,
    fps: video?.r_frame_rate,
    duration: Number(data.format.duration),
    sizeMb: Math.round((Number(data.format.size) / 1048576) * 10) / 10,
    audio: audio ? audio.codec_name : null,
  };
}

/** Разбор флагов вида --music path --out path. */
export function parseFlags(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      flags[a.slice(2)] = argv[i + 1];
      i += 1;
    } else {
      rest.push(a);
    }
  }
  return { flags, rest };
}
