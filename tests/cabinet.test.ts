import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import {
  BUILT_BLOCKS,
  cabinetBlocks,
  cabinetRewrite,
  composeCabinet,
  greeting,
  isAppHost,
  reelTitle,
  VOICES,
  DESTINATIONS,
  type CabinetData,
} from "@/lib/cabinet";
import type { Idea } from "@/lib/social";
import type { AirtimeRow } from "@/lib/reels";
import CabinetHome from "@/app/cabinet/page";
import CabinetNew from "@/app/cabinet/new/page";

// Зона cabinet: хост app. ведёт в кабинет, блоки экрана читаются из канона,
// числа собираются чисто, экран без базы говорит причину. Канон —
// docs/cabinet/README.md.

const mocked = vi.hoisted(() => ({ data: null as CabinetData | { reason: string } | null }));

vi.mock("@/lib/cabinet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cabinet")>();
  return {
    ...actual,
    loadCabinet: async (now?: number) => mocked.data ?? (await actual.loadCabinet(now)),
  };
});

const readme = readFileSync("docs/cabinet/README.md", "utf8");
const now = Date.UTC(2026, 8, 23, 6, 0, 0); // 23.09.2026 09:00 МСК
const DAY = 24 * 60 * 60 * 1000;

describe("хост кабинета", () => {
  it("app. — кабинет, остальное — нет", () => {
    expect(isAppHost("app.zavod.today")).toBe(true);
    expect(isAppHost("app.localhost:3400")).toBe(true);
    expect(isAppHost("zavod.today")).toBe(false);
    expect(isAppHost(null)).toBe(false);
  });

  it("путь переписывается на /cabinet, кабинетные и служебные не трогаются", () => {
    expect(cabinetRewrite("/")).toBe("/cabinet");
    expect(cabinetRewrite("/reels")).toBe("/cabinet/reels");
    expect(cabinetRewrite("/cabinet/reels")).toBeNull();
    expect(cabinetRewrite("/_next/static/x.js")).toBeNull();
  });

  it("proxy: с хоста app. главная уезжает в кабинет, с основного — нет", () => {
    const onApp = proxy(
      new NextRequest("http://app.localhost:3400/", { headers: { host: "app.localhost:3400" } }),
    );
    expect(onApp.headers.get("x-middleware-rewrite")).toContain("/cabinet");
    const onMain = proxy(
      new NextRequest("http://localhost:3400/", { headers: { host: "localhost:3400" } }),
    );
    expect(onMain.headers.get("x-middleware-rewrite")).toBeNull();
    expect(onMain.status).toBe(200);
  });
});

describe("блоки кабинета", () => {
  it("читаются из канона в его порядке и совпадают с собранным", () => {
    const blocks = cabinetBlocks(readme);
    expect(blocks.map((b) => b.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(blocks.filter((b) => b.slug === null)).toEqual([]);
    expect(blocks.map((b) => b.slug)).toEqual(BUILT_BLOCKS);
  });
});

describe("приветствие по Москве", () => {
  it("утро, день, вечер, ночь", () => {
    expect(greeting(Date.UTC(2026, 8, 23, 6), "Иван")).toBe("Доброе утро, Иван");
    expect(greeting(Date.UTC(2026, 8, 23, 11), "Иван")).toBe("Добрый день, Иван");
    expect(greeting(Date.UTC(2026, 8, 23, 16), "Иван")).toBe("Добрый вечер, Иван");
    expect(greeting(Date.UTC(2026, 8, 23, 0), "Иван")).toBe("Доброй ночи, Иван");
  });
});

function air(over: Partial<AirtimeRow> & { mediaId: string }): AirtimeRow {
  return {
    account: "ruvibecoding",
    permalink: `https://www.instagram.com/reel/${over.mediaId}/`,
    caption: "Подпись ролика\n#новости",
    postedAt: now - DAY,
    missingSince: null,
    durationMs: 40000,
    videoUrl: null,
    capturedAt: now,
    metrics: { views: 100 },
    views24h: 10,
    views48h: 20,
    ...over,
  } as AirtimeRow;
}

function idea(over: Partial<Idea> & { id: string }): Idea {
  return {
    text: "https://www.rbc.ru/economics/1",
    createdAt: now - 2 * DAY,
    status: "new",
    takenAt: null,
    note: null,
    permalink: null,
    phase: null,
    phaseAt: null,
    storyTitle: null,
    storyWords: null,
    videoSeconds: null,
    writer: null,
    voice: null,
    totalCostUsd: null,
    elapsedMs: null,
    videoUrl: null,
    posted: false,
    postedMediaId: null,
    queueCount: 0,
    queueAt: null,
    error: null,
    ...over,
  } as Idea;
}

describe("сборка чисел", () => {
  const data = composeCabinet(
    {
      airtime: [
        air({ mediaId: "m1", metrics: { views: 500 }, postedAt: now - DAY }),
        air({ mediaId: "m2", metrics: { views: 50 }, postedAt: now - 10 * DAY }),
        air({
          mediaId: "m3",
          metrics: { views: 5 },
          postedAt: now - 20 * DAY,
          missingSince: now - DAY,
        }),
      ],
      ideas: [
        idea({ id: "i1", status: "taken", phase: "render", takenAt: now - 1000 }),
        idea({ id: "i2" }),
        idea({ id: "i3", status: "failed", error: "нет голоса" }),
        idea({
          id: "i4",
          status: "done",
          posted: true,
          postedMediaId: "m1",
          storyTitle: "Ставку оставили",
        }),
      ],
    },
    now,
  );

  it("показатели: в эфире, за неделю, очередь, всего", () => {
    expect(data.stats).toEqual({ live: 2, views7d: 500, queued: 2, total: 3 });
    expect(data.week).toEqual({ posts7d: 1, postsToday: 0 });
  });

  it("строки: очередь сверху, эфир по дате, снятые в хвосте; заголовок из сюжета", () => {
    expect(data.rows.map((r) => r.status)).toEqual([
      "rendering",
      "queued",
      "failed",
      "live",
      "live",
      "deleted",
    ]);
    expect(data.rows[3]).toMatchObject({
      id: "m1",
      title: "Ставку оставили",
      source: "rbc.ru",
      views: 500,
    });
    expect(data.rows[4].title).toBe("Подпись ролика");
  });

  it("столбики: четырнадцать дней, вчера один ролик", () => {
    expect(data.days).toHaveLength(14);
    expect(data.days[12].count).toBe(1);
    expect(data.top.map((t) => t.views)).toEqual([500, 50]);
  });

  it("заголовок: сюжет важнее подписи, длинное режется", () => {
    expect(reelTitle("Сюжет", "подпись")).toBe("Сюжет");
    expect(reelTitle(null, "#тег первая строка\nвторая")).toBe("первая строка");
    expect(reelTitle(null, "x".repeat(90))).toHaveLength(70);
    expect(reelTitle(null, "Юзкейсы Джева https://x.com/a/status/1")).toBe("Юзкейсы Джева");
  });
});

describe("экран кабинета", () => {
  it("без пропуска к базе называет причину", async () => {
    mocked.data = { reason: "не задан ADMIN_API_TOKEN" };
    const html = renderToStaticMarkup(await CabinetHome());
    expect(html).toContain("не задан ADMIN_API_TOKEN");
    mocked.data = null;
  });

  it("с данными рисует приветствие, показатели и таблицу", async () => {
    mocked.data = composeCabinet(
      { airtime: [air({ mediaId: "m1", metrics: { views: 700 } })], ideas: [idea({ id: "i1" })] },
      now,
    );
    const html = renderToStaticMarkup(await CabinetHome());
    expect(html).toContain("Доброе утро, Евгений");
    expect(html).toContain("В эфире");
    expect(html).toContain("в очереди");
    expect(html).toContain("Сделать ролик");
    mocked.data = null;
  });
});

describe("экран заказа", () => {
  it("голос по умолчанию один — голос канала; площадка без имени", () => {
    expect(VOICES.filter((v) => v.isDefault).map((v) => v.id)).toEqual(["ermil"]);
    expect(VOICES.every((v) => v.voice.startsWith("yandex:"))).toBe(true);
    expect(DESTINATIONS.map((d) => d.id)).toEqual(["reels", "telegram", "download"]);
  });

  it("рисует четыре шага, кнопку и честную строку про механику", () => {
    const html = renderToStaticMarkup(CabinetNew());
    expect(html).toContain("Идея ролика");
    expect(html).toContain("Голос рассказчика");
    expect(html).toContain("Куда выложить");
    expect(html).toContain("Пожелание");
    expect(html).toContain("Сделать ролик");
    expect(html).toContain("механика подключается следующим шагом");
  });
});
