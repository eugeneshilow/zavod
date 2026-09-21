import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Лоток идей: владелец кладёт мысль с экрана сети, раннер завода на маке
// забирает самую старую и делает из неё ролик. Функции публичные, но за
// пропуском ADMIN_API_TOKEN: их зовёт и экран админки, и раннер с мака.
// Канон зоны — docs/social/instagram.md, «Лоток идей».

const MAX_TEXT = 2000;

const ideaValidator = v.object({
  id: v.id("ops_reel_ideas"),
  text: v.string(),
  createdAt: v.number(),
  status: v.union(v.literal("new"), v.literal("taken"), v.literal("done"), v.literal("failed")),
  account: v.string(),
  takenAt: v.union(v.number(), v.null()),
  doneAt: v.union(v.number(), v.null()),
  storyId: v.union(v.string(), v.null()),
  note: v.union(v.string(), v.null()),
  permalink: v.union(v.string(), v.null()),
});

function shape(row: Doc<"ops_reel_ideas">) {
  return {
    id: row._id,
    text: row.text,
    createdAt: row.createdAt,
    status: row.status,
    account: row.account,
    takenAt: row.takenAt ?? null,
    doneAt: row.doneAt ?? null,
    storyId: row.storyId ?? null,
    note: row.note ?? null,
    permalink: row.permalink ?? null,
  };
}

/** Положить идею в лоток: кнопка на /admin/social/instagram. */
export const add = mutation({
  args: { token: v.string(), text: v.string(), account: v.optional(v.string()) },
  returns: v.id("ops_reel_ideas"),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const text = args.text.trim();
    if (text.length === 0) throw new Error("идея пустая");
    if (text.length > MAX_TEXT) throw new Error(`идея длиннее ${MAX_TEXT} символов`);
    return await ctx.db.insert("ops_reel_ideas", {
      text,
      createdAt: Date.now(),
      status: "new",
      account: args.account ?? "ruvibecoding",
    });
  },
});

/** Последние идеи лотка — список под кнопкой на экране сети. */
export const listForAdmin = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  returns: v.array(ideaValidator),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const rows = await ctx.db
      .query("ops_reel_ideas")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
    return rows.map(shape);
  },
});

/** Раннер берёт самую старую идею: new -> taken. Лоток пуст — null. */
export const takeNext = mutation({
  args: { token: v.string(), worker: v.string() },
  returns: v.union(ideaValidator, v.null()),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db
      .query("ops_reel_ideas")
      .withIndex("by_status_created", (q) => q.eq("status", "new"))
      .order("asc")
      .first();
    if (!row) return null;
    const takenAt = Date.now();
    await ctx.db.patch(row._id, { status: "taken", takenAt, note: args.worker });
    return shape({ ...row, status: "taken", takenAt, note: args.worker });
  },
});

/** Ролик уехал: taken -> done, с адресом поста, если он уже известен. */
export const finish = mutation({
  args: {
    token: v.string(),
    id: v.id("ops_reel_ideas"),
    storyId: v.optional(v.string()),
    permalink: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id в лотке нет");
    await ctx.db.patch(args.id, {
      status: "done",
      doneAt: Date.now(),
      storyId: args.storyId ?? row.storyId,
      permalink: args.permalink ?? row.permalink,
      note: args.note ?? row.note,
    });
    return null;
  },
});

/** Ролик не вышел: taken -> failed с причиной, её видно на экране. */
export const fail = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas"), note: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id в лотке нет");
    await ctx.db.patch(args.id, { status: "failed", note: args.note.trim() || "без причины" });
    return null;
  },
});
