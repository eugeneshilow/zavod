import { readFile } from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";

export type Decision = {
  date: string;
  name: string;
  title: string;
  anchor: string;
};

type CheckResult = {
  status: "green" | "red";
  checkedAt: string;
  failedStep: string | null;
};

const markdown = new MarkdownIt({ html: false, linkify: false });

function decisionFromHeading(heading: string): Decision | null {
  const date = heading.match(/^(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?/);
  const choice = heading.match(/⚖️?\s+([^\s·]+)(?:\s+·\s+(.+))?/u);
  if (!date || !choice) return null;
  return {
    date: date[0],
    name: choice[1],
    title: choice[2] ?? choice[1],
    anchor: `decision-${choice[1]}`,
  };
}

markdown.renderer.rules.heading_open = (tokens, index, options, _env, self) => {
  const decision = decisionFromHeading(tokens[index + 1].content);
  if (decision) tokens[index].attrSet("id", decision.anchor);
  return self.renderToken(tokens, index, options);
};

const defaultLink = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const href = tokens[index].attrGet("href");
  if (href === "hosting.md")
    tokens[index].attrSet(
      "href",
      "https://github.com/eugeneshilow/zavod/blob/main/docs/hosting.md",
    );
  if (href === "journal.md") tokens[index].attrSet("href", "#journal");
  if (href === "admin.md") tokens[index].attrSet("href", "#admin-spec");
  if (href === "README.md") tokens[index].attrSet("href", "#overview");
  return defaultLink
    ? defaultLink(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options);
};

async function readDocument(name: "README.md" | "journal.md" | "admin.md") {
  return readFile(path.join(process.cwd(), "docs", name), "utf8");
}

export async function readProjectSummary() {
  const source = await readDocument("README.md");
  const name = source.match(/^# (.+)$/m)?.[1];
  const description = source.match(/## Что это\s+([^\n]+)/)?.[1];
  if (!name || !description) {
    throw new Error(
      "В docs/README.md нужны название проекта и раздел «Что это».",
    );
  }
  return { name, description };
}

async function readCheckResult(): Promise<CheckResult | null> {
  try {
    const result = JSON.parse(
      await readFile(path.join(process.cwd(), ".check-result.json"), "utf8"),
    );
    if (
      (result.status !== "green" && result.status !== "red") ||
      typeof result.checkedAt !== "string" ||
      Number.isNaN(Date.parse(result.checkedAt))
    ) {
      return null;
    }
    return {
      status: result.status,
      checkedAt: result.checkedAt,
      failedStep:
        typeof result.failedStep === "string" ? result.failedStep : null,
    };
  } catch {
    return null;
  }
}

export async function readAdminContent() {
  const [overview, journal, check, admin] = await Promise.all([
    readDocument("README.md"),
    readDocument("journal.md"),
    readCheckResult(),
    readDocument("admin.md"),
  ]);
  const tokens = markdown.parse(journal, {});
  const decisions: Decision[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].type !== "heading_open") continue;
    const decision = decisionFromHeading(tokens[index + 1].content);
    if (decision) decisions.push(decision);
  }
  return {
    overviewHtml: markdown.render(overview),
    adminHtml: markdown.render(admin),
    journalHtml: markdown.render(journal),
    decisions,
    check,
  };
}
