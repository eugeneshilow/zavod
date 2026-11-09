#!/usr/bin/env node
// Runs a command with this project's keys from the macOS login keychain, so no
// .env.local is needed on disk. Item zavod of service perimeter-env (the
// format of the owner's env-keychain tool: the whole env file as base64 chunks
// "<item>#0..n" plus "<item>#meta"). Variables already in the environment win;
// no item (CI, Linux, a locked keychain over ssh) means the command runs as is,
// and the framework still reads .env.local if it exists. Values are never printed.
//
//   node scripts/with-keys.mjs next dev
//   KEYCHAIN_ITEM=<other> node scripts/with-keys.mjs <cmd …>
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const SERVICE = "perimeter-env";
export const ITEM = process.env.KEYCHAIN_ITEM || "zavod";

function readItem(account) {
  try {
    return execFileSync(
      "/usr/bin/security",
      ["find-generic-password", "-s", SERVICE, "-a", account, "-w"],
      { stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .replace(/\n$/, "");
  } catch {
    return null;
  }
}

export function parseEnv(text) {
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    env[m[1]] = value;
  }
  return env;
}

/** The project's keys from the keychain, or null when there is no readable item. */
export function keychainKeys(item = ITEM) {
  if (process.platform !== "darwin") return null;
  const meta = readItem(`${item}#meta`);
  if (!meta) return null;
  const { parts, sha256 } = JSON.parse(meta);
  let b64 = "";
  for (let i = 0; i < parts; i++) {
    const piece = readItem(`${item}#${i}`);
    if (piece === null) return null;
    b64 += piece;
  }
  const text = Buffer.from(b64, "base64").toString("utf8");
  if (createHash("sha256").update(text).digest("hex") !== sha256) {
    throw new Error(`keychain item ${item} is damaged`);
  }
  return parseEnv(text);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const cmd = args[0] === "--" ? args.slice(1) : args;
  if (!cmd.length) {
    console.error("usage: node scripts/with-keys.mjs <cmd …>");
    process.exit(2);
  }
  const keys = keychainKeys();
  if (process.env.WITH_KEYS_VERBOSE) {
    console.error(
      `with-keys: ${keys ? `keychain ${ITEM}, ${Object.keys(keys).length} variables` : "no keychain item, plain env"}`,
    );
  }
  const child = spawn(cmd[0], cmd.slice(1), { stdio: "inherit", env: { ...keys, ...process.env } });
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => child.kill(sig));
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}
