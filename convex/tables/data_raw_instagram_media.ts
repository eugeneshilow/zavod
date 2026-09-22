import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Реестр медиа аккаунта. Крон открывает его из API и ловит в том числе
// ручные публикации, но уже увиденный факт никогда не переписывает.
// Канон зоны — docs/publish.md.

export const upsertFromApi = internalMutation({
  args: {
    account: v.string(),
    id: v.string(),
    mediaType: v.union(v.string(), v.null()),
    mediaProductType: v.union(v.string(), v.null()),
    permalink: v.union(v.string(), v.null()),
    caption: v.union(v.string(), v.null()),
    timestamp: v.union(v.number(), v.null()),
  },
  returns: v.id("data_raw_instagram_media"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("data_raw_instagram_media")
      .withIndex("by_account_media", (q) => q.eq("account", args.account).eq("mediaId", args.id))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("data_raw_instagram_media", {
      account: args.account,
      mediaId: args.id,
      mediaType: args.mediaType ?? undefined,
      mediaProductType: args.mediaProductType ?? undefined,
      permalink: args.permalink ?? undefined,
      caption: args.caption ?? undefined,
      postedAt: args.timestamp ?? undefined,
      firstSeenAt: Date.now(),
    });
  },
});

export const listRecent = internalQuery({
  args: { account: v.string(), sinceMs: v.number() },
  returns: v.array(
    v.object({
      _id: v.id("data_raw_instagram_media"),
      _creationTime: v.number(),
      account: v.string(),
      mediaId: v.string(),
      mediaType: v.optional(v.string()),
      mediaProductType: v.optional(v.string()),
      permalink: v.optional(v.string()),
      caption: v.optional(v.string()),
      postedAt: v.optional(v.number()),
      firstSeenAt: v.number(),
      missingSince: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("data_raw_instagram_media")
      .withIndex("by_account_media", (q) => q.eq("account", args.account))
      .collect();
    // Помеченные удалёнными пропускаем: цифры по ним площадка уже не отдаёт,
    // а последний снятый снимок остаётся в серии как есть.
    return rows
      .filter((row) => row.missingSince === undefined)
      .filter((row) => row.postedAt === undefined || row.postedAt >= args.sinceMs);
  },
});

/** Весь реестр аккаунта коротким списком — сбору цифр, чтобы найти пропавших. */
export const listAccountRegistry = internalQuery({
  args: { account: v.string() },
  returns: v.array(
    v.object({
      id: v.id("data_raw_instagram_media"),
      mediaId: v.string(),
      missingSince: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("data_raw_instagram_media")
      .withIndex("by_account_media", (q) => q.eq("account", args.account))
      .collect();
    return rows.map((row) => ({
      id: row._id,
      mediaId: row.mediaId,
      missingSince: row.missingSince,
    }));
  },
});

/**
 * Пометить пропавшие с площадки. Наблюдение пишется один раз: у строки с
 * пометкой она не обновляется, строка и её цифры не трогаются вовсе.
 */
export const markMissing = internalMutation({
  args: { ids: v.array(v.id("data_raw_instagram_media")), at: v.number() },
  returns: v.number(),
  handler: async (ctx, args) => {
    let marked = 0;
    for (const id of args.ids) {
      const row = await ctx.db.get(id);
      if (!row || row.missingSince !== undefined) continue;
      await ctx.db.patch(id, { missingSince: args.at });
      marked++;
    }
    return marked;
  },
});

const DAY_MS = 86_400_000;

/**
 * Блок «Эфир» на /admin: медиа, последние цифры и прирост за 24 и 48 часов.
 * Прирост считается против ближайшего снимка старше нужной отсечки; снимка
 * нет — прироста нет, и это честнее, чем нарисовать ноль.
 */
export const listAirtimeForAdmin = query({
  args: { token: v.string(), limit: v.optional(v.number()), account: v.optional(v.string()) },
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const account = args.account;
    const media =
      account === undefined
        ? await ctx.db
            .query("data_raw_instagram_media")
            .withIndex("by_posted")
            .order("desc")
            .take(limit)
        : (
            await ctx.db
              .query("data_raw_instagram_media")
              .withIndex("by_account_media", (q) => q.eq("account", account))
              .collect()
          )
            .sort((a, b) => (b.postedAt ?? 0) - (a.postedAt ?? 0))
            .slice(0, limit);

    // Что очередь знает про это медиа: длину ролика (ffprobe при постановке) и
    // сам файл — по нему экран даёт кнопку «посмотреть». Сшивка по mediaId.
    const posted = await ctx.db.query("data_cooked_instagram_reels").collect();
    const durationByMedia = new Map<string, number>();
    const fileByMedia = new Map<string, string>();
    for (const row of posted) {
      if (!row.mediaId) continue;
      if (row.durationMs) durationByMedia.set(row.mediaId, row.durationMs);
      if (fileByMedia.has(row.mediaId)) continue;
      const file = row.videoUrl ?? (row.storageId ? await ctx.storage.getUrl(row.storageId) : null);
      if (file) fileByMedia.set(row.mediaId, file);
    }

    const now = Date.now();
    const out = [];
    for (const item of media) {
      const snapshots = await ctx.db
        .query("data_raw_instagram_metrics")
        .withIndex("by_media_captured", (q) => q.eq("mediaRef", item._id))
        .order("desc")
        .take(60);
      const latest = snapshots[0] ?? null;
      const viewsAt = (ageMs: number): number | null => {
        const older = snapshots.find((row) => row.capturedAt <= now - ageMs);
        return older?.metrics.views ?? null;
      };
      const delta = (ageMs: number): number | null => {
        const before = viewsAt(ageMs);
        const current = latest?.metrics.views;
        if (before === null || current === undefined) return null;
        return current - before;
      };
      out.push({
        mediaId: item.mediaId,
        account: item.account,
        permalink: item.permalink ?? null,
        caption: item.caption ?? null,
        postedAt: item.postedAt ?? null,
        missingSince: item.missingSince ?? null,
        durationMs: durationByMedia.get(item.mediaId) ?? null,
        videoUrl: fileByMedia.get(item.mediaId) ?? null,
        capturedAt: latest?.capturedAt ?? null,
        metrics: latest?.metrics ?? null,
        views24h: delta(DAY_MS),
        views48h: delta(2 * DAY_MS),
      });
    }
    return out;
  },
});
