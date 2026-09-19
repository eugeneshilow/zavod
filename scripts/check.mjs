import { execSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const started = Date.now();
const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(ts|tsx|mjs|js|json|css|md)$/.test(f));
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
