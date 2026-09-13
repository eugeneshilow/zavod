import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const site = process.argv[2];
const basePath = "/zavod";
const origin = site ? new URL(site).origin : null;
const assets = new Set();

async function read(relativePath) {
  assert(
    relativePath.startsWith(`${basePath}/`),
    `Wrong path: ${relativePath}`,
  );
  if (origin) {
    const response = await fetch(`${origin}${relativePath}`, {
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(
      response.status,
      200,
      `${relativePath}: HTTP ${response.status}`,
    );
    return {
      body: await response.text(),
      type: response.headers.get("content-type"),
    };
  }
  const local = relativePath.slice(basePath.length + 1);
  return {
    body: await readFile(
      `out/${local.endsWith("/") || !local ? `${local}index.html` : local}`,
      "utf8",
    ),
    type: null,
  };
}

for (const [route, expected] of [
  ["/", "Открыть управление"],
  ["/admin/", "Пульт"],
]) {
  const { body } = await read(`${basePath}${route}`);
  assert(body.includes(expected), `${route}: missing page content`);
  assert(body.includes('href="/zavod/admin/"'), `${route}: wrong admin link`);
  if (route === "/admin/") {
    assert(
      body.includes("Снимок проверки на момент публикации"),
      "Missing build snapshot label",
    );
    assert(
      body.includes("adopt-spec-driven-company"),
      "Missing project documents",
    );
  }
  const pageAssets = [
    ...body.matchAll(/(?:src|href)="([^"<>]+\.(?:js|css)(?:\?[^"<>]*)?)"/g),
  ].map((match) => match[1]);
  assert(
    pageAssets.some((asset) => asset.endsWith(".js")),
    `${route}: missing JavaScript`,
  );
  assert(
    pageAssets.some((asset) => asset.endsWith(".css")),
    `${route}: missing styles`,
  );
  for (const asset of pageAssets) assets.add(asset);
}

for (const asset of assets) {
  const { body, type } = await read(asset);
  assert(body.length > 0, `${asset}: empty asset`);
  if (origin)
    assert(!type?.includes("text/html"), `${asset}: HTML instead of asset`);
}
console.log(
  `Pages check passed: 2 routes, ${assets.size} assets (${site ?? "local export"}).`,
);
