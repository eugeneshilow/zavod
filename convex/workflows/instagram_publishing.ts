import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction, internalMutation, type ActionCtx } from "../_generated/server";
import { findMissing } from "../lib/instagram_media";
import { stateForAccount } from "../services/reels_queue";
import { sendMedia } from "../services/telegram";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  getFollowersCount,
  getMediaInsights,
  getAllMedia,
  getMe,
  getPublishingLimit,
  isPermissionError,
  oauthExchangePlan,
  publishMedia,
  refreshLongLivedToken,
  shouldRefreshToken,
} from "../services/instagram";

// Рельса автопостинга: ролики и картинки. Вход — файл в хранилище, дальше одна
// очередь data_cooked_instagram_reels с двумя дверями (Instagram и Telegram) и
// три крона: публикация, сбор цифр, продление токенов Instagram. Аккаунтов
// Instagram несколько: у каждого своя строка в ops_instagram_state, дверь берёт
// токен того аккаунта, чей материал забрала, а кроны обходят все строки. Токены
// Instagram живут в ops_instagram_state, токен Telegram — в Convex env; наружу
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
 * Обмен одноразового кода входа на долгий токен аккаунта и запись его в
 * ops_instagram_state. Код приходит из редиректа business login
 * (https://vibecoding.ru/ig-oauth?code=...); хвост «#_» Instagram дописывает
 * сам — отрезаем. Секрет приложения живёт только в Convex env и наружу не
 * выходит. Порядок шагов для человека — docs/publish.md. Запуск:
 * npx convex run workflows/instagram_publishing:exchangeCodeForToken \
 *   '{"clientId":"<APP_ID>","code":"AQ...","account":"ruvibecoding"}' --prod
 */
export const exchangeCodeForToken = internalAction({
  args: {
    clientId: v.string(),
    code: v.string(),
    redirectUri: v.optional(v.string()),
    account: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean(), reason: v.string() }),
  handler: async (ctx, args) => {
    const plan = oauthExchangePlan({
      clientSecret: process.env.INSTAGRAM_APP_SECRET,
      code: args.code,
      redirectUri: args.redirectUri,
    });
    if (!plan.ok) return { ok: false, reason: plan.reason };

    const shortLived = await exchangeCodeForShortLivedToken({
      clientId: args.clientId,
      clientSecret: plan.clientSecret,
      redirectUri: plan.redirectUri,
      code: plan.code,
    });
    const longLived = await exchangeForLongLivedToken(plan.clientSecret, shortLived.accessToken);
    const me = await getMe(longLived.accessToken);
    if (!me) return { ok: false, reason: "долгий токен не прошёл проверку профиля" };

    await ctx.runMutation(internal.tables.ops_instagram_state.set, {
      account: args.account,
      accessToken: longLived.accessToken,
      igUserId: me.id,
      username: me.username,
      expiresAt: Date.now() + longLived.expiresInSec * 1000,
    });
    return {
      ok: true,
      reason: `@${me.username} (${me.id}), токен на ${Math.round(longLived.expiresInSec / 86_400)} дней`,
    };
  },
});

/**
 * Проверка связки без публикации: профиль, срок жизни токена, расход квоты.
 * npx convex run workflows/instagram_publishing:status '{"account":"ruvibecoding"}'
 */
export const status = internalAction({
  args: { account: v.optional(v.string()) },
  returns: v.object({ ok: v.boolean(), reason: v.string() }),
  handler: async (ctx, args) => {
    const state = await ctx.runQuery(internal.tables.ops_instagram_state.get, {
      account: args.account,
    });
    if (!state) {
      return {
        ok: false,
        reason: "нет токена в ops_instagram_state — сначала exchangeCodeForToken",
      };
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

/**
 * Дверь Instagram: тумблер канала, один материал, токен того аккаунта, чей
 * материал созрел. Незакрытый замок (нет токена аккаунта, выбрана его квота)
 * возвращает строку в очередь как была: это не сбой публикации, и счётчик
 * попыток от него не растёт.
 */
async function runInstagramDoor(ctx: ActionCtx): Promise<DoorRun> {
  const channelOn: boolean = await ctx.runQuery(internal.tables.ops_channel_toggles.isEnabled, {
    channel: "instagram",
    defaultEnabled: false,
  });
  if (!channelOn) return { posted: 0, reason: "канал на паузе (тумблер на /admin)" };

  const next = await ctx.runMutation(internal.tables.data_cooked_instagram_reels.claimNext, {
    now: Date.now(),
    channel: "instagram",
  });
  if (!next) return { posted: 0, reason: "очередь пуста" };

  const putBack = async (reason: string): Promise<DoorRun> => {
    await ctx.runMutation(internal.tables.data_cooked_instagram_reels.setStatus, {
      id: next._id,
      status: "approved",
    });
    return { posted: 0, reason };
  };

  const states = await ctx.runQuery(internal.tables.ops_instagram_state.listAll, {});
  const state = stateForAccount(states, next.account);
  if (!state) {
    return await putBack(`нет токена аккаунта «${next.account}» в ops_instagram_state`);
  }

  const limit = await getPublishingLimit(state.accessToken);
  if (limit && limit.quotaUsage >= limit.quotaTotal) {
    return await putBack(`суточная квота аккаунта «${next.account}» исчерпана`);
  }

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

/**
 * Крон: обходит все аккаунты и продлевает токен там, где он старше суток, ещё
 * жив и скоро истекает. Упавший аккаунт не мешает остальным: каждая неудача
 * называет свой аккаунт и роняет свою запись в ops_alerts.
 */
export const refreshToken = internalAction({
  args: {},
  returns: v.object({ refreshed: v.number(), reason: v.string() }),
  handler: async (ctx) => {
    const states = await ctx.runQuery(internal.tables.ops_instagram_state.listAll, {});
    if (states.length === 0) return { refreshed: 0, reason: "нет ни одного аккаунта" };

    let refreshed = 0;
    const lines: string[] = [];
    for (const state of states) {
      if (
        !shouldRefreshToken({
          now: Date.now(),
          expiresAt: state.expiresAt,
          refreshedAt: state.refreshedAt,
        })
      ) {
        lines.push(`${state.account}: продление не требуется`);
        continue;
      }
      try {
        const next = await refreshLongLivedToken(state.accessToken);
        await ctx.runMutation(internal.tables.ops_instagram_state.set, {
          account: state.account,
          accessToken: next.accessToken,
          expiresAt: Date.now() + next.expiresInSec * 1000,
        });
        refreshed += 1;
        lines.push(`${state.account}: ok`);
      } catch (error) {
        const message = errorMessage(error);
        await ctx.runMutation(internal.tables.ops_alerts.record, {
          kind: "instagram_token_refresh_failed",
          message: `Продление токена Instagram упало («${state.account}»): ${message}`,
        });
        lines.push(`${state.account}: ${message}`);
      }
    }
    return { refreshed, reason: lines.join(" · ") };
  },
});

type IgState = {
  account: string;
  accessToken: string;
  username?: string;
  expiresAt: number;
  refreshedAt: number;
};

type MetricsPass = { mediaSeen: number; snapshots: number; missing: number; skipped: string[] };

/**
 * Крон: обходит все аккаунты (или один, если имя передали) и по каждому
 * дописывает снимки Insights за две недели. Ловит и ручные публикации.
 */
export const collectMetrics = internalAction({
  args: { account: v.optional(v.string()) },
  returns: v.object({
    mediaSeen: v.number(),
    snapshots: v.number(),
    missing: v.number(),
    skipped: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<MetricsPass> => {
    const states: IgState[] =
      args.account === undefined
        ? await ctx.runQuery(internal.tables.ops_instagram_state.listAll, {})
        : await ctx
            .runQuery(internal.tables.ops_instagram_state.get, { account: args.account })
            .then((state) => (state ? [state] : []));
    if (states.length === 0) {
      return { mediaSeen: 0, snapshots: 0, missing: 0, skipped: ["no_token"] };
    }

    const total: MetricsPass = { mediaSeen: 0, snapshots: 0, missing: 0, skipped: [] };
    for (const state of states) {
      const pass = await collectForAccount(ctx, state);
      total.mediaSeen += pass.mediaSeen;
      total.snapshots += pass.snapshots;
      total.missing += pass.missing;
      total.skipped.push(...pass.skipped.map((line) => `${state.account}/${line}`));
    }
    return total;
  },
});

/** Один проход по одному аккаунту: медиа, их Insights и снимок аккаунта. */
async function collectForAccount(ctx: ActionCtx, state: IgState): Promise<MetricsPass> {
  let mediaSeen = 0;
  let snapshots = 0;
  let missing = 0;
  const skipped: string[] = [];

  try {
    // Полный список эфира, а не последние 25: по нему видно и новое, и то, что
    // с площадки пропало. Удалённое помечаем, но не стираем — docs/social/instagram.md.
    const live = await getAllMedia(state.accessToken, { max: 200 });
    mediaSeen = live.length;
    for (const media of live) {
      await ctx.runMutation(internal.tables.data_raw_instagram_media.upsertFromApi, {
        account: state.account,
        ...media,
      });
    }

    const registry = await ctx.runQuery(
      internal.tables.data_raw_instagram_media.listAccountRegistry,
      { account: state.account },
    );
    const apiIds = new Set(live.map((media) => media.id));
    const gone = findMissing(registry, apiIds);
    if (live.length === 0 && registry.length > 0) {
      // Пустой ответ при непустом реестре — это похоже на сбой площадки, а не
      // на удаление всего эфира: никого не помечаем и говорим об этом вслух.
      skipped.push("pass: площадка вернула пустой список медиа — пометка удалённых пропущена");
      await ctx.runMutation(internal.tables.ops_alerts.record, {
        kind: "instagram_metrics_failed",
        message: `Instagram вернул пустой список медиа для «${state.account}» при непустом реестре: пометка удалённых пропущена`,
      });
    } else if (gone.length > 0) {
      missing = await ctx.runMutation(internal.tables.data_raw_instagram_media.markMissing, {
        ids: gone as Id<"data_raw_instagram_media">[],
        at: Date.now(),
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
        message: `Сбор Instagram Insights упал для всех медиа аккаунта «${state.account}»: ${reason}; вероятно, вход выдан без права читать статистику — нужен новый вход с этим правом`,
      });
    }
  } catch (error) {
    const reason = shortError(error);
    skipped.push(`pass: ${reason}`);
    await ctx.runMutation(internal.tables.ops_alerts.record, {
      kind: "instagram_metrics_failed",
      message: `Сбор метрик Instagram упал («${state.account}»): ${reason}`,
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
      account: state.account,
      followers,
      quotaUsage,
      quotaTotal,
      source: "api",
      detail: `Instagram account @${state.username ?? state.account}`,
    });
  }

  return { mediaSeen, snapshots, missing, skipped };
}
