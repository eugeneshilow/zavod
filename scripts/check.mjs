import { spawnSync } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const resultPath = new URL("../.check-result.json", import.meta.url);
const temporaryPath = new URL(
  `../.check-result-${process.pid}.json`,
  import.meta.url,
);
const steps = [
  ["Prettier", ["prettier", "--check", "."]],
  ["ESLint", ["eslint", "."]],
  ["Типы маршрутов Next.js", ["next", "typegen"]],
  ["TypeScript", ["tsc", "--noEmit"]],
  ["Vitest", ["vitest", "run"]],
];
let failedStep = null;
let exitCode = 0;

try {
  for (const [name, args] of steps) {
    failedStep = name;
    console.log(`\n→ ${name}`);
    const result = spawnSync("pnpm", ["exec", ...args], {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        TZ: "Europe/Moscow",
      },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      exitCode = result.status ?? 1;
      break;
    }
    failedStep = null;
  }
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  const result = {
    status: exitCode === 0 ? "green" : "red",
    checkedAt: new Date().toISOString(),
    failedStep,
  };
  writeFileSync(temporaryPath, `${JSON.stringify(result, null, 2)}\n`);
  renameSync(temporaryPath, resultPath);
  console.log(
    `\nПроверка: ${result.status}. Результат записан в .check-result.json`,
  );
}

process.exitCode = exitCode;
