import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Мозги завода читаются с диска, как и дерево админки: папка docs/brains/<id>/
// с README.md (паспорт и приёмка), recipe.md (рецепт) и journal.md — это мозг,
// реестра в коде нет. Голова мозга собирается из живых файлов рецепта при
// каждом запросе. Канон — docs/brains/README.md; стекло — /admin/brains.

const root = process.cwd();
const BRAINS = "docs/brains";

export const BRAINS_ROUTE = "/admin/brains";

/** Семьи по продукту мозга, в порядке конвейера: текст → решение → сырьё → люди → правила. */
export const FAMILIES = [
  { family: "писатели", note: "производят тексты и сценарии" },
  { family: "судьи", note: "производят решения" },
  { family: "разведчики", note: "производят сырьё: срезы и факты" },
  { family: "собеседники", note: "разговаривают с людьми" },
  { family: "мета", note: "правят правила других мозгов" },
] as const;

export type RecipeRow = {
  /** Подпись ссылки в таблице рецепта. */
  label: string;
  /** Путь канона от корня репозитория: docs/… */
  file: string;
  /** Заголовок раздела (`## История`) или null — весь файл. */
  section: string | null;
  /** Зачем канон в голове, словами рецепта. */
  why: string;
};

export type Brain = {
  id: string;
  name: string;
  family: string;
  version: string | null;
  input: string | null;
  output: string | null;
  channel: string | null;
  model: string | null;
  /** Папка, где лежат выходы прогонов (паспорт «след прогона»). */
  runsDir: string | null;
  note: string | null;
  /** Канон мозга: docs/brains/<id>/README.md. */
  doc: string;
  /** Рецепт: docs/brains/<id>/recipe.md. */
  recipeDoc: string;
  recipe: RecipeRow[];
  /** Лестница приёмки — строки раздела «## Приёмка» канона. */
  acceptance: string[];
};

/** Имя мозга — первая строка канона без повтора id: `# short-videos — писатель…` → «писатель…». */
export function nameOf(md: string, id: string): string {
  const line = md.split("\n").find((l) => l.startsWith("# "));
  if (!line) return id;
  const text = line.slice(2).trim();
  const prefix = `${id} — `;
  return text.startsWith(prefix) ? text.slice(prefix.length).trim() : text;
}

/**
 * Текст раздела по точному заголовку — до следующего заголовка того же или
 * более высокого уровня; подразделы входят. Нет заголовка — null.
 */
export function extractSection(md: string, heading: string): string | null {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return null;
  const level = heading.match(/^#+/)?.[0].length ?? 2;
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

/** Паспорт мозга: строки `- **поле** — значение` раздела «## Паспорт». */
export function parsePassport(md: string): Record<string, string> {
  const section = extractSection(md, "## Паспорт") ?? "";
  const out: Record<string, string> = {};
  for (const line of section.split("\n")) {
    const m = line.match(/^- \*\*(.+?)\*\* — (.+)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

/** Лестница приёмки: пункты списка раздела «## Приёмка». */
export function parseAcceptance(md: string): string[] {
  const section = extractSection(md, "## Приёмка") ?? "";
  return section
    .split("\n")
    .filter((l) => /^(- |\d+\. )/.test(l))
    .map((l) => l.replace(/^(- |\d+\. )/, "").trim());
}

/**
 * Строки таблицы рецепта `| канон | секция | зачем |`: ссылка первой колонки
 * превращается в путь от корня репозитория (только внутри docs/), «весь файл»
 * во второй — в null. Строки без ссылки (шапка, разделитель) пропускаются.
 */
export function parseRecipe(md: string, recipeDoc: string): RecipeRow[] {
  const dir = path.posix.dirname(recipeDoc);
  const rows: RecipeRow[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 3) continue;
    const link = cells[0].match(/^\[(.+?)\]\((.+?)\)$/);
    if (!link) continue;
    const file = path.posix.normalize(path.posix.join(dir, link[2].split("#")[0]));
    if (!file.startsWith("docs/")) continue;
    const sectionCell = cells[1].replace(/`/g, "").trim();
    const section = sectionCell === "" || sectionCell === "весь файл" ? null : sectionCell;
    rows.push({ label: link[1], file, section, why: cells[2] });
  }
  return rows;
}

function stripCode(value: string | undefined): string | null {
  return value ? value.replace(/`/g, "").trim() : null;
}

/** Мозг по id: папка docs/brains/<id>/ с README.md и recipe.md; нет одного из них — null. */
export async function loadBrain(id: string): Promise<Brain | null> {
  if (!/^[\w-]+$/.test(id)) return null;
  const doc = `${BRAINS}/${id}/README.md`;
  const recipeDoc = `${BRAINS}/${id}/recipe.md`;
  let readme: string;
  let recipe: string;
  try {
    [readme, recipe] = await Promise.all([
      readFile(path.join(root, doc), "utf8"),
      readFile(path.join(root, recipeDoc), "utf8"),
    ]);
  } catch {
    return null;
  }
  const passport = parsePassport(readme);
  return {
    id,
    name: nameOf(readme, id),
    family: passport["семья"] ?? "без семьи",
    version: passport["версия"] ?? null,
    input: passport["вход"] ?? null,
    output: passport["выход"] ?? null,
    channel: passport["канал"] ?? null,
    model: passport["модель"] ?? null,
    runsDir: stripCode(passport["след прогона"]),
    note: passport["примечание"] ?? null,
    doc,
    recipeDoc,
    recipe: parseRecipe(recipe, recipeDoc),
    acceptance: parseAcceptance(readme),
  };
}

/** Все мозги из папки docs/brains, по алфавиту id. */
export async function listBrains(): Promise<Brain[]> {
  let entries: { name: string; isDirectory(): boolean }[];
  try {
    entries = await readdir(path.join(root, BRAINS), { withFileTypes: true });
  } catch {
    return [];
  }
  const ids = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
  const brains = await Promise.all(ids.map(loadBrain));
  return brains.filter((b): b is Brain => b !== null);
}

/** Слов в тексте: куски с буквой или цифрой; аудио-теги `[…]` не считаются. */
export function wordCount(text: string): number {
  return text
    .replace(/\[[^\]]*\]/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export type HeadPart = {
  order: number;
  file: string;
  section: string | null;
  words: number;
  /** Файл или раздел не нашёлся — голова несёт пометку вместо текста. */
  missing: boolean;
};

export type Head = { text: string; parts: HeadPart[]; words: number; kb: number };

/** Голова мозга: тексты рецепта по порядку, склеенные в один промпт. */
export async function assembleHead(brain: Brain): Promise<Head> {
  const parts: HeadPart[] = [];
  const chunks: string[] = [];
  for (const [i, row] of brain.recipe.entries()) {
    let body: string | null = null;
    try {
      const md = await readFile(path.join(root, row.file), "utf8");
      body = row.section ? extractSection(md, row.section) : md.trim();
    } catch {
      body = null;
    }
    const title = `${i + 1} · ${row.file}${row.section ? ` · ${row.section}` : ""}`;
    chunks.push(`===== ${title} =====\n\n${body ?? "(файл или раздел не найден)"}`);
    parts.push({
      order: i + 1,
      file: row.file,
      section: row.section,
      words: wordCount(body ?? ""),
      missing: body === null,
    });
  }
  const text = chunks.join("\n\n");
  return {
    text,
    parts,
    words: wordCount(text),
    kb: Math.round(Buffer.byteLength(text, "utf8") / 1024),
  };
}

export type Run = {
  file: string;
  id: string;
  title: string;
  beats: number;
  words: number;
  voice: string | null;
};

/** След прогонов руками: json-файлы папки из паспорта («след прогона»), напр. content/reels/stories. */
export async function listRuns(brain: Brain): Promise<Run[]> {
  if (!brain.runsDir) return [];
  const dir = path.posix.normalize(brain.runsDir);
  if (dir.startsWith("..") || path.posix.isAbsolute(dir)) return [];
  let names: string[];
  try {
    names = (await readdir(path.join(root, dir))).filter((n) => n.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const runs: Run[] = [];
  for (const name of names) {
    const file = path.posix.join(dir, name);
    const id = name.replace(/\.json$/, "");
    try {
      const raw = JSON.parse(await readFile(path.join(root, file), "utf8")) as {
        id?: string;
        title?: string;
        voice?: string;
        beats?: { text?: string }[];
      };
      const beats = Array.isArray(raw.beats) ? raw.beats : [];
      runs.push({
        file,
        id: raw.id ?? id,
        title: raw.title ?? "",
        beats: beats.length,
        words: wordCount(beats.map((b) => b.text ?? "").join(" ")),
        voice: raw.voice ?? null,
      });
    } catch {
      runs.push({ file, id, title: "(файл не читается)", beats: 0, words: 0, voice: null });
    }
  }
  return runs;
}
