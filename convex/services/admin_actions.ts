import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireAdminToken } from "./admin_gate";

// Кнопки «сейчас» экрана сети (/admin/social/<сеть>): те же тики, что у
// кронов, только по клику и за пропуском ADMIN_API_TOKEN. Канон —
// docs/social/README.md, «Кнопки руками».

export const runQueueNow = action({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    await ctx.runAction(internal.workflows.instagram_publishing.runQueue, {});
    return null;
  },
});

export const collectMetricsNow = action({
  args: { token: v.string(), account: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    await ctx.runAction(internal.workflows.instagram_publishing.collectMetrics, {
      account: args.account,
    });
    return null;
  },
});
