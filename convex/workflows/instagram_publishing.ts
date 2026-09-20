import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction, internalMutation, type ActionCtx } from "../_generated/server";
import { sendMedia } from "../services/telegram";
import {
  getFollowersCount,
  getMediaInsights,
  getMe,
  getPublishingLimit,
  getRecentMedia,
  isPermissionError,
  publishMedia,
  refreshLongLivedToken,
  shouldRefreshToken,
} from "../services/instagram";

// Рельса автопостинга: ролики и картинки. Вход — файл в хранилище, дальше одна
// очередь data_cooked_instagram_reels с двумя дверями (Instagram и Telegram) и
// три крона: публикация, сбор цифр, продление токена Instagram. Токен
// Instagram живёт в ops_instagram_state, токен Telegram — в Convex env; наружу
// не выходит ни один. Цифры Telegram Bot API не отдаёт, крон метрик его не
// касается. Канон зоны, гейты и команды для человека — docs/publish.md.

const DAY_MS = 86_400_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function shortError(error: unknown): string {
  const message = errorMessage(error).replace(/\s+/g, " ").trim();
  return message.length > 160 ? `${message.slice(0, 157)}...` : message;
}

/** Одноразовый адрес для заливки видео в хранилище (шаг 1 публикации). */
export const generateUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Проверка связки без публикации: профиль, срок жизни токена, расход квоты.
 * npx convex run workflows/instagram_publishing:status
 */
export const status = internalAction({
  args: { account: v.optional(v.string()) },
  returns: v.object({ ok: v.boolean(), reason: v.string() }),
  handler: async (ctx, args) => {
    const state = await ctx.runQuery(internal.tables.ops_instagram_state.get, {
      account: args.account,
    });
    if (!state) {
      return { ok: false, reason: "нет токена в ops_instagram_state — сначала положите его" };
    }
    const me = await getMe(state.accessToken);
    if (!me) return { ok: false, reason: "токен невалиден или протух — нужен новый вход" };
    const limit = await getPublishingLimit(state.accessToken);
    const days = Math.max(0, Math.round((state.expiresAt - Date.now()) / DAY_MS));
    const quota = limit ? `${limit.quotaUsage} из ${limit.quotaTotal}` : "нет данных";
    return {
      ok: true,
      reason: `@${me.username} (${me.accountType ?? "?"}), токену ещё около ${days} дн., лимит ${quota}`,
    };
  },
});

type DoorRun = { posted: number; reason: string };

/** Упавшая публикация: счётчик попыток и текст для отчёта прогона. */
async function noteFailure(
  ctx: ActionCtx,
  id: Id<"data_cooked_instagram_reels">,
  error: unknown,
): Promise<DoorRun> {
  const message = errorMessage(error);
  const outcome = await ctx.runMutation(internal.tables.data_cooked_instagram_reels.markFailed, {
    id,
    error: message,
  });
  const tail =
    outcome.status === "approved"
      ? `попытка ${outcome.attempts}, вернул в очередь через два часа`
      : "третья неудача, материал погашен";
  return { posted: 0, reason: `ошибка: ${message} (${tail})` };
}

/** Дверь Instagram: тумблер канала, живой токен, квота, один материал. */
async function runInstagramDoor(ctx: ActionCtx): Promise<DoorRun> {
  const channelOn: boolean = await ctx.runQuery(internal.tables.ops_channel_toggles.isEnabled, {
    channel: "instagram",
    defaultEnabled: false,
  });
  if (!channelOn) return { posted: 0, reason: "канал на паузе (тумблер на /admin)" };

  const state = await ctx.runQuery(internal.tables.ops_instagram_state.get, {});
  if (!state) return { posted: 0, reason: "нет токена в ops_instagram_state" };

  const limit = await getPublishingLimit(state.accessToken);
  if (limit && limit.quotaUsage >= limit.quotaTotal) {
    return { posted: 0, reason: "суточная квота публикаций исчерпана" };
  }

  const next = await ctx.runMutation(internal.tables.data_cooked_instagram_reels.claimNext, {
    now: Date.now(),
    channel: "instagram",
    account: state.account,
  });
  if (!next) return { posted: 0, reason: "очередь пуста" };

  try {
    const fileUrl = next.storageId ? await ctx.storage.getUrl(next.storageId) : next.videoUrl;
    if (!fileUrl) throw new Error(`источник файла недоступен для ${next._id}`);

    const posted = await publishMedia(state.accessToken, {
      fileUrl,
      mediaType: next.mediaType ?? "REELS",
      caption: next.caption,
      isAiGenerated: true,
    });
    await ctx.runMutation(internal.tables.data_cooked_instagram_reels.markPosted, {
      id: next._id,
      mediaId: posted.mediaId,
      permalink: posted.permalink,
      postedAt: Date.now(),
    });
    return { posted: 1, reason: posted.permalink ?? posted.mediaId };
  } catch (error) {
    return await noteFailure(ctx, next._id, error);
  }
}

/**
 * Дверь Telegram: тумблер канала, оба ключа в Convex env, один материал.
 * Telegram сам выкачивает файл по адресу хранилища; токен наружу не выходит
 * даже в тексте ошибки — его вырезает withoutToken в сервисе.
 */
async function runTelegramDoor(ctx: ActionCtx): Promise<DoorRun> {
  const channelOn: boolean = await ctx.runQuery(internal.tables.ops_channel_toggles.isEnabled, {
    channel: "telegram",
    defaultEnabled: false,
  });
  if (!channelOn) return { posted: 0, reason: "канал на паузе (тумблер на /admin)" };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { posted: 0, reason: "нет TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID в Convex env" };
  }

  const next = await ctx.runMutation(internal.tables.data_cooked_instagram_reels.claimNext, {
    now: Date.now(),
    channel: "telegram",
  });
  if (!next) return { posted: 0, reason: "очередь пуста" };

  try {
    const fileUrl = next.storageId ? await ctx.storage.getUrl(next.storageId) : next.videoUrl;
    if (!fileUrl) throw new Error(`источник файла недоступен для ${next._id}`);

    const posted = await sendMedia(token, {
      chatId,
      fileUrl,
      mediaType: next.mediaType ?? "REELS",
      caption: next.caption,
    });
    await ctx.runMutation(internal.tables.data_cooked_instagram_reels.markPosted, {
      id: next._id,
      mediaId: posted.messageId,
      permalink: posted.permalink,
      postedAt: Date.now(),
    });
    return { posted: 1, reason: posted.permalink ?? `сообщение ${posted.messageId}` };
  } catch (error) {
    return await noteFailure(ctx, next._id, error);
  }
}

/**
 * Крон-воркер очереди: один тик обслуживает обе двери по очереди, сначала
 * Instagram, потом Telegram, и публикует не больше одного материала на дверь.
 * INSTAGRAM_POSTING_ENABLED — общий рубильник публикации (имя историческое):
 * выключен — молчат обе двери.
 */
export const runQueue = internalAction({
  args: {},
  returns: v.object({ posted: v.number(), reason: v.string() }),
  handler: async (ctx): Promise<{ posted: number; reason: string }> => {
    if (process.env.INSTAGRAM_POSTING_ENABLED !== "true") {
      return { posted: 0, reason: "INSTAGRAM_POSTING_ENABLED не равен true" };
    }

    // Отметка «машина жива» ставится один раз на тик, до дверей: сторож
    // смотрит на прогон очереди, а не на удачу конкретной публикации.
    await ctx.runMutation(internal.tables.ops_instagram_state.noteRun, { at: Date.now() });

    const instagram = await runInstagramDoor(ctx);
    const telegram = await runTelegramDoor(ctx);
    return {
      posted: instagram.posted + telegram.posted,
      reason: `instagram: ${instagram.reason} · telegram: ${telegram.reason}`,
    };
  },
});

/** Крон: продлевает токен, если он старше суток, ещё жив и скоро истекает. */
export const refreshToken = internalAction({
  args: {},
  returns: v.object({ refreshed: v.boolean(), reason: v.string() }),
  handler: async (ctx) => {
    const state = await ctx.runQuery(internal.tables.ops_instagram_state.get, {});
    if (!state) return { refreshed: false, reason: "нет токена" };
    if (
      !shouldRefreshToken({
        now: Date.now(),
        expiresAt: state.expiresAt,
        refreshedAt: state.refreshedAt,
      })
    ) {
      return { refreshed: false, reason: "продление не требуется" };
    }
    try {
      const next = await refreshLongLivedToken(state.accessToken);
      await ctx.runMutation(internal.tables.ops_instagram_state.set, {
        account: state.account,
        accessToken: next.accessToken,
        expiresAt: Date.now() + next.expiresInSec * 1000,
      });
      return { refreshed: true, reason: "ok" };
    } catch (error) {
      const message = errorMessage(error);
      await ctx.runMutation(internal.tables.ops_alerts.record, {
        kind: "instagram_token_refresh_failed",
        message: `Продление токена Instagram упало: ${message}`,
      });
      return { refreshed: false, reason: message };
    }
  },
});

/**
 * Крон: открывает последние медиа аккаунта и дописывает снимки Insights за
 * две недели. Ловит и ручные публикации.
 */
export const collectMetrics = internalAction({
  args: { account: v.optional(v.string()) },
  returns: v.object({
    mediaSeen: v.number(),
    snapshots: v.number(),
    skipped: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let mediaSeen = 0;
    let snapshots = 0;
    const skipped: string[] = [];

    const state = await ctx.runQuery(internal.tables.ops_instagram_state.get, {
      account: args.account,
    });
    if (!state) return { mediaSeen, snapshots, skipped: ["no_token"] };

    try {
      const recent = await getRecentMedia(state.accessToken, { limit: 25 });
      mediaSeen = recent.length;
      for (const media of recent) {
        await ctx.runMutation(internal.tables.data_raw_instagram_media.upsertFromApi, {
          account: state.account,
          ...media,
        });
      }

      const candidates = await ctx.runQuery(internal.tables.data_raw_instagram_media.listRecent, {
        account: state.account,
        sinceMs: Date.now() - 14 * DAY_MS,
      });
      let permissionFailures = 0;

      for (const media of candidates) {
        try {
          const insights = await getMediaInsights(state.accessToken, media.mediaId);
          if (!insights) {
            skipped.push(`${media.mediaId}: нет данных insights`);
            continue;
          }
          await ctx.runMutation(internal.tables.data_raw_instagram_metrics.recordSnapshot, {
            mediaRef: media._id,
            metrics: insights,
          });
          snapshots++;
        } catch (error) {
          if (isPermissionError(error)) permissionFailures++;
          skipped.push(`${media.mediaId}: ${shortError(error)}`);
        }
      }

      if (candidates.length > 0 && permissionFailures === candidates.length) {
        const reason = skipped[0] ?? "permission denied";
        await ctx.runMutation(internal.tables.ops_alerts.record, {
          kind: "instagram_metrics_failed",
          message: `Сбор Instagram Insights упал для всех медиа: ${reason}; вероятно, вход выдан без права читать статистику — нужен новый вход с этим правом`,
        });
      }
    } catch (error) {
      const reason = shortError(error);
      skipped.push(`pass: ${reason}`);
      await ctx.runMutation(internal.tables.ops_alerts.record, {
        kind: "instagram_metrics_failed",
        message: `Сбор метрик Instagram упал: ${reason}`,
      });
    }

    let followers: number | undefined;
    let quotaUsage: number | undefined;
    let quotaTotal: number | undefined;
    try {
      const value = await getFollowersCount(state.accessToken);
      if (value === null) skipped.push("account: подписчики недоступны");
      else followers = value;
    } catch (error) {
      skipped.push(`account: подписчики: ${shortError(error)}`);
    }
    const limit = await getPublishingLimit(state.accessToken);
    if (!limit) {
      skipped.push("account: квота недоступна");
    } else {
      quotaUsage = limit.quotaUsage;
      quotaTotal = limit.quotaTotal;
    }

    if (followers !== undefined || quotaUsage !== undefined) {
      await ctx.runMutation(internal.tables.ops_social_snapshots.record, {
        network: "instagram",
        followers,
        quotaUsage,
        quotaTotal,
        source: "api",
        detail: `Instagram account @${state.username ?? state.account}`,
      });
    }

    return { mediaSeen, snapshots, skipped };
  },
});
