import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Площадка коротких видео на людях по имени не называется (⚖️ platform-word-on-public,
// docs/social/README.md «Как называем площадки на людях»). Тест читает публичные
// поверхности без адресов ссылок: слово с большой буквы или по-русски — красный гейт.
// Техническое имя в коде (`channel: "instagram"`, `data_raw_instagram_*`) законно.

const PUBLIC: string[] = [
  "app/page.tsx",
  "app/offer",
  "app/cabinet",
  "components/ui",
  "components/cabinet",
  "lib/landing.ts",
  "lib/landing-copy.ts",
  "lib/cabinet.ts",
  "docs/landing/README.md",
  "docs/cabinet/README.md",
];

function files(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { recursive: true })
    .map((f) => join(path, String(f)))
    .filter((f) => statSync(f).isFile());
}

const FORBIDDEN = /Instagram|нстаграм/;

describe("площадка коротких видео на людях", () => {
  it("публичные поверхности не называют площадку по имени", () => {
    const hits: string[] = [];
    for (const path of PUBLIC.flatMap(files)) {
      const text = readFileSync(path, "utf8").replace(/https?:\/\/\S+/g, "");
      const m = text.match(FORBIDDEN);
      if (m) hits.push(`${path}: «${m[0]}»`);
    }
    expect(hits).toEqual([]);
  });

  it("правило записано в каноне зоны social", () => {
    const readme = readFileSync("docs/social/README.md", "utf8");
    expect(readme).toContain("## Как называем площадки на людях");
    expect(readme).toContain("площадка коротких видео");
  });
});
