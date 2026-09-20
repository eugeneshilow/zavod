import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";
import {
  MAX_ATTEMPTS,
  MAX_QUEUE_AGE_MS,
  isStaleForPosting,
  planAfterFailure,
  videoSourceOf,
} from "../services/reels_queue";

// Очередь публикации: ролики и картинки, две двери — Instagram и Telegram
// (поле channel). Правила (XOR источника, гейт свежести, повтор после сбоя)
// живут чистыми функциями в services/reels_queue.ts — здесь только работа с
// базой. Канон зоны — docs/publish.md.

const DEFAULT_ACCOUNT = "autovibecoding";

const mediaTypeValidator = v.union(v.literal("REELS"), v.literal("IMAGE"));

const channelValidator = v.union(v.literal("instagram"), v.literal("telegram"));

/** Строка без поля channel написана до второй двери — это Instagram. */
const DEFAULT_CHANNEL = "instagram" as const;

const queueCountsValidator = v.object({
  approved: v.number(),
  posting: v.number(),
  posted: v.number(),
  failed: v.number(),
  skipped: v.number(),
});

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("approved"),
  v.literal("posting"),
  v.literal("posted"),
  v.literal("failed"),
  v.literal("skipped"),
);

/** Поставить материал в очередь. Файл задаётся ровно одним источником. */
export const enqueue = internalMutation({
  args: {
    caption: v.string(),
    channel: v.optional(channelValidator),
    mediaType: v.optional(mediaTypeValidator),
    videoUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    status: statusValidator,
    scheduledAt: v.optional(v.number()),
    account: v.optional(v.string()),
  },
  returns: v.id("data_cooked_instagram_reels"),
  handler: async (ctx, args) => {
    const source = videoSourceOf({ videoUrl: args.videoUrl, storageId: args.storageId });
    return await ctx.db.insert("data_cooked_instagram_reels", {
      caption: args.caption,
      channel: args.channel ?? DEFAULT_CHANNEL,
      mediaType: args.mediaType ?? "REELS",
      videoUrl: source.kind === "url" ? source.videoUrl : undefined,
      storageId: source.kind === "storage" ? args.storageId : undefined,
      status: args.status,
      scheduledAt: args.scheduledAt,
      attempts: 0,
      account: args.account ?? DEFAULT_ACCOUNT,
      createdAt: Date.now(),
    });
  },
});

/**
 * Тонкая постановка в очередь из хранилища — вход рельсы для CLI.
 * Проверяет, что файл на месте, и не даёт положить тот же файл дважды в одну
 * дверь: потерянный ответ и повтор команды не должны родить второй пост.
 * В разные двери один файл встаёт двумя строками — это и есть кросспостинг.
 */
export const enqueueFromStorage = internalMutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.string(),
    channel: v.optional(channelValidator),
    mediaType: v.optional(mediaTypeValidator),
    scheduledAt: v.optional(v.number()),
    account: v.optional(v.string()),
  },
  returns: v.object({
    id: v.id("data_cooked_instagram_reels"),
    channel: channelValidator,
    scheduledAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const file = await ctx.storage.getUrl(args.storageId);
    if (!file) throw new Error("storageId не найден в хранилище");

    const channel = args.channel ?? DEFAULT_CHANNEL;
    const existing = await ctx.db.query("data_cooked_instagram_reels").collect();
    const duplicate = existing.find(
      (row) =>
        row.storageId === args.storageId &&
        (row.channel ?? DEFAULT_CHANNEL) === channel &&
        ["draft", "approved", "posting", "posted"].includes(row.status),
    );
    if (duplicate) {
      throw new Error(
        `этот файл уже в очереди или в эфире двери ${channel}: ${duplicate._id} (status=${duplicate.status}) — повтор не создан`,
      );
    }

    const scheduledAt = args.scheduledAt ?? Date.now();
    const id = await ctx.db.insert("data_cooked_instagram_reels", {
      caption: args.caption,
      channel,
      mediaType: args.mediaType ?? "REELS",
      storageId: args.storageId,
      status: "approved",
      scheduledAt,
      attempts: 0,
      account: args.account ?? DEFAULT_ACCOUNT,
      createdAt: Date.now(),
    });
    return { id, channel, scheduledAt };
  },
});

/**
 * Разовая миграция: проставить channel строкам, написанным до второй двери.
 * Индекс по каналу не видит строку без поля, поэтому старая очередь без этой
 * команды остановилась бы. Человек запускает её один раз:
 * npx convex run tables/data_cooked_instagram_reels:backfillChannel '{}' --prod
 */
export const backfillChannel = internalMutation({
  args: {},
  returns: v.object({ patched: v.number(), total: v.number() }),
  handler: async (ctx) => {
    const rows = await ctx.db.query("data_cooked_instagram_reels").collect();
    let patched = 0;
    for (const row of rows) {
      if (row.channel === undefined) {
        await ctx.db.patch(row._id, { channel: DEFAULT_CHANNEL });
        patched += 1;
      }
    }
    return { patched, total: rows.length };
  },
});

/**
 * Атомарно забрать самый старый созревший approved своей двери. Протухшее
 * уводится в skipped до claim и роняет одну общую запись в ops_alerts.
 * Дверь берёт только свои строки: индекс by_channel_status_scheduled не видит
 * строку без поля channel — старую очередь чинит backfillChannel.
 */
export const claimNext = internalMutation({
  args: {
    now: v.number(),
    channel: v.optional(channelValidator),
    account: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const account = args.account ?? DEFAULT_ACCOUNT;
    const channel = args.channel ?? DEFAULT_CHANNEL;
    const approved = await ctx.db
      .query("data_cooked_instagram_reels")
      .withIndex("by_channel_status_scheduled", (q) =>
        q.eq("channel", channel).eq("status", "approved"),
      )
      .collect();
    const due = approved
      .filter((reel) => reel.account === account && (reel.scheduledAt ?? 0) <= args.now)
      .sort((a, b) => a.createdAt - b.createdAt);

    const staleHours = Math.round(MAX_QUEUE_AGE_MS / 3_600_000);
    let skippedStale = 0;
    let next = null;
    for (const reel of due) {
      // Свежесть считается от плановой даты, не от постановки: очередь на
      // несколько дней вперёд не должна протухать по дороге.
      const freshnessFrom = Math.max(reel.createdAt, reel.scheduledAt ?? 0);
      if (!isStaleForPosting(freshnessFrom, args.now)) {
        next = reel;
        break;
      }
      await ctx.db.patch(reel._id, {
        status: "skipped",
        error: `гейт свежести: пролежал в очереди дольше ${staleHours} ч — ролик протух`,
      });
      skippedStale += 1;
    }

    if (skippedStale > 0) {
      await ctx.db.insert("ops_alerts", {
        kind: "instagram_queue_stale",
        message: `Очередь двери ${channel} протухла («${account}»): ${skippedStale} approved-роликов старше ${staleHours} ч уведены в skipped`,
        at: Date.now(),
      });
    }
    if (!next) return null;

    await ctx.db.patch(next._id, { status: "posting" });
    return next;
  },
});

export const markPosted = internalMutation({
  args: {
    id: v.id("data_cooked_instagram_reels"),
    mediaId: v.string(),
    permalink: v.optional(v.union(v.string(), v.null())),
    postedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "posted",
      mediaId: args.mediaId,
      permalink: args.permalink ?? undefined,
      postedAt: args.postedAt,
      error: undefined,
    });
    return null;
  },
});

/**
 * Неудачная публикация. Первая и вторая возвращают ролик в очередь со сдвигом
 * плана на два часа; третья гасит его в failed и зажигает тревогу.
 */
export const markFailed = internalMutation({
  args: { id: v.id("data_cooked_instagram_reels"), error: v.string() },
  returns: v.object({ status: statusValidator, attempts: v.number(), alerted: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    const plan = planAfterFailure({
      attemptsBefore: existing?.attempts ?? 0,
      now: Date.now(),
      scheduledAt: existing?.scheduledAt,
    });

    if (plan.status === "approved") {
      await ctx.db.patch(args.id, {
        status: "approved",
        attempts: plan.attempts,
        scheduledAt: plan.scheduledAt,
        error: `попытка ${plan.attempts} из ${MAX_ATTEMPTS}: ${args.error}`,
      });
      return { status: "approved" as const, attempts: plan.attempts, alerted: false };
    }

    await ctx.db.patch(args.id, {
      status: "failed",
      attempts: plan.attempts,
      error: args.error,
    });
    await ctx.db.insert("ops_alerts", {
      kind: "instagram_post_failed",
      message: `Ролик не опубликован после ${plan.attempts} попыток: ${args.error}`,
      context: { id: args.id },
      at: Date.now(),
    });
    return { status: "failed" as const, attempts: plan.attempts, alerted: true };
  },
});

export const setStatus = internalMutation({
  args: { id: v.id("data_cooked_instagram_reels"), status: statusValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

/**
 * Вне очереди: перенести плановое время строк на «сейчас», не меняя статус.
 * Следующий тик крона (или ручной runQueue) заберёт их первыми по createdAt.
 * Берёт только approved: posted/failed/skipped не трогает. Команда для
 * человека — docs/publish.md «Вне очереди».
 */
export const publishNow = internalMutation({
  args: { ids: v.array(v.id("data_cooked_instagram_reels")), now: v.optional(v.number()) },
  returns: v.object({ moved: v.number(), skipped: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    let moved = 0;
    const skipped: string[] = [];
    for (const id of args.ids) {
      const reel = await ctx.db.get(id);
      if (!reel || reel.status !== "approved") {
        skipped.push(`${id}: ${reel ? reel.status : "нет строки"}`);
        continue;
      }
      await ctx.db.patch(id, { scheduledAt: now });
      moved += 1;
    }
    return { moved, skipped };
  },
});

/** Последние элементы всех статусов — блок «Очередь» на /admin. */
export const listForAdmin = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const limit = Math.min(Math.max(args.limit ?? 15, 1), 100);
    return await ctx.db
      .query("data_cooked_instagram_reels")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});

/**
 * Счётчики очереди и время последнего прогона — для /api/reels/health.
 * queue — вся очередь целиком (на неё смотрит сторож reels-alive),
 * byChannel — та же очередь в разрезе двух дверей.
 */
export const health = query({
  args: { token: v.string() },
  returns: v.object({
    queue: queueCountsValidator,
    byChannel: v.object({ instagram: queueCountsValidator, telegram: queueCountsValidator }),
    lastRunAt: v.union(v.number(), v.null()),
    cronsEnabled: v.boolean(),
  }),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const rows = await ctx.db.query("data_cooked_instagram_reels").collect();
    const counts = (subset: typeof rows) => {
      const count = (status: string) => subset.filter((row) => row.status === status).length;
      return {
        approved: count("approved"),
        posting: count("posting"),
        posted: count("posted"),
        failed: count("failed"),
        skipped: count("skipped"),
      };
    };
    const ofChannel = (channel: "instagram" | "telegram") =>
      rows.filter((row) => (row.channel ?? DEFAULT_CHANNEL) === channel);
    const state = await ctx.db.query("ops_instagram_state").first();
    return {
      queue: counts(rows),
      byChannel: {
        instagram: counts(ofChannel("instagram")),
        telegram: counts(ofChannel("telegram")),
      },
      lastRunAt: state?.lastRunAt ?? null,
      cronsEnabled: process.env.INSTAGRAM_CRONS_ENABLED === "true",
    };
  },
});
