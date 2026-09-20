import { describe, expect, it } from "vitest";
import { containerFields, igError } from "@/convex/services/instagram";
import {
  MAX_ATTEMPTS,
  MAX_QUEUE_AGE_MS,
  RETRY_DELAY_MS,
  isStaleForPosting,
  planAfterFailure,
  videoSourceOf,
} from "@/convex/services/reels_queue";

// Правила очереди публикации, которые уже стоили бы денег или репутации:
// два поста из одного ролика, пост задним числом, ролик, потерянный после
// одной сетевой ошибки. Канон зоны — docs/publish.md.

describe("источник видео", () => {
  it("принимает только адрес", () => {
    expect(videoSourceOf({ videoUrl: "https://example.com/a.mp4" })).toEqual({
      kind: "url",
      videoUrl: "https://example.com/a.mp4",
    });
  });

  it("принимает только файл в хранилище", () => {
    expect(videoSourceOf({ storageId: "kg2abc" })).toEqual({
      kind: "storage",
      storageId: "kg2abc",
    });
  });

  it("отказывает, когда источников два", () => {
    expect(() =>
      videoSourceOf({ videoUrl: "https://example.com/a.mp4", storageId: "kg2abc" }),
    ).toThrow(/ровно один источник/);
  });

  it("отказывает, когда источника нет", () => {
    expect(() => videoSourceOf({})).toThrow(/ровно один источник/);
    expect(() => videoSourceOf({ videoUrl: "   " })).toThrow(/ровно один источник/);
  });
});

describe("гейт свежести", () => {
  const now = 1_700_000_000_000;

  it("пропускает ролик моложе двух суток", () => {
    expect(isStaleForPosting(now - MAX_QUEUE_AGE_MS + 1000, now)).toBe(false);
  });

  it("останавливает ролик старше двух суток", () => {
    expect(isStaleForPosting(now - MAX_QUEUE_AGE_MS - 1000, now)).toBe(true);
  });

  it("ровно на границе ещё не протух", () => {
    expect(isStaleForPosting(now - MAX_QUEUE_AGE_MS, now)).toBe(false);
  });
});

describe("повтор после сбоя", () => {
  const now = 1_700_000_000_000;

  it("первая неудача возвращает ролик в очередь со сдвигом на два часа", () => {
    expect(planAfterFailure({ attemptsBefore: 0, now })).toEqual({
      status: "approved",
      attempts: 1,
      scheduledAt: now + RETRY_DELAY_MS,
      alert: false,
    });
  });

  it("вторая неудача тоже возвращает в очередь", () => {
    const plan = planAfterFailure({ attemptsBefore: 1, now });
    expect(plan.status).toBe("approved");
    expect(plan.attempts).toBe(2);
  });

  it("третья неудача гасит ролик и зажигает тревогу", () => {
    expect(planAfterFailure({ attemptsBefore: 2, now })).toEqual({
      status: "failed",
      attempts: MAX_ATTEMPTS,
      alert: true,
    });
  });

  it("сдвиг считается от более позднего из плана и текущего момента", () => {
    const plan = planAfterFailure({ attemptsBefore: 0, now, scheduledAt: now + 3_600_000 });
    expect(plan.status === "approved" && plan.scheduledAt).toBe(now + 3_600_000 + RETRY_DELAY_MS);
  });
});

describe("поля контейнера Graph API", () => {
  it("ролик едет как REELS с video_url", () => {
    const fields = containerFields("t0ken", {
      fileUrl: "https://example.com/a.mp4",
      caption: "подпись",
      isAiGenerated: true,
    });
    expect(fields.media_type).toBe("REELS");
    expect(fields.video_url).toBe("https://example.com/a.mp4");
    expect(fields.image_url).toBeUndefined();
    expect(fields.caption).toBe("подпись");
    expect(fields.is_ai_generated).toBe("true");
  });

  it("картинка едет как image_url, без media_type и без video_url", () => {
    const fields = containerFields("t0ken", {
      fileUrl: "https://example.com/a.png",
      mediaType: "IMAGE",
      caption: "подпись",
    });
    expect(fields.image_url).toBe("https://example.com/a.png");
    expect(fields.video_url).toBeUndefined();
    expect(fields.media_type).toBeUndefined();
    expect(fields.caption).toBe("подпись");
  });

  it("тип не указан — считаем роликом", () => {
    expect(containerFields("t0ken", { fileUrl: "https://example.com/a.mp4" }).media_type).toBe(
      "REELS",
    );
  });
});

describe("ошибки Graph API", () => {
  it("читает вложенный error с кодом", () => {
    expect(igError({ error: { message: "Invalid OAuth access token.", code: 190 } }, 400)).toBe(
      "Instagram API 190: Invalid OAuth access token.",
    );
  });

  it("подставляет http-статус, когда кода нет", () => {
    expect(igError({ error: { message: "boom" } }, 500)).toBe("Instagram API 500: boom");
  });

  it("читает плоский формат oauth-эндпоинтов", () => {
    expect(igError({ error_message: "code expired" }, 400)).toBe("Instagram API 400: code expired");
  });

  it("не придумывает текст, когда тела нет", () => {
    expect(igError({}, 503)).toBe("Instagram API HTTP 503");
  });
});
