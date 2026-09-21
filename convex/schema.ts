import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Схема рельсы публикации в Instagram. Устройство зоны, гейты и края —
// docs/publish.md. Имена: data_cooked_* — то, что готовила машина;
// data_raw_* — факты, как их отдал внешний мир; ops_* — состояние работы.

export default defineSchema({
  // Очередь публикации: approved -> posting -> posted атомарным claim воркера.
  // Одна очередь на две двери — Instagram и Telegram (поле channel). Держит и
  // ролики, и картинки (поле mediaType). Источник файла — публичный адрес либо
  // хранилище Convex (ровно один из двух, проверяет постановка).
  data_cooked_instagram_reels: defineTable({
    caption: v.string(),
    // Куда уедет строка: Instagram или Telegram. Поля нет — значит Instagram:
    // так строки, написанные до второй двери, читаются без миграции. Новые
    // строки поле пишут всегда, иначе их не видит индекс по каналу.
    channel: v.optional(v.union(v.literal("instagram"), v.literal("telegram"))),
    // Чем является файл: вертикальный ролик или одиночная картинка.
    // Поля нет — значит ролик: так старые строки читаются без миграции.
    mediaType: v.optional(v.union(v.literal("REELS"), v.literal("IMAGE"))),
    videoUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("posting"),
      v.literal("posted"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    scheduledAt: v.optional(v.number()),
    attempts: v.number(),
    account: v.string(),
    mediaId: v.optional(v.string()),
    permalink: v.optional(v.string()),
    postedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_channel_status_scheduled", ["channel", "status", "scheduledAt"])
    .index("by_created_at", ["createdAt"]),

  // Реестр медиа аккаунта: крон открывает его из GET /me/media и ловит в том
  // числе ручные публикации. Факт записывается один раз и не переписывается.
  data_raw_instagram_media: defineTable({
    account: v.string(),
    mediaId: v.string(),
    mediaType: v.optional(v.string()),
    mediaProductType: v.optional(v.string()),
    permalink: v.optional(v.string()),
    caption: v.optional(v.string()),
    postedAt: v.optional(v.number()),
    firstSeenAt: v.number(),
    // Первый сбор, в ответе которого площадка это медиа не вернула, — значит
    // его удалили. Наблюдение пишется один раз и не снимается: строка и все
    // снятые цифры остаются, ролик просто уходит в нижнюю часть эфира.
    missingSince: v.optional(v.number()),
  })
    .index("by_account_media", ["account", "mediaId"])
    .index("by_posted", ["postedAt"]),

  // Серия цифр по медиа: каждый сбор добавляет точку, старые не трогаются.
  // Иначе «почему ноль просмотров» нечем ответить — виден был бы только итог.
  data_raw_instagram_metrics: defineTable({
    mediaRef: v.id("data_raw_instagram_media"),
    capturedAt: v.number(),
    metrics: v.object({
      views: v.optional(v.number()),
      reach: v.optional(v.number()),
      likes: v.optional(v.number()),
      comments: v.optional(v.number()),
      saved: v.optional(v.number()),
      shares: v.optional(v.number()),
      totalInteractions: v.optional(v.number()),
      avgWatchTimeMs: v.optional(v.number()),
      videoViewTotalTimeMs: v.optional(v.number()),
    }),
  }).index("by_media_captured", ["mediaRef", "capturedAt"]),

  // Дом long-lived токена. Наружу значение не отдаёт ни один запрос: читают
  // только внутренние функции. Здесь же время последнего прогона очереди.
  ops_instagram_state: defineTable({
    account: v.string(),
    accessToken: v.string(),
    igUserId: v.optional(v.string()),
    username: v.optional(v.string()),
    expiresAt: v.number(),
    refreshedAt: v.number(),
    lastRunAt: v.optional(v.number()),
  }).index("by_account", ["account"]),

  // Тумблер канала: событие с причиной, только добавление. Состояние канала —
  // последнее событие; событий нет — канал выключен, машина не постит.
  ops_channel_toggles: defineTable({
    channel: v.string(),
    action: v.union(v.literal("on"), v.literal("off")),
    reason: v.string(),
    source: v.union(v.literal("admin"), v.literal("cli")),
    createdAt: v.number(),
  }).index("by_channel_created", ["channel", "createdAt"]),

  // Что сломалось: пост не ушёл, очередь протухла, продление токена упало.
  ops_alerts: defineTable({
    kind: v.string(),
    message: v.string(),
    context: v.optional(v.any()),
    at: v.number(),
  })
    .index("by_kind", ["kind"])
    .index("by_at", ["at"]),

  // Лоток идей для роликов: владелец кладёт мысль с экрана сети, раннер завода
  // на маке забирает самую старую и делает из неё ролик. Модель зовёт раннер по
  // подписке, а не Convex по ключу, — поэтому здесь только текст и статус.
  ops_reel_ideas: defineTable({
    text: v.string(),
    createdAt: v.number(),
    status: v.union(v.literal("new"), v.literal("taken"), v.literal("done"), v.literal("failed")),
    account: v.string(),
    takenAt: v.optional(v.number()),
    doneAt: v.optional(v.number()),
    storyId: v.optional(v.string()),
    note: v.optional(v.string()),
    permalink: v.optional(v.string()),
  })
    .index("by_status_created", ["status", "createdAt"])
    .index("by_created", ["createdAt"]),

  // Дневной снимок аккаунта: подписчики и расход суточного лимита.
  ops_social_snapshots: defineTable({
    network: v.string(),
    capturedAt: v.number(),
    followers: v.optional(v.number()),
    quotaUsage: v.optional(v.number()),
    quotaTotal: v.optional(v.number()),
    source: v.string(),
    detail: v.optional(v.string()),
  })
    .index("by_network_captured", ["network", "capturedAt"])
    .index("by_captured", ["capturedAt"]),
});
