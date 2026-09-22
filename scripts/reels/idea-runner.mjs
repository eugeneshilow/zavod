#!/usr/bin/env node
// Раннер идей: идея из админки -> ролик в очереди публикации.
// Раз в десять минут (launchd на маке Pro) берёт самую старую идею, отправленную
// владельцем в работу кнопкой, пишет по ней историю безголовым Claude по рецепту
// мозга `short-videos`, рендерит ролик, ставит его в очередь публикации и
// отмечает идею готовой. Первая версия делает кадры только двух видов —
// карточка и карточка поста: чужие видео и картинки требуют строки в
// LICENSES.md и ручной выкачки, автоматом их не берём.
//
// Перед каждой фазой раннер перечитывает строку идеи: владелец нажал
// «Остановить» — работа прекращается, строка уже помечена «остановлено руками».
// Фазы (история, сборка, публикация), токены и цена пишутся в ту же строку:
// экран показывает их плашкой и колонкой «модели и цена».
//
// Запуск из корня репо:
//   node scripts/reels/idea-runner.mjs                             рабочий тик
//   node scripts/reels/idea-runner.mjs --dry-run "<текст идеи>"    без базы и эфира
//   node scripts/reels/idea-runner.mjs --dry-run --no-render "<текст идеи>"
//
// Лог: раннер пишет в stdout, файл держит launchd
// (~/Library/Logs/zavod-idea-runner.log, время московское). Ручной запуск без
// launchd: IDEA_RUNNER_LOG_FILE=<путь> — тогда строки уедут ещё и туда.
// Канон зоны — docs/reels.md, «Раннер идей»; идеи — docs/social/instagram.md.

import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { probe } from "./lib.mjs";
import { envValue } from "./render-story.mjs";
import { parseStory, splitWords } from "./story.mjs";

/** Края раннера: пути, тайминги и рамки истории. Числа — в одном месте. */
export const RUNNER = {
  outDir: "out/ideas",
  storiesDir: "content/reels/stories",
  lockFile: "out/ideas/.lock",
  recipe: "docs/brains/short-videos/recipe.md",
  sample: "content/reels/stories/robot-knife.json",
  // Файл лога — только для ручного запуска: под launchd stdout уже льётся в
  // ~/Library/Logs/zavod-idea-runner.log, и вторая запись дублировала строки.
  logFile: process.env.IDEA_RUNNER_LOG_FILE || "",
  // Идея, застрявшая в работе дольше этого, возвращается как «не вышло».
  staleMs: 2 * 60 * 60 * 1000,
  claudeTimeoutMs: 10 * 60 * 1000,
  renderTimeoutMs: 15 * 60 * 1000,
  publishTimeoutMs: 15 * 60 * 1000,
  // Рамки принятой истории: слова считаются по очищенному тексту битов.
  words: { min: 90, max: 120 },
  beats: { min: 8, max: 20 },
  captionMax: 300,
  worker: "pro",
  profile: process.env.IDEA_RUNNER_PROFILE || "jvshilov",
  model: "claude-fable-5-1",
  voice: "eleven:ogi2DyUAKJb7CEdqqvlU",
  voiceModel: "eleven_v3",
  // Цена озвучки: прайс API ElevenLabs за тысячу знаков v3 на плане Starter.
  // Уточняется по счёту — потому и вынесена сюда и в переменную окружения.
  elevenUsdPer1kChars: Number(process.env.ELEVEN_USD_PER_1K_CHARS || 0.3),
};

/** Кадры, которые раннер умеет брать сам: рисуем мы, лицензий не нужно. */
export const OWN_VISUALS = ["card", "tweet"];

// ---------------------------------------------------------------- лог и время

/** Время по Москве строкой «ГГГГ-ММ-ДД ЧЧ:ММ:СС»: часы Pro идут не по МСК. */
export function mskStamp(at = new Date()) {
  return at.toLocaleString("sv-SE", { timeZone: "Europe/Moscow" });
}

/**
 * Строка лога в stdout: под launchd он сам кладёт её в файл. Ручной запуск без
 * launchd может попросить файл переменной IDEA_RUNNER_LOG_FILE.
 */
export function log(line) {
  const text = `${mskStamp()} ${line}`;
  console.log(text);
  if (!RUNNER.logFile) return;
  try {
    mkdirSync(path.dirname(RUNNER.logFile), { recursive: true });
    appendFileSync(RUNNER.logFile, `${text}\n`);
  } catch {
    // лог не пишется — это не повод ронять прогон
  }
}

// -------------------------------------------------------------------- замок

/** Жив ли процесс с таким номером. Чужой процесс — тоже жив (EPERM). */
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

/**
 * Замок от наложения тиков: в файле лежит номер процесса. Процесс жив —
 * предыдущий тик ещё работает, выходим молча; мёртв — замок перезаписываем.
 */
export function takeLock(file = RUNNER.lockFile) {
  mkdirSync(path.dirname(file), { recursive: true });
  if (existsSync(file)) {
    const pid = Number(readFileSync(file, "utf8").trim());
    if (Number.isInteger(pid) && pid > 0 && pid !== process.pid && pidAlive(pid)) return false;
  }
  writeFileSync(file, `${process.pid}\n`);
  return true;
}

// -------------------------------------------------------------------- Convex

/**
 * Значение переменной окружения Convex в память процесса. Наружу не печатается
 * ни в лог, ни в ошибку: так же берёт свой ключ склад курса.
 */
function convexEnvGet(name, { prod = true } = {}) {
  const args = ["convex", "env", "get", name];
  if (prod) args.push("--prod");
  return execFileSync("npx", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

/**
 * Адрес деплоя, в который ходит раннер. По умолчанию прод: идеи кладёт
 * прод-админка, и туда же публикует `publish.mjs --prod`. Адрес прода спрашиваем
 * у самого Convex (`CONVEX_CLOUD_URL` — его системная переменная), чтобы не
 * держать вторую копию адреса в файлах. `--dev` берёт адрес из `.env.local`.
 */
export function convexUrl({ prod = true } = {}) {
  if (!prod) {
    const url = envValue("NEXT_PUBLIC_CONVEX_URL");
    if (!url) throw new Error("нет NEXT_PUBLIC_CONVEX_URL в .env.local");
    return url;
  }
  const url = convexEnvGet("CONVEX_CLOUD_URL");
  if (!url.startsWith("http")) throw new Error("Convex не назвал адрес прод-деплоя");
  return url;
}

/** Пропуск админских функций идей. Значение живёт только в памяти процесса. */
function adminToken({ prod = true } = {}) {
  const token = convexEnvGet("ADMIN_API_TOKEN", { prod });
  if (!token) throw new Error("ADMIN_API_TOKEN пуст в окружении Convex");
  return token;
}

const ideas = anyApi.tables.ops_reel_ideas;

// ------------------------------------------------------------------- промпт

/** Текст идеи внутрь промпта: границы видны глазом, ограждения не ломаются. */
function fence(text) {
  return `<<<ИДЕЯ\n${String(text).trim()}\nИДЕЯ>>>`;
}

/**
 * Задание мозгу `short-videos`: что прочитать, что написать и чего не брать.
 * Вторая попытка получает причину отказа первой — она дописывается в конец.
 */
export function buildPrompt(idea, { retryReason = "" } = {}) {
  const { words, beats, captionMax, recipe, sample, voice } = RUNNER;
  const lines = [
    "Ты — мозг short-videos завода: писатель коротких вертикальных роликов.",
    "",
    "Сначала прочитай маршрут и только потом пиши:",
    `1. ${recipe} целиком и файлы его таблицы в порядке строк — только те секции, которые названы в таблице.`,
    `2. Образец готовой истории ${sample}.`,
    "3. Раздел «История» в docs/reels.md.",
    "",
    "Идея владельца:",
    fence(idea),
    "",
    "Если в идее есть ссылка — открой её инструментом WebFetch и бери факты только оттуда.",
    "Ссылки нет — пиши по тексту идеи и ничего не выдумывай сверх него.",
    "",
    "Напиши одну историю и выведи её одним JSON-объектом.",
    "",
    "Правила текста:",
    `- 105–110 слов суммарно в полях text (принимается ${words.min}–${words.max}), ролик до 60 секунд;`,
    `- ${beats.min}–${beats.max} битов, ориентир 12–16;`,
    "- первая фраза — герой и ситуация; поворот в середине; финал без призыва;",
    "- одна мысль — одна фраза, 5–9 слов;",
    "- say — текст для голоса: числа и латиница словами, не больше одного тега ElevenLabs на бит.",
    "",
    "Правила кадра:",
    `- visual бывает ТОЛЬКО двух видов: {"kind":"card","big":"…","small":"…"} или`,
    '  {"kind":"tweet","name":"…","handle":"…","text":"…","meta":"…"};',
    '- кадры "image" и "video" запрещены: чужие видео и картинки требуют лицензии',
    "  и ручной выкачки, раннер их не берёт.",
    "",
    "Поля файла — как в образце:",
    "- id — латинский слаг из 2–4 слов через дефис;",
    "- title — заголовок 2–5 слов;",
    `- voice: "${voice}", speed: 1.0, flow: "continuous", stability: 0.25;`,
    "- colors — как в образце; music: null;",
    "- sources — ссылки из идеи списком;",
    `- caption — подпись поста по-русски до ${captionMax} знаков, без ссылок,`,
    "  до трёх хэштегов в самом конце.",
    "",
    "Выведи ТОЛЬКО JSON: без пояснений, без ограждений, без текста до и после.",
  ];
  if (retryReason) {
    lines.push("", `Прошлый ответ отклонён: ${retryReason}. Исправь это и выведи JSON заново.`);
  }
  return lines.join("\n");
}

/** JSON из ответа модели: от первой фигурной скобки до последней. */
export function extractJson(text) {
  const raw = String(text ?? "");
  const from = raw.indexOf("{");
  const to = raw.lastIndexOf("}");
  if (from < 0 || to <= from) throw new Error("в ответе модели нет JSON");
  return JSON.parse(raw.slice(from, to + 1));
}

/**
 * Приёмка истории до рендера: разбор теми же правилами, что у рендера, кадры
 * только свои, длина текста и подпись поста. Возвращает список претензий:
 * пустой — история принята.
 */
export function validateStory(raw) {
  const problems = [];
  let story = null;
  try {
    story = parseStory(raw);
  } catch (error) {
    problems.push(error.message);
  }
  let words = 0;
  let beats = 0;
  if (story) {
    beats = story.beats.length;
    words = story.beats.reduce((sum, beat) => sum + splitWords(beat.text).length, 0);
    const alien = [...new Set(story.beats.map((b) => b.visual.kind))].filter(
      (kind) => !OWN_VISUALS.includes(kind),
    );
    if (alien.length > 0) {
      problems.push(`кадры бывают только card и tweet, а в истории есть ${alien.join(", ")}`);
    }
    if (words < RUNNER.words.min || words > RUNNER.words.max) {
      problems.push(`слов в тексте ${words}, а нужно ${RUNNER.words.min}–${RUNNER.words.max}`);
    }
    if (beats < RUNNER.beats.min || beats > RUNNER.beats.max) {
      problems.push(`битов ${beats}, а нужно ${RUNNER.beats.min}–${RUNNER.beats.max}`);
    }
  }
  const caption = typeof raw?.caption === "string" ? raw.caption.trim() : "";
  if (caption === "") problems.push("нет подписи поста: поле caption");
  else if (caption.length > RUNNER.captionMax) {
    problems.push(`подпись ${caption.length} знаков, а берём до ${RUNNER.captionMax}`);
  }
  return { ok: problems.length === 0, problems, words, beats, caption, id: story?.id ?? null };
}

/** Имя истории, которое ещё не занято: занято — суффикс -2, -3 и так далее. */
export function uniqueStoryId(id, taken) {
  if (!taken(id)) return id;
  for (let n = 2; n <= 99; n += 1) {
    const next = `${id}-${n}`;
    if (!taken(next)) return next;
  }
  throw new Error(`имя истории ${id} занято вместе со всеми суффиксами`);
}

/** Имя занято, если такой файл уже лежит в out/ideas или в историях репо. */
function idTaken(id) {
  return (
    existsSync(path.join(RUNNER.outDir, `${id}.json`)) ||
    existsSync(path.join(RUNNER.outDir, `${id}.mp4`)) ||
    existsSync(path.join(RUNNER.storiesDir, `${id}.json`))
  );
}

// ------------------------------------------------------------ безголовый Claude

/**
 * Команда подписочного Claude: профиль отдельным CLAUDE_CONFIG_DIR, ключи API
 * из окружения выкушены (подписка — единственный канал флота), долгоживущий
 * токен профиля старше обычного входа, MCP-серверов ноль.
 */
export function claudeCmd(args, { profile = RUNNER.profile } = {}) {
  const base = "env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN";
  const profileEnv = `CLAUDE_CONFIG_DIR="$HOME/.claude-${profile}"`;
  return (
    `CB="$(command -v claude || echo "$HOME/.local/bin/claude")"; ` +
    `CT="$HOME/.claude-${profile}-token"; ` +
    `if [ -s "$CT" ]; then ${base} CLAUDE_CODE_OAUTH_TOKEN="$(cat "$CT")" ${profileEnv} "$CB" --strict-mcp-config ${args}; ` +
    `else ${base} -u CLAUDE_CODE_OAUTH_TOKEN ${profileEnv} "$CB" --strict-mcp-config ${args}; fi`
  );
}

/**
 * Что заход к модели стоил: токены и цена из конверта `--output-format json`.
 * Кеш считается входом — это те же прочитанные токены, за них выставлен счёт.
 * Конверта нет (старый формат, обрезанный вывод) — null, и строка цены пустая.
 */
export function usageFromClaudeJson(stdout) {
  let envelope;
  try {
    envelope = JSON.parse(String(stdout ?? "").trim());
  } catch {
    return null;
  }
  const usage = envelope && typeof envelope === "object" ? envelope.usage : null;
  if (!usage || typeof usage !== "object") return null;
  const n = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  return {
    inputTokens:
      n(usage.input_tokens) +
      n(usage.cache_creation_input_tokens) +
      n(usage.cache_read_input_tokens),
    outputTokens: n(usage.output_tokens),
    costUsd: n(envelope.total_cost_usd),
  };
}

/** Знаки озвучки: ElevenLabs считает кредиты по тексту, который читает голос. */
export function voiceChars(raw) {
  const beats = Array.isArray(raw?.beats) ? raw.beats : [];
  return beats.reduce((sum, beat) => sum + String(beat?.say ?? beat?.text ?? "").length, 0);
}

/** Цена озвучки по прайсу за тысячу знаков, до сотых цента. */
export function voiceCost(chars, perThousand = RUNNER.elevenUsdPer1kChars) {
  return Math.round(((chars / 1000) * perThousand + Number.EPSILON) * 10000) / 10000;
}

/** Строки очереди, которые родил вывод publish.mjs: по одной на дверь. */
export function parseQueueIds(output) {
  const ids = [];
  for (const line of String(output ?? "").split("\n")) {
    const match = line.match(/в очереди · (\{.*\})\s*$/);
    if (!match) continue;
    try {
      const row = JSON.parse(match[1]);
      if (row && typeof row.id === "string") ids.push(row.id);
    } catch {
      // строка не разобралась — id этой двери просто не запомнится
    }
  }
  return ids;
}

/** Файл ролика в хранилище Convex — из строки «файл на месте (…)». */
export function parseStorageId(output) {
  const match = String(output ?? "").match(/файл на месте \(([^)\s]+)\)/);
  return match ? match[1] : null;
}

/** Ответ из конверта `--output-format json`: поле result. */
export function claudeResult(stdout) {
  const text = String(stdout ?? "").trim();
  try {
    const envelope = JSON.parse(text);
    if (envelope && typeof envelope.result === "string") return envelope.result;
  } catch {
    // не конверт — отдаём как есть, JSON вынет extractJson
  }
  return text;
}

/** Один заход к модели: промпт через stdin, ответ строкой и счёт за заход. */
function askClaude(prompt) {
  const args =
    `-p --model ${RUNNER.model} ` + `--allowedTools "Read,Glob,Grep,WebFetch" --output-format json`;
  const r = spawnSync("zsh", ["-lc", claudeCmd(args)], {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: RUNNER.claudeTimeoutMs,
  });
  if (r.error) {
    throw new Error(`безголовый Claude не запустился: ${r.error.code ?? r.error.message}`);
  }
  if (r.status !== 0) {
    const detail =
      (r.stderr || "").trim() || (r.stdout || "").trim().slice(-400) || `signal=${r.signal}`;
    throw new Error(`безголовый Claude упал: ${detail.slice(0, 400)}`);
  }
  return { text: claudeResult(r.stdout), usage: usageFromClaudeJson(r.stdout) };
}

/**
 * История по идее: одна попытка, и ещё одна с причиной отказа. Счёт за обе
 * попытки складывается: отклонённый ответ тоже стоил денег.
 */
export function writeStory(ideaText) {
  const startedAt = Date.now();
  const writer = { model: RUNNER.model, inputTokens: 0, outputTokens: 0, costUsd: 0, ms: 0 };
  const bill = (usage) => {
    if (!usage) return;
    writer.inputTokens += usage.inputTokens;
    writer.outputTokens += usage.outputTokens;
    writer.costUsd = Math.round((writer.costUsd + usage.costUsd + Number.EPSILON) * 10000) / 10000;
  };
  let reason = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    log(`пишу историю, попытка ${attempt}...`);
    const answer = askClaude(buildPrompt(ideaText, { retryReason: attempt === 1 ? "" : reason }));
    bill(answer.usage);
    writer.ms = Date.now() - startedAt;
    let raw;
    try {
      raw = extractJson(answer.text);
    } catch (error) {
      reason = error.message;
      log(`ответ отклонён: ${reason}`);
      continue;
    }
    const check = validateStory(raw);
    if (check.ok) return { raw, check, writer };
    reason = check.problems.join("; ");
    log(`история отклонена: ${reason}`);
  }
  throw new Error(`история не прошла проверку: ${reason}`);
}

// ------------------------------------------------------- рендер и публикация

/** Тихий запуск соседнего скрипта репо; вывод уходит в лог строкой. */
function runNode(args, { timeoutMs, what }) {
  const r = spawnSync("node", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: timeoutMs,
  });
  if (r.error) throw new Error(`${what} не запустился: ${r.error.code ?? r.error.message}`);
  if (r.status !== 0) {
    const detail = (r.stderr || "").trim() || (r.stdout || "").trim();
    throw new Error(`${what} упал: ${detail.slice(-300)}`);
  }
  return r.stdout || "";
}

/** Ролик из файла истории. Кадры карточек медиа и лицензий не просят. */
export function renderStoryFile(storyPath, outPath) {
  const out = runNode(["scripts/reels/render-story.mjs", storyPath, "--out", outPath], {
    timeoutMs: RUNNER.renderTimeoutMs,
    what: "рендер",
  });
  for (const line of out.trim().split("\n")) log(`рендер: ${line}`);
  return probe(outPath);
}

/** Готовый ролик — в очередь публикации, обе двери, прод. */
export function publishFile(file, caption, { account } = {}) {
  const args = ["scripts/reels/publish.mjs", file, caption, "--to", "all", "--prod"];
  if (account && account !== "ruvibecoding") args.push("--account", account);
  const out = runNode(args, { timeoutMs: RUNNER.publishTimeoutMs, what: "публикация" });
  for (const line of out.trim().split("\n")) log(`публикация: ${line}`);
  return { queueIds: parseQueueIds(out), storageId: parseStorageId(out) };
}

// --------------------------------------------------------------------- тик

/** Владелец нажал «Остановить»: работать дальше незачем, строка уже помечена. */
class Stopped extends Error {}

/**
 * Перед каждой фазой строка перечитывается: статус не «в работе» — значит
 * идею остановили, переписали или убрали руками, и раннер уходит молча.
 */
async function ensureTaken(client, token, id) {
  const row = await client.query(ideas.get, { token, id });
  if (!row) throw new Stopped("строки идеи больше нет");
  if (row.status !== "taken") throw new Stopped(`идея больше не в работе (${row.status})`);
}

/** Рабочий тик: вернуть зависшие, взять идею, написать, собрать, поставить. */
async function tick() {
  const token = adminToken();
  const client = new ConvexHttpClient(convexUrl());

  const requeued = await client.mutation(ideas.requeueStale, {
    token,
    olderThanMs: RUNNER.staleMs,
  });
  if (requeued > 0) log(`вернул зависших идей: ${requeued}`);

  const idea = await client.mutation(ideas.takeNext, { token, worker: RUNNER.worker });
  if (!idea) {
    log("идей в работе нет");
    return;
  }
  log(`взял идею ${idea.id}: ${idea.text.slice(0, 120).replace(/\s+/g, " ")}`);
  const startedAt = Date.now();

  let storyJson = "";
  try {
    await ensureTaken(client, token, idea.id);
    await client.mutation(ideas.setPhase, { token, id: idea.id, phase: "story" });
    const { raw, check, writer } = writeStory(idea.text);
    const id = uniqueStoryId(String(raw.id), idTaken);
    raw.id = id;
    storyJson = `${JSON.stringify(raw, null, 2)}\n`;
    mkdirSync(RUNNER.outDir, { recursive: true });
    const storyPath = path.join(RUNNER.outDir, `${id}.json`);
    writeFileSync(storyPath, storyJson);
    log(`история ${id}: слов ${check.words}, битов ${check.beats}`);
    log(
      `письмо: ${writer.inputTokens} в токенов, ${writer.outputTokens} из, $${writer.costUsd.toFixed(4)}`,
    );
    await client.mutation(ideas.setWriter, {
      token,
      id: idea.id,
      storyTitle: typeof raw.title === "string" ? raw.title : id,
      storyWords: check.words,
      storyBeats: check.beats,
      writer,
      story: storyJson,
    });

    await ensureTaken(client, token, idea.id);
    await client.mutation(ideas.setPhase, { token, id: idea.id, phase: "render" });
    const videoPath = path.join(RUNNER.outDir, `${id}.mp4`);
    const info = renderStoryFile(storyPath, videoPath);
    const seconds = Math.round(info.duration);
    log(`ролик готов: ${videoPath} · ${seconds} с · ${info.sizeMb} МБ`);

    const chars = voiceChars(raw);
    const voice = { model: RUNNER.voiceModel, chars, costUsd: voiceCost(chars) };
    log(`озвучка: ${chars} знаков, $${voice.costUsd.toFixed(4)}`);

    await ensureTaken(client, token, idea.id);
    await client.mutation(ideas.setPhase, { token, id: idea.id, phase: "publish" });
    const queued = publishFile(videoPath, check.caption, { account: idea.account });

    const totalCostUsd =
      Math.round((writer.costUsd + voice.costUsd + Number.EPSILON) * 10000) / 10000;
    const elapsedMs = Date.now() - startedAt;
    await client.mutation(ideas.finish, {
      token,
      id: idea.id,
      storyId: id,
      story: storyJson,
      note: `pro · ${check.words} слов · ${seconds} секунд`,
      voice,
      videoSeconds: seconds,
      totalCostUsd,
      elapsedMs,
      queueIds: queued.queueIds,
      ...(queued.storageId ? { storageId: queued.storageId } : {}),
    });
    log(
      `идея ${idea.id} закрыта: ролик в очереди публикации · итого $${totalCostUsd.toFixed(2)} · ${Math.round(elapsedMs / 60000)} мин`,
    );
  } catch (error) {
    if (error instanceof Stopped) {
      log(`идея ${idea.id} остановлена руками: ${error.message}`);
      return;
    }
    const note = String(error.message || error).slice(0, 400);
    log(`идея ${idea.id} не вышла: ${note}`);
    await client.mutation(ideas.fail, {
      token,
      id: idea.id,
      note,
      ...(storyJson ? { story: storyJson } : {}),
    });
    process.exitCode = 1;
  }
}

/** Сухой прогон: базу не трогаем, в эфир не ставим. */
async function dryRun(text, { render }) {
  const started = Date.now();
  const mark = (what, from) => log(`${what}: ${((Date.now() - from) / 1000).toFixed(1)} с`);

  const t0 = Date.now();
  const { raw, check, writer } = writeStory(text);
  mark("история", t0);
  log(
    `письмо: ${RUNNER.model} · ${writer.inputTokens} в токенов, ${writer.outputTokens} из · $${writer.costUsd.toFixed(4)}`,
  );
  const chars = voiceChars(raw);
  const voiceUsd = voiceCost(chars);
  log(`озвучка: ${RUNNER.voiceModel} · ${chars} знаков · $${voiceUsd.toFixed(4)}`);
  log(`итого: $${(writer.costUsd + voiceUsd).toFixed(4)}`);

  const id = uniqueStoryId(`dry-${String(raw.id)}`, idTaken);
  raw.id = id;
  mkdirSync(RUNNER.outDir, { recursive: true });
  const storyPath = path.join(RUNNER.outDir, `${id}.json`);
  writeFileSync(storyPath, `${JSON.stringify(raw, null, 2)}\n`);
  log(`история ${storyPath}: слов ${check.words}, битов ${check.beats}`);
  log(`подпись (${check.caption.length} знаков): ${check.caption.replace(/\s+/g, " ")}`);

  if (!render) {
    log(`сухой прогон без рендера закончен за ${((Date.now() - started) / 1000).toFixed(1)} с`);
    return;
  }

  const t1 = Date.now();
  const videoPath = path.join(RUNNER.outDir, `${id}.mp4`);
  const info = renderStoryFile(storyPath, videoPath);
  mark("рендер", t1);
  log(`ролик ${videoPath} · ${info.duration.toFixed(1)} с · ${info.sizeMb} МБ`);
  log(`сухой прогон закончен за ${((Date.now() - started) / 1000).toFixed(1)} с`);
}

/** Разбор командной строки раннера. */
export function parseArgs(argv) {
  const dry = argv.includes("--dry-run");
  const render = !argv.includes("--no-render");
  const text = argv.filter((a) => !a.startsWith("--")).join(" ");
  return { dry, render, text };
}

async function main(argv) {
  if (!existsSync("scripts/reels/idea-runner.mjs")) {
    console.error(
      "Запускать из корня репо: cd .../zavod/main && node scripts/reels/idea-runner.mjs",
    );
    process.exit(1);
  }
  const plan = parseArgs(argv);
  if (plan.dry) {
    if (!plan.text.trim()) {
      console.error('usage: node scripts/reels/idea-runner.mjs --dry-run [--no-render] "<идея>"');
      process.exit(1);
    }
    await dryRun(plan.text, { render: plan.render });
    return;
  }
  if (!takeLock()) {
    // Предыдущий тик ещё работает — выходим молча, без строки в логе.
    return;
  }
  await tick();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv.slice(2));
}
