import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Marked } from "marked";
import { hrefOf, titleOf, type NavNode } from "@/lib/nav-tree";

// Чтение docs/ с диска для админки: дерево зон, канон зоны, решения журнала,
// результат проверки. Адрес экрана — зеркало адреса канона (docs/admin.md).

const root = process.cwd();
const DOCS = path.join(root, "docs");

/** Служебные файлы папки: не зоны, в хедер не попадают, но по адресу открываются. */
const SERVICE = new Set(["README.md", "journal.md"]);

export async function readDoc(name: "README.md" | "journal.md"): Promise<string> {
  return readFile(path.join(DOCS, name), "utf8");
}

export function renderMarkdown(md: string): string {
  return new Marked().parse(md, { async: false }) as string;
}

/**
 * Канон в разметке админки: относительные ссылки на другие файлы docs
 * становятся адресами экранов по правилу зеркала, чтобы по канону можно было
 * гулять так же, как по папкам. Внешние ссылки и якоря не трогаются.
 */
export function renderDoc(md: string, doc: string): string {
  const dir = path.posix.dirname(doc);
  const marked = new Marked({
    walkTokens(token) {
      if (token.type !== "link") return;
      const href = token.href;
      if (/^([a-z]+:|#|\/)/i.test(href)) return;
      const [file, hash] = href.split("#");
      const target = path.posix.normalize(path.posix.join(dir, file));
      if (!target.startsWith("docs/") || !target.endsWith(".md")) return;
      token.href = hrefOf(target) + (hash ? `#${hash}` : "");
    },
  });
  return marked.parse(md, { async: false }) as string;
}

/** Текст канона без первой строки-заголовка: заголовок рисует шапка страницы. */
export function stripTitle(md: string): string {
  const lines = md.split("\n");
  const i = lines.findIndex((l) => l.startsWith("# "));
  if (i < 0) return md;
  return lines
    .slice(i + 1)
    .join("\n")
    .trimStart();
}

export function projectTitle(readme: string): string {
  const line = readme.split("\n").find((l) => l.startsWith("# "));
  return line ? line.slice(2).trim() : "Проект";
}

export function projectSentence(readme: string): string {
  const idx = readme.indexOf("## Что это");
  if (idx < 0) return "";
  const after = readme.slice(idx + "## Что это".length).trim();
  const para = after.split("\n\n")[0] ?? "";
  const m = para.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : para).trim().replace(/`/g, "");
}

export type Decision = { date: string; name: string; title: string };

export function decisions(journal: string): Decision[] {
  const out: Decision[] = [];
  for (const line of journal.split("\n")) {
    if (!line.startsWith("## ") || !line.includes("⚖️")) continue;
    const parts = line
      .slice(3)
      .split("·")
      .map((s) => s.trim());
    const date = parts[0] ?? "";
    const nameIdx = parts.findIndex((p) => p.startsWith("⚖️"));
    const name = nameIdx >= 0 ? parts[nameIdx].replace("⚖️", "").trim() : "";
    const title = nameIdx >= 0 ? parts.slice(nameIdx + 1).join(" · ") : parts.slice(2).join(" · ");
    out.push({ date, name, title });
  }
  return out;
}

export type CheckResult = { status: "green" | "red"; at: string; durationMs: number };

export async function lastCheck(): Promise<CheckResult | null> {
  try {
    const raw = await readFile(path.join(root, ".check-result.json"), "utf8");
    return JSON.parse(raw) as CheckResult;
  } catch {
    return null;
  }
}

export function deployInfo(): { commit: string; url: string } {
  return {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    url: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "local",
  };
}

async function zonesIn(dir: string, rel: string, depth: number): Promise<NavNode[]> {
  const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
  const nodes: NavNode[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isFile()) {
      if (!entry.name.endsWith(".md") || SERVICE.has(entry.name)) continue;
      if (depth === 0 && entry.name === "admin.md") continue;
      const doc = path.posix.join(rel, entry.name);
      const md = await readFile(path.join(dir, entry.name), "utf8");
      const slug = entry.name.replace(/\.md$/, "");
      nodes.push({ href: hrefOf(doc), doc, ...titleOf(md, slug) });
    } else if (entry.isDirectory()) {
      const doc = path.posix.join(rel, entry.name, "README.md");
      let md: string;
      try {
        md = await readFile(path.join(dir, entry.name, "README.md"), "utf8");
      } catch {
        continue; // папка без README — не зона
      }
      const children =
        depth < 2
          ? await zonesIn(path.join(dir, entry.name), doc.replace(/\/README\.md$/, ""), depth + 1)
          : [];
      nodes.push({
        href: hrefOf(doc),
        doc,
        ...titleOf(md, entry.name),
        ...(children.length ? { children } : {}),
      });
    }
  }
  return nodes;
}

/**
 * Дерево админки из папки docs/: каждая зона — файл `docs/<зона>.md` или папка
 * `docs/<зона>/` с README.md; корень — docs/admin.md. Новый файл в docs
 * появляется в хедере сам, без правки кода.
 */
export async function navTree(): Promise<NavNode> {
  const [readme, admin] = await Promise.all([
    readDoc("README.md"),
    readFile(path.join(DOCS, "admin.md"), "utf8").catch(() => ""),
  ]);
  const children = await zonesIn(DOCS, "docs", 0);
  return {
    href: "/admin",
    label: projectTitle(readme),
    note: titleOf(admin, "Админка").note ?? "стекло проекта",
    doc: "docs/admin.md",
    children,
  };
}

export type ResolvedDoc = { doc: string; md: string };

/**
 * Обратное правило зеркала: сегменты адреса → файл канона. `/admin/reels` →
 * docs/reels.md, `/admin/research` → docs/research/README.md, `/admin/journal`
 * → docs/journal.md. Нет ни файла, ни папки — null: экран честно говорит,
 * какого файла не хватает.
 */
export async function resolveDoc(segments: string[]): Promise<ResolvedDoc | null> {
  if (segments.some((s) => !/^[\w.-]+$/.test(s) || s === "..")) return null;
  const rel = segments.join("/");
  const candidates = rel ? [`docs/${rel}.md`, `docs/${rel}/README.md`] : ["docs/admin.md"];
  for (const doc of candidates) {
    try {
      const md = await readFile(path.join(root, doc), "utf8");
      return { doc, md };
    } catch {
      // следующий кандидат
    }
  }
  return null;
}
