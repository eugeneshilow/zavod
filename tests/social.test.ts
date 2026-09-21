import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { findMissing } from "@/convex/lib/instagram_media";
import {
  dayGrid,
  dayKey,
  ideaStatusWord,
  postsByDay,
  splitAirtime,
  toReel,
  type Reel,
} from "@/lib/social";
import SocialPage from "@/app/admin/social/page";
import NetworkPage from "@/app/admin/social/[network]/page";

// Зона social: раскладка очереди по дням и оба экрана без пропуска к базе
// честно говорят причину. Канон — docs/social/README.md.

const now = Date.UTC(2026, 8, 21, 12, 0, 0); // 21.09.2026 15:00 МСК
const DAY = 24 * 60 * 60 * 1000;

describe("эфир по дням", () => {
  it("восемь колонок: шесть дней назад, сегодня, завтра", () => {
    const grid = dayGrid(now);
    expect(grid).toHaveLength(8);
    expect(grid[6].key).toBe(dayKey(now));
    expect(grid[7].key).toBe(dayKey(now + DAY));
  });

  it("вышедшие считаются по факту и своей двери, ждущие — по плану не раньше сегодня", () => {
    const rows = [
      {
        status: "posted",
        channel: "instagram",
        scheduledAt: now - DAY,
        postedAt: now - DAY,
        caption: "",
      },
      {
        status: "posted",
        channel: "telegram",
        scheduledAt: now - DAY,
        postedAt: now - DAY,
        caption: "",
      },
      {
        status: "posted",
        channel: null,
        scheduledAt: now - 2 * DAY,
        postedAt: now - 2 * DAY,
        caption: "",
      },
      {
        status: "approved",
        channel: "instagram",
        scheduledAt: now - 3 * DAY,
        postedAt: null,
        caption: "",
      },
      {
        status: "approved",
        channel: "instagram",
        scheduledAt: now + DAY,
        postedAt: null,
        caption: "",
      },
      { status: "failed", channel: "instagram", scheduledAt: now, postedAt: null, caption: "" },
    ];
    const ig = postsByDay(rows, "instagram", now);
    expect(ig.find((c) => c.key === dayKey(now - DAY))?.posted).toBe(1);
    expect(ig.find((c) => c.key === dayKey(now - 2 * DAY))?.posted).toBe(1);
    expect(ig.find((c) => c.key === dayKey(now))?.planned).toBe(1);
    expect(ig.find((c) => c.key === dayKey(now + DAY))?.planned).toBe(1);
    const tg = postsByDay(rows, "telegram", now);
    expect(tg.reduce((s, c) => s + c.posted + c.planned, 0)).toBe(1);
  });
});

describe("удалённые ролики", () => {
  const registry = [
    { id: "a", mediaId: "1" },
    { id: "b", mediaId: "2" },
    { id: "c", mediaId: "3", missingSince: now - DAY },
  ];

  it("помечает тех, кого площадка больше не отдаёт", () => {
    expect(findMissing(registry, new Set(["1"]))).toEqual(["b"]);
  });

  it("уже помеченных не трогает", () => {
    expect(findMissing(registry, new Set(["1", "2"]))).toEqual([]);
  });

  it("пустой ответ площадки не помечает никого", () => {
    expect(findMissing(registry, new Set<string>())).toEqual([]);
  });
});

describe("эфир сети: живые и удалённые", () => {
  const row = (over: Partial<Reel>): Reel =>
    toReel({
      mediaId: over.mediaId ?? "x",
      account: "ruvibecoding",
      postedAt: over.postedAt ?? now - DAY,
      missingSince: over.missingSince ?? null,
      metrics: { views: over.views ?? 0, reach: 100, totalInteractions: 10 },
    });

  const rows = [
    row({ mediaId: "live-small", views: 10 }),
    row({ mediaId: "live-big", views: 500 }),
    row({ mediaId: "gone", views: 9000, missingSince: now - 2 * DAY }),
    row({ mediaId: "old", views: 7, postedAt: now - 30 * DAY }),
  ];

  it("живые по просмотрам вниз, удалённые отдельным хвостом", () => {
    const air = splitAirtime(rows, now);
    expect(air.reels.map((r) => r.mediaId)).toEqual(["live-big", "live-small", "old"]);
    expect(air.deleted.map((r) => r.mediaId)).toEqual(["gone"]);
  });

  it("просмотры за семь дней и лучший ролик удалённых не считают", () => {
    const air = splitAirtime(rows, now);
    expect(air.views7d).toBe(510);
    expect(air.top?.mediaId).toBe("live-big");
  });
});

describe("статус идеи словом", () => {
  it("по статусу строки лотка", () => {
    expect(ideaStatusWord({ status: "new", takenAt: null, note: null })).toBe("ждёт раннер");
    expect(ideaStatusWord({ status: "taken", takenAt: now, note: "mac" })).toMatch(
      /^в работе с \d{2}:\d{2}$/,
    );
    expect(ideaStatusWord({ status: "done", takenAt: now, note: null })).toBe("готово");
    expect(ideaStatusWord({ status: "failed", takenAt: now, note: "рендер упал" })).toBe(
      "не вышло: рендер упал",
    );
  });
});

describe("экраны social без пропуска к базе", () => {
  it("сводка и сеть показывают причину, канон под ними", async () => {
    const saved = process.env.ADMIN_API_TOKEN;
    delete process.env.ADMIN_API_TOKEN;
    try {
      const summary = renderToStaticMarkup(await SocialPage());
      expect(summary).toContain('data-testid="social-unavailable"');
      expect(summary).toContain("docs/social/README.md");
      const ig = renderToStaticMarkup(
        await NetworkPage({ params: Promise.resolve({ network: "instagram" }) } as never),
      );
      expect(ig).toContain('data-testid="social-unavailable"');
      expect(ig).toContain("docs/social/instagram.md");
      const nope = renderToStaticMarkup(
        await NetworkPage({ params: Promise.resolve({ network: "vk" }) } as never),
      );
      expect(nope).toContain("без кода экрана");
    } finally {
      if (saved) process.env.ADMIN_API_TOKEN = saved;
    }
  });
});
