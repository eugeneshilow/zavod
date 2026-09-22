import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findMissing } from "@/convex/lib/instagram_media";
import {
  attachIdeas,
  dayGrid,
  dayKey,
  ideaCostLines,
  ideaCounts,
  ideaHost,
  ideaPhaseChip,
  postsByDay,
  engagementRate,
  replays,
  splitAirtime,
  toReel,
  watchThrough,
  type Idea,
  type NetworkGlance,
  type Reel,
  type SocialData,
} from "@/lib/social";
import SocialPage from "@/app/admin/social/page";
import NetworkPage from "@/app/admin/social/[network]/page";

// Экран сети читает данные одной функцией, поэтому подмена одна: пока в
// mocked.data пусто — работает настоящая loadSocial (её и проверяет тест без
// пропуска к базе); положили данные — экран рисует их.
const mocked = vi.hoisted(() => ({ data: null as SocialData | null }));

vi.mock("@/lib/social", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/social")>();
  return {
    ...actual,
    loadSocial: async (now?: number) => mocked.data ?? (await actual.loadSocial(now)),
  };
});

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

/** Строка идеи с пустыми полями: тест дополняет только то, что проверяет. */
function idea(over: Partial<Idea> = {}): Idea {
  return {
    id: "i1",
    text: "Тред про агентов в проде",
    createdAt: now,
    status: "pending",
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
  };
}

describe("плашка фазы идеи", () => {
  it("ждёт выбора и очередь к раннеру — серые", () => {
    expect(ideaPhaseChip(idea({ status: "pending" }), now)).toEqual({
      text: "ждёт выбора",
      tone: "grey",
    });
    expect(ideaPhaseChip(idea({ status: "new" }), now)).toEqual({
      text: "в очереди к раннеру",
      tone: "grey",
    });
  });

  it("в работе — жёлтая, со временем своей фазы", () => {
    const writing = ideaPhaseChip(
      idea({ status: "taken", phase: "story", phaseAt: now - 3 * 60_000 }),
      now,
    );
    expect(writing).toEqual({ text: "пишет историю · 3 мин", tone: "warn" });
    const rendering = ideaPhaseChip(
      idea({ status: "taken", phase: "render", phaseAt: now - 40_000 }),
      now,
    );
    expect(rendering).toEqual({ text: "озвучка и сборка · 40 с", tone: "warn" });
    expect(ideaPhaseChip(idea({ status: "taken", phase: "publish", phaseAt: now }), now)).toEqual({
      text: "публикация",
      tone: "warn",
    });
    expect(ideaPhaseChip(idea({ status: "taken", takenAt: now }), now).text).toBe("в работе");
  });

  it("готовая показывает время выхода и сколько дверей ждут", () => {
    const chip = ideaPhaseChip(idea({ status: "done", queueCount: 2, queueAt: now }), now);
    expect(chip.tone).toBe("warn");
    expect(chip.text).toMatch(/^в очереди · \d{2}:\d{2} · 2 двери$/);
    expect(ideaPhaseChip(idea({ status: "done" }), now).text).toBe("в очереди");
  });

  it("не вышла — красная, с фазой и причиной", () => {
    expect(
      ideaPhaseChip(
        idea({ status: "failed", phase: "story", error: "страница не открылась" }),
        now,
      ),
    ).toEqual({ text: "история · страница не открылась", tone: "bad" });
    expect(ideaPhaseChip(idea({ status: "failed", error: "остановлено руками" }), now).text).toBe(
      "остановлено руками",
    );
  });
});

describe("строки цены идеи", () => {
  it("модель, токены тысячами и деньги по прайсу", () => {
    expect(
      ideaCostLines(
        idea({
          writer: {
            model: "claude-fable-5-1",
            inputTokens: 38_900,
            outputTokens: 2_100,
            costUsd: 0.19,
            ms: 1000,
          },
          voice: { model: "eleven_v3", chars: 690, costUsd: 0.12 },
          totalCostUsd: 0.31,
          elapsedMs: 6 * 60_000,
        }),
      ),
    ).toEqual([
      "Fable 5.1 · 38,9k → 2,1k · $0.19",
      "ElevenLabs v3 · 690 зн. · $0.12",
      "итого $0.31 · 6 мин",
    ]);
  });

  it("чего ещё нет — того и нет в столбце", () => {
    expect(ideaCostLines(idea())).toEqual([]);
    expect(
      ideaCostLines(
        idea({
          writer: {
            model: "claude-fable-5-1",
            inputTokens: 12_400,
            outputTokens: 300,
            costUsd: 0.06,
            ms: 1000,
          },
        }),
      ),
    ).toEqual(["Fable 5.1 · 12,4k → 0,3k · $0.06"]);
  });
});

describe("идея до эфира", () => {
  it("вышедшая в эфир из верхней таблицы уходит", () => {
    const rows = [idea({ id: "a" }), idea({ id: "b", status: "done", posted: true })];
    expect(rows.filter((row) => !row.posted).map((row) => row.id)).toEqual(["a"]);
  });

  it("счётчики подвала считают по статусам", () => {
    const rows = [
      idea({ id: "a" }),
      idea({ id: "b" }),
      idea({ id: "c", status: "new" }),
      idea({ id: "d", status: "taken" }),
      idea({ id: "e", status: "failed" }),
    ];
    expect(ideaCounts(rows)).toEqual({ pending: 2, working: 2, failed: 1 });
  });

  it("хост ссылки из текста, а без ссылки — прочерк", () => {
    expect(ideaHost("Тред про агентов https://x.com/rakshaa_t/status/1 — интересно")).toBe("x.com");
    expect(ideaHost("https://www.vibecoding.ru/news/2026")).toBe("vibecoding.ru");
    expect(ideaHost("просто мысль без ссылки")).toBeNull();
  });

  it("строка эфира берёт цену у своей идеи, ручная остаётся без цены", () => {
    const reels = [
      toReel({ mediaId: "m1", metrics: null }),
      toReel({ mediaId: "m2", metrics: null }),
    ];
    const stitched = attachIdeas(reels, [
      idea({ id: "a", status: "done", posted: true, postedMediaId: "m1", totalCostUsd: 0.31 }),
    ]);
    expect(stitched[0]).toMatchObject({ fromIdea: true, costUsd: 0.31 });
    expect(stitched[1]).toMatchObject({ fromIdea: false, costUsd: null });
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

describe("цифры ролика: досмотр, повторы, вовлечённость", () => {
  it("досмотр — среднее время к длине, не выше 100", () => {
    expect(watchThrough({ avgWatchMs: 20_000, durationMs: 40_000 })).toBe(50);
    expect(watchThrough({ avgWatchMs: 50_000, durationMs: 40_000 })).toBe(100);
    expect(watchThrough({ avgWatchMs: 20_000, durationMs: null })).toBeNull();
    expect(watchThrough({ avgWatchMs: null, durationMs: 40_000 })).toBeNull();
  });
  it("повторы и вовлечённость считаются к охвату, без охвата — прочерк", () => {
    expect(replays({ views: 253, reach: 184 })).toBeCloseTo(1.375, 3);
    expect(replays({ views: 10, reach: 0 })).toBeNull();
    expect(engagementRate({ interactions: 2, reach: 184 })).toBeCloseTo(1.087, 2);
    expect(engagementRate({ interactions: null, reach: 184 })).toBeNull();
  });
});

describe("экран сети с данными", () => {
  /** Сеть с одной идеей в работе, одной готовой и одним роликом в эфире. */
  function network(): NetworkGlance {
    const base = {
      id: "instagram" as const,
      label: "Площадка коротких видео",
      door: { on: true, reason: "включено", at: now },
      accounts: [],
      followers: 10,
      quotaUsage: 1,
      quotaTotal: 100,
      capturedAt: now,
      posts7d: 1,
      views7d: 253,
      days: dayGrid(now),
      deleted: [],
      waiting: 0,
      failed: 0,
    };
    const ideas: Idea[] = [
      {
        id: "i1",
        text: "Тред про агентов в проде https://x.com/rakshaa_t/status/1",
        createdAt: now,
        status: "pending",
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
      },
      {
        id: "i2",
        text: "Юзкейсы Джева",
        createdAt: now - 60 * 60 * 1000,
        status: "done",
        takenAt: now - 60 * 60 * 1000,
        note: null,
        permalink: null,
        phase: null,
        phaseAt: null,
        storyTitle: "Дизайнеру дали Джев",
        storyWords: 107,
        videoSeconds: 46,
        writer: {
          model: "claude-fable-5-1",
          inputTokens: 38_900,
          outputTokens: 2_100,
          costUsd: 0.19,
          ms: 120_000,
        },
        voice: { model: "eleven_v3", chars: 690, costUsd: 0.12 },
        totalCostUsd: 0.31,
        elapsedMs: 6 * 60_000,
        videoUrl: "https://storage.example/reel.mp4",
        posted: false,
        postedMediaId: null,
        queueCount: 2,
        queueAt: now,
        error: null,
      },
    ];
    const reel = attachIdeas(
      [toReel({ mediaId: "m9", postedAt: now - DAY, metrics: { views: 253, reach: 184 } })],
      [{ ...ideas[1], posted: true, postedMediaId: "m9" }],
    );
    return { ...base, ideas, ideasCost7d: 0.94, reels: reel, top: reel[0] };
  }

  it("рисует таблицу идей с фазами, ценой и кнопками, а эфир — с ценой ролика", async () => {
    mocked.data = { networks: [network()], days: dayGrid(now), now };
    try {
      const html = renderToStaticMarkup(
        await NetworkPage({ params: Promise.resolve({ network: "instagram" }) } as never),
      );
      expect(html).toContain('data-testid="ideas-table"');
      expect(html).toContain("ждёт выбора");
      expect(html).toContain("В работу");
      expect(html).toContain("Переписать");
      expect(html).toContain("x.com");
      expect(html).toContain("Дизайнеру дали Джев");
      expect(html).toContain("Fable 5.1 · 38,9k → 2,1k · $0.19");
      expect(html).toContain("итого $0.31 · 6 мин");
      expect(html).toContain("потрачено за неделю $0.94");
      // Нижняя таблица: цена ролика и пометка, что он родился из идеи.
      expect(html).toContain("из идеи");
      expect(html).toContain("$0.31");
    } finally {
      mocked.data = null;
    }
  });
});
