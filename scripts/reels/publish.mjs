#!/usr/bin/env node
// Положить готовый материал в очередь публикации: залить файл в хранилище
// Convex один раз и поставить по строке на каждую дверь. Дальше его сам
// заберёт крон. Двери: Instagram и Telegram (--to, по умолчанию обе).
// Тип материала: ролик (по умолчанию) или картинка (--type image).
// Ключи дверей скрипт не видит: токен Instagram живёт в таблице
// ops_instagram_state, токен Telegram — в переменных окружения Convex.
// Канон зоны — docs/publish.md.
//
// Использование:
//   node scripts/reels/publish.mjs path/to/reel.mp4 "подпись" [--to all] [--at "2026-09-21T09:00"] [--prod]
//   node scripts/reels/publish.mjs path/to/post.jpg "подпись" --type image --to telegram
//   node scripts/reels/publish.mjs --status        проверка связки без публикации

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Двери публикации. Одна очередь, по строке на дверь. */
export const CHANNELS = ["instagram", "telegram"];

const CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const FLAGS_WITH_VALUE = new Set(["--at", "--type", "--to"]);

/** В какие двери просят положить материал: instagram, telegram, обе или список. */
export function parseChannels(value) {
  const raw = String(value ?? "all")
    .toLowerCase()
    .trim();
  if (raw === "" || raw === "all") return [...CHANNELS];
  const asked = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const channel of asked) {
    if (!CHANNELS.includes(channel)) {
      throw new Error(`не понял дверь «${channel}»: бывает instagram, telegram или all`);
    }
  }
  if (asked.length === 0) throw new Error("после --to нужна дверь: instagram, telegram или all");
  return [...new Set(asked)];
}

/** Ролик или картинка. */
export function parseMediaType(value) {
  const raw = String(value ?? "reels")
    .toLowerCase()
    .trim();
  if (raw !== "reels" && raw !== "image") {
    throw new Error(`не понял тип «${raw}»: бывает reels или image`);
  }
  return raw === "image" ? "IMAGE" : "REELS";
}

/** Разбор всей командной строки: что кладём, куда и когда. */
export function parseArgs(argv) {
  const flagValue = (name) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const positional = argv.filter(
    (arg, i) => !arg.startsWith("--") && !FLAGS_WITH_VALUE.has(argv[i - 1]),
  );
  const [filePath, caption] = positional;
  const mediaType = parseMediaType(flagValue("--type"));
  const channels = parseChannels(flagValue("--to"));

  const at = flagValue("--at");
  let scheduledAt;
  if (at !== undefined) {
    const parsed = Date.parse(at);
    if (!Number.isFinite(parsed)) {
      throw new Error(`не понял дату «${at}»: нужен ISO-формат, например 2026-09-21T09:00+03:00`);
    }
    scheduledAt = parsed;
  }

  const ext = extname(filePath ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? (mediaType === "IMAGE" ? "image/jpeg" : "video/mp4");
  if (filePath) {
    if (mediaType === "IMAGE" && !contentType.startsWith("image/")) {
      throw new Error(`для --type image нужен .png или .jpg, а не ${ext}`);
    }
    if (mediaType === "REELS" && !contentType.startsWith("video/")) {
      throw new Error(`для ролика нужен .mp4, а не ${ext}`);
    }
  }

  return {
    filePath,
    caption: caption ?? "",
    mediaType,
    channels,
    scheduledAt,
    contentType,
    prod: argv.includes("--prod"),
    status: argv[0] === "--status",
  };
}

function runConvex(fn, args, prod) {
  const cmd = ["convex", "run", fn, JSON.stringify(args ?? {})];
  if (prod) cmd.push("--prod");
  const out = execFileSync("npx", cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const text = out.trim();
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}$/);
    if (m) {
      try {
        return JSON.parse(m[0].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
      } catch {
        // отдаём сырой текст ниже
      }
    }
    return text;
  }
}

async function main(argv) {
  let plan;
  try {
    plan = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (plan.status) {
    console.log(runConvex("workflows/instagram_publishing:status", {}, plan.prod));
    return;
  }

  if (!plan.filePath) {
    console.error(
      'usage: node scripts/reels/publish.mjs <файл> "подпись" [--to instagram|telegram|all] [--type image|reels] [--at <дата>] [--prod]',
    );
    process.exit(1);
  }

  console.log(`заливаю ${basename(plan.filePath)} в хранилище Convex...`);
  const uploadUrl = runConvex("workflows/instagram_publishing:generateUploadUrl", {}, plan.prod);
  if (typeof uploadUrl !== "string" || !uploadUrl.startsWith("http")) {
    console.error("generateUploadUrl вернул неожиданное:", uploadUrl);
    process.exit(1);
  }

  const bytes = readFileSync(plan.filePath);
  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: { "content-type": plan.contentType },
    body: bytes,
  });
  if (!uploadResp.ok) {
    console.error("заливка не прошла:", uploadResp.status, await uploadResp.text());
    process.exit(1);
  }
  const { storageId } = await uploadResp.json();

  // Файл один, строк столько, сколько дверей, и плановое время у них общее.
  const scheduledAt = plan.scheduledAt ?? Date.now();
  console.log(`файл на месте (${storageId}); ставлю в очередь: ${plan.channels.join(", ")}...`);

  let failed = 0;
  for (const channel of plan.channels) {
    try {
      const result = runConvex(
        "tables/data_cooked_instagram_reels:enqueueFromStorage",
        { storageId, caption: plan.caption, channel, mediaType: plan.mediaType, scheduledAt },
        plan.prod,
      );
      console.log(`${channel}: в очереди · ${JSON.stringify(result)}`);
    } catch (error) {
      failed += 1;
      console.error(`${channel}: не встало в очередь — ${error.message}`);
    }
  }

  const what = plan.mediaType === "IMAGE" ? "Картинка" : "Ролик";
  console.log(
    `${what} в очереди. Опубликует крон, когда дверь включена и настанет плановое время.`,
  );
  if (failed > 0) process.exit(1);
}

const invokedDirectly =
  typeof process.argv[1] === "string" &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) await main(process.argv.slice(2));
