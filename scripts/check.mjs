import { execSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const started = Date.now();
function listFiles() {
  try {
    return execSync("git ls-files", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).split("\n");
  } catch {
    // без git (сборка на хостинге): те же файлы по маске, без кешей сборщика
    const out = execSync(
      "find . -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.mjs' -o -name '*.js' -o -name '*.json' -o -name '*.css' -o -name '*.md' \\) -not -path './node_modules/*' -not -path './.next/*' -not -path './.vercel/*' -not -path './convex/_generated/*'",
      { encoding: "utf8" },
    );
    return out.split("\n").map((f) => f.replace(/^\.\//, ""));
  }
}
const files = listFiles().filter((f) => /\.(ts|tsx|mjs|js|json|css|md)$/.test(f));
const code = files.filter((f) => /\.(ts|tsx|mjs|js)$/.test(f));

const steps = [
  ["prettier", ["pnpm", ["exec", "prettier", "--check", ...files]]],
  ["eslint", ["pnpm", ["exec", "eslint", ...code]]],
  ["typegen", ["pnpm", ["exec", "next", "typegen"]]],
  ["tsc", ["pnpm", ["exec", "tsc", "--noEmit"]]],
  ["vitest", ["pnpm", ["exec", "vitest", "run"]]],
];

let status = "green";
for (const [name, [cmd, args]] of steps) {
  console.log(`\n== ${name}`);
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) {
    status = "red";
    break;
  }
}
const result = { status, at: new Date().toISOString(), durationMs: Date.now() - started };
writeFileSync(".check-result.json", JSON.stringify(result));
console.log(`\ncheck: ${status} in ${Math.round(result.durationMs / 1000)}s`);
process.exit(status === "green" ? 0 : 1);
