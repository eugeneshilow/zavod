import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

const root = process.cwd();

export async function readDoc(name: "README.md" | "journal.md"): Promise<string> {
  return readFile(path.join(root, "docs", name), "utf8");
}

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
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
  return (m ? m[0] : para).trim();
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
