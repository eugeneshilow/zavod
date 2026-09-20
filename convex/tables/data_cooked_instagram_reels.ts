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

// Очередь публикации: ролики и картинки. Правила (XOR источника, гейт свежести,
// повтор после сбоя) живут чистыми функциями в services/reels_queue.ts —
// здесь только работа с базой. Канон зоны — docs/publish.md.

const DEFAULT_ACCOUNT = "autovibecoding";

const mediaTypeValidator = v.union(v.literal("REELS"), v.literal("IMAGE"));

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
 * Проверяет, что файл на месте, и не даёт положить тот же файл дважды:
 * потерянный ответ и повтор команды не должны родить второй пост.
 */
export const enqueueFromStorage = internalMutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.string(),
    mediaType: v.optional(mediaTypeValidator),
    scheduledAt: v.optional(v.number()),
    account: v.optional(v.string()),
  },
  returns: v.object({ id: v.id("data_cooked_instagram_reels"), scheduledAt: v.number() }),
  handler: async (ctx, args) => {
    const file = await ctx.storage.getUrl(args.storageId);
    if (!file) throw new Error("storageId не найден в хранилище");

    const existing = await ctx.db.query("data_cooked_instagram_reels").collect();
    const duplicate = existing.find(
      (row) =>
        row.storageId === args.storageId &&
        ["draft", "approved", "posting", "posted"].includes(row.status),
    );
    if (duplicate) {
      throw new Error(
        `этот файл уже в очереди или в эфире: ${duplicate._id} (status=${duplicate.status}) — повтор не создан`,
      );
    }

    const scheduledAt = args.scheduledAt ?? Date.now();
    const id = await ctx.db.insert("data_cooked_instagram_reels", {
      caption: args.caption,
      mediaType: args.mediaType ?? "REELS",
      storageId: args.storageId,
      status: "approved",
      scheduledAt,
      attempts: 0,
      account: args.account ?? DEFAULT_ACCOUNT,
      createdAt: Date.now(),
    });
    return { id, scheduledAt };
  },
});

/**
 * Атомарно забрать самый старый созревший approved. Протухшее уводится в
 * skipped до claim и роняет одну общую запись в ops_alerts.
 */
export const claimNext = internalMutation({
  args: { now: v.number(), account: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const account = args.account ?? DEFAULT_ACCOUNT;
    const approved = await ctx.db
      .query("data_cooked_instagram_reels")
      .withIndex("by_status_scheduled", (q) => q.eq("status", "approved"))
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
        message: `Очередь Instagram протухла («${account}»): ${skippedStale} approved-роликов старше ${staleHours} ч уведены в skipped`,
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

/** Счётчики очереди и время последнего прогона — для /api/reels/health. */
export const health = query({
  args: { token: v.string() },
  returns: v.object({
    queue: v.object({
      approved: v.number(),
      posting: v.number(),
      posted: v.number(),
      failed: v.number(),
      skipped: v.number(),
    }),
    lastRunAt: v.union(v.number(), v.null()),
    cronsEnabled: v.boolean(),
  }),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const rows = await ctx.db.query("data_cooked_instagram_reels").collect();
    const count = (status: string) => rows.filter((row) => row.status === status).length;
    const state = await ctx.db.query("ops_instagram_state").first();
    return {
      queue: {
        approved: count("approved"),
        posting: count("posting"),
        posted: count("posted"),
        failed: count("failed"),
        skipped: count("skipped"),
      },
      lastRunAt: state?.lastRunAt ?? null,
      cronsEnabled: process.env.INSTAGRAM_CRONS_ENABLED === "true",
    };
  },
});
