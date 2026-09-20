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
import {
  CAPTION_LIMIT,
  parseSendResult,
  permalinkOf,
  sendFields,
  telegramError,
  trimCaption,
  withoutToken,
} from "@/convex/services/telegram";
import { CHANNELS, parseArgs, parseChannels } from "@/scripts/reels/publish.mjs";

// Правила очереди публикации, которые уже стоили бы денег или репутации:
// два поста из одного ролика, пост задним числом, ролик, потерянный после
// одной сетевой ошибки, токен в тексте ошибки, материал, уехавший не в ту
// дверь. Канон зоны — docs/publish.md.

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

describe("дверь Telegram: тело запроса", () => {
  it("ролик едет как sendVideo со streaming", () => {
    const request = sendFields({
      chatId: "@autovibecoding",
      fileUrl: "https://example.com/a.mp4",
      caption: "подпись",
    });
    expect(request.method).toBe("sendVideo");
    expect(request.fields.video).toBe("https://example.com/a.mp4");
    expect(request.fields.supports_streaming).toBe("true");
    expect(request.fields.photo).toBeUndefined();
    expect(request.fields.chat_id).toBe("@autovibecoding");
    expect(request.fields.caption).toBe("подпись");
  });

  it("картинка едет как sendPhoto, без video", () => {
    const request = sendFields({
      chatId: "-100500",
      fileUrl: "https://example.com/a.png",
      mediaType: "IMAGE",
    });
    expect(request.method).toBe("sendPhoto");
    expect(request.fields.photo).toBe("https://example.com/a.png");
    expect(request.fields.video).toBeUndefined();
    expect(request.fields.caption).toBeUndefined();
  });

  it("подпись длиннее лимита обрезается, а не роняет публикацию", () => {
    const long = "я".repeat(CAPTION_LIMIT + 50);
    expect(trimCaption(long)).toHaveLength(CAPTION_LIMIT);
    expect(trimCaption(long).endsWith("…")).toBe(true);
    expect(trimCaption("коротко")).toBe("коротко");
  });
});

describe("дверь Telegram: ответ и ссылка", () => {
  it("складывает ссылку на пост публичного канала", () => {
    expect(permalinkOf({ username: "autovibecoding" }, 42)).toBe("https://t.me/autovibecoding/42");
    expect(permalinkOf({ username: "@autovibecoding" }, 42)).toBe("https://t.me/autovibecoding/42");
  });

  it("у приватного чата публичной ссылки нет", () => {
    expect(permalinkOf({}, 42)).toBeNull();
    expect(permalinkOf(undefined, 42)).toBeNull();
  });

  it("читает номер сообщения и ссылку", () => {
    expect(
      parseSendResult({
        ok: true,
        result: { message_id: 7, chat: { username: "autovibecoding" } },
      }),
    ).toEqual({ messageId: "7", permalink: "https://t.me/autovibecoding/7" });
  });

  it("ответ без ok считается ошибкой", () => {
    expect(() =>
      parseSendResult({ ok: false, description: "Bad Request: chat not found" }),
    ).toThrow(/chat not found/);
  });

  it("ответ без message_id не выдаётся за публикацию", () => {
    expect(() => parseSendResult({ ok: true, result: {} })).toThrow(/без message_id/);
  });
});

describe("дверь Telegram: ошибки и токен", () => {
  it("читает описание с кодом", () => {
    expect(
      telegramError({ ok: false, error_code: 400, description: "Bad Request: wrong file" }, 400),
    ).toBe("Telegram API 400: Bad Request: wrong file");
  });

  it("не придумывает текст, когда тела нет", () => {
    expect(telegramError({}, 502)).toBe("Telegram API HTTP 502");
  });

  it("вырезает токен из текста ошибки", () => {
    const token = "123456:AA-secret";
    expect(withoutToken(`fetch failed for /bot${token}/sendVideo`, token)).toBe(
      "fetch failed for /bot<токен>/sendVideo",
    );
    expect(withoutToken("просто ошибка", "")).toBe("просто ошибка");
  });
});

describe("двери в командной строке", () => {
  it("по умолчанию материал едет в обе двери", () => {
    expect(parseChannels(undefined)).toEqual(["instagram", "telegram"]);
    expect(parseChannels("all")).toEqual([...CHANNELS]);
  });

  it("понимает одну дверь и список", () => {
    expect(parseChannels("telegram")).toEqual(["telegram"]);
    expect(parseChannels("Instagram")).toEqual(["instagram"]);
    expect(parseChannels("telegram,instagram,telegram")).toEqual(["telegram", "instagram"]);
  });

  it("не пропускает выдуманную дверь", () => {
    expect(() => parseChannels("tiktok")).toThrow(/не понял дверь/);
  });

  it("собирает план команды целиком", () => {
    const plan = parseArgs(["out/reel.mp4", "подпись", "--to", "telegram", "--prod"]);
    expect(plan.filePath).toBe("out/reel.mp4");
    expect(plan.caption).toBe("подпись");
    expect(plan.channels).toEqual(["telegram"]);
    expect(plan.mediaType).toBe("REELS");
    expect(plan.contentType).toBe("video/mp4");
    expect(plan.prod).toBe(true);
  });

  it("картинка требует картиночного файла", () => {
    expect(() => parseArgs(["out/reel.mp4", "подпись", "--type", "image"])).toThrow(/--type image/);
  });

  it("значение флага не путается с именем файла", () => {
    const plan = parseArgs(["--to", "instagram", "out/post.png", "подпись", "--type", "image"]);
    expect(plan.filePath).toBe("out/post.png");
    expect(plan.channels).toEqual(["instagram"]);
    expect(plan.mediaType).toBe("IMAGE");
  });
});
