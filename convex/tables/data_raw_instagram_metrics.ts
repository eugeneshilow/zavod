import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// Серия цифр по медиа: каждый сбор добавляет точку, старые не переписываются.
// Так виден ход, а не последний итог. Канон зоны — docs/publish.md.

const metricsValidator = v.object({
  views: v.optional(v.number()),
  reach: v.optional(v.number()),
  likes: v.optional(v.number()),
  comments: v.optional(v.number()),
  saved: v.optional(v.number()),
  shares: v.optional(v.number()),
  totalInteractions: v.optional(v.number()),
  avgWatchTimeMs: v.optional(v.number()),
  videoViewTotalTimeMs: v.optional(v.number()),
});

export const recordSnapshot = internalMutation({
  args: {
    mediaRef: v.id("data_raw_instagram_media"),
    metrics: metricsValidator,
  },
  returns: v.id("data_raw_instagram_metrics"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("data_raw_instagram_metrics", {
      mediaRef: args.mediaRef,
      capturedAt: Date.now(),
      metrics: args.metrics,
    });
  },
});
