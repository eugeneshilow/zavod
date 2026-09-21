import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { dayGrid, dayKey, postsByDay } from "@/lib/social";
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
