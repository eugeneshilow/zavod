#!/usr/bin/env node
// Положить готовый материал в очередь публикации: залить файл в хранилище
// Convex и поставить строку в очередь. Дальше его сам заберёт крон.
// Тип материала: ролик (по умолчанию) или картинка (--type image).
// Токен Instagram живёт в таблице ops_instagram_state, скрипт его не видит.
// Канон зоны — docs/publish.md.
//
// Использование:
//   node scripts/reels/publish.mjs path/to/reel.mp4 "подпись" [--at "2026-09-21T09:00"] [--prod]
//   node scripts/reels/publish.mjs path/to/post.jpg "подпись" --type image
//   node scripts/reels/publish.mjs --status        проверка связки без публикации

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

const argv = process.argv.slice(2);
const prod = argv.includes("--prod");

function runConvex(fn, args) {
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

if (argv[0] === "--status") {
  console.log(runConvex("workflows/instagram_publishing:status", {}));
  process.exit(0);
}

const FLAGS_WITH_VALUE = new Set(["--at", "--type"]);
const positional = argv.filter((a, i) => !a.startsWith("--") && !FLAGS_WITH_VALUE.has(argv[i - 1]));
const [filePath, caption] = positional;
if (!filePath) {
  console.error(
    'usage: node scripts/reels/publish.mjs <файл> "подпись" [--type image|reels] [--at <дата>] [--prod]',
  );
  process.exit(1);
}

const typeIndex = argv.indexOf("--type");
const typeArg = typeIndex >= 0 ? String(argv[typeIndex + 1] ?? "").toLowerCase() : "reels";
if (typeArg !== "reels" && typeArg !== "image") {
  console.error(`не понял тип «${typeArg}»: бывает reels или image`);
  process.exit(1);
}
const mediaType = typeArg === "image" ? "IMAGE" : "REELS";

const CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};
const ext = extname(filePath).toLowerCase();
const contentType = CONTENT_TYPES[ext] ?? (mediaType === "IMAGE" ? "image/jpeg" : "video/mp4");
if (mediaType === "IMAGE" && !contentType.startsWith("image/")) {
  console.error(`для --type image нужен .png или .jpg, а не ${ext}`);
  process.exit(1);
}
if (mediaType === "REELS" && !contentType.startsWith("video/")) {
  console.error(`для ролика нужен .mp4, а не ${ext}`);
  process.exit(1);
}

const atIndex = argv.indexOf("--at");
let scheduledAt;
if (atIndex >= 0) {
  const raw = argv[atIndex + 1];
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    console.error(`не понял дату «${raw}»: нужен ISO-формат, например 2026-09-21T09:00+03:00`);
    process.exit(1);
  }
  scheduledAt = parsed;
}

console.log(`заливаю ${basename(filePath)} в хранилище Convex...`);
const uploadUrl = runConvex("workflows/instagram_publishing:generateUploadUrl", {});
if (typeof uploadUrl !== "string" || !uploadUrl.startsWith("http")) {
  console.error("generateUploadUrl вернул неожиданное:", uploadUrl);
  process.exit(1);
}

const bytes = readFileSync(filePath);
const uploadResp = await fetch(uploadUrl, {
  method: "POST",
  headers: { "content-type": contentType },
  body: bytes,
});
if (!uploadResp.ok) {
  console.error("заливка не прошла:", uploadResp.status, await uploadResp.text());
  process.exit(1);
}
const { storageId } = await uploadResp.json();
console.log(`файл на месте (${storageId}); ставлю в очередь...`);

const result = runConvex("tables/data_cooked_instagram_reels:enqueueFromStorage", {
  storageId,
  caption: caption ?? "",
  mediaType,
  scheduledAt,
});
console.log(result);
console.log(
  `${mediaType === "IMAGE" ? "Картинка" : "Ролик"} в очереди. Опубликует крон, когда канал включён и настанет плановое время.`,
);
