import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Схема рельсы публикации в Instagram. Устройство зоны, гейты и края —
// docs/publish.md. Имена: data_cooked_* — то, что готовила машина;
// data_raw_* — факты, как их отдал внешний мир; ops_* — состояние работы.

export default defineSchema({
  // Очередь публикации: approved -> posting -> posted атомарным claim воркера.
  // Держит и ролики, и картинки (поле mediaType). Источник файла — публичный
  // адрес либо хранилище Convex (ровно один из двух, проверяет постановка).
  data_cooked_instagram_reels: defineTable({
    caption: v.string(),
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
    .index("by_status_scheduled", ["status", "scheduledAt"])
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
