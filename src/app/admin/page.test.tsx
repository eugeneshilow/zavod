import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));
import AdminPage from "./page";

test("/admin показывает первое принятое решение из настоящего журнала", async () => {
  const journal = await readFile("docs/journal.md", "utf8");
  const initialDecision = journal
    .split("\n")
    .find(
      (line) =>
        line.startsWith("## ") && line.includes("⚖️ adopt-spec-driven-company"),
    );
  expect(initialDecision).toBeDefined();
  const date = initialDecision!.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)![0];
  const title = initialDecision!.split(" · ").at(-1)!;
  const html = renderToStaticMarkup(await AdminPage());
  const decisionsList = html.match(
    /<ol aria-label="Решения из журнала"[^>]*>([\s\S]*?)<\/ol>/,
  )?.[1];
  expect(decisionsList).toContain("adopt-spec-driven-company");
  expect(decisionsList).toContain(date);
  expect(decisionsList).toContain(title);
  expect(decisionsList).toContain('href="#decision-adopt-spec-driven-company"');
});
