import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { mutation, query, type MutationCtx } from "../_generated/server";
import { requireAdminToken } from "../services/admin_gate";

// Идеи роликов: владелец кладёт мысль с экрана сети, кнопкой отправляет её в
// работу, раннер завода на маке делает из неё ролик. Функции публичные, но за
// пропуском ADMIN_API_TOKEN: их зовёт и экран админки, и раннер с мака.
// Канон зоны — docs/social/instagram.md, «Идеи».

const MAX_TEXT = 2000;

/** Неделя: за неё считается «потрачено» в подвале таблицы идей. */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Дольше этого идея в работе не висит: раннер умер — она вернётся с причиной. */
export const STALE_MS = 2 * 60 * 60 * 1000;
export const STALE_NOTE = "зависла в работе больше двух часов";

/** Строки очереди, которые ещё можно отменить: вышедшее в эфир не трогаем. */
const CANCELLABLE = ["approved", "draft"];

/**
 * Идея зависла: раннер взял её в работу и не вернулся. Время считается от
 * момента, когда её взяли; поля нет — от появления в списке.
 */
export function isStale(
  row: { status: string; takenAt?: number | null; createdAt: number },
  now: number,
  olderThanMs: number,
): boolean {
  if (row.status !== "taken") return false;
  const since = row.takenAt ?? row.createdAt;
  return now - since >= olderThanMs;
}

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("new"),
  v.literal("taken"),
  v.literal("done"),
  v.literal("failed"),
);

const phaseValidator = v.union(v.literal("story"), v.literal("render"), v.literal("publish"));

const writerValidator = v.object({
  model: v.string(),
  inputTokens: v.number(),
  outputTokens: v.number(),
  costUsd: v.number(),
  ms: v.number(),
});

const voiceValidator = v.object({ model: v.string(), chars: v.number(), costUsd: v.number() });

const ideaValidator = v.object({
  id: v.id("ops_reel_ideas"),
  text: v.string(),
  createdAt: v.number(),
  status: statusValidator,
  account: v.string(),
  takenAt: v.union(v.number(), v.null()),
  doneAt: v.union(v.number(), v.null()),
  storyId: v.union(v.string(), v.null()),
  note: v.union(v.string(), v.null()),
  permalink: v.union(v.string(), v.null()),
  phase: v.union(phaseValidator, v.null()),
  phaseAt: v.union(v.number(), v.null()),
  storyTitle: v.union(v.string(), v.null()),
  storyWords: v.union(v.number(), v.null()),
  storyBeats: v.union(v.number(), v.null()),
  videoSeconds: v.union(v.number(), v.null()),
  writer: v.union(writerValidator, v.null()),
  voice: v.union(voiceValidator, v.null()),
  totalCostUsd: v.union(v.number(), v.null()),
  elapsedMs: v.union(v.number(), v.null()),
  queueIds: v.array(v.string()),
  error: v.union(v.string(), v.null()),
});

/** Та же идея плюс то, что известно о ней из очереди публикации и хранилища. */
const ideaWithQueueValidator = v.object({
  ...ideaValidator.fields,
  /** Готовый ролик прямо из хранилища Convex; ссылки нет — файл не сохранён. */
  videoUrl: v.union(v.string(), v.null()),
  /** Ролик уже вышел: одна из строк очереди в статусе posted. */
  posted: v.boolean(),
  /** Медиа вышедшего ролика: по нему строка эфира узнаёт свою идею. */
  postedMediaId: v.union(v.string(), v.null()),
  /** Сколько строк очереди ещё ждут выхода — столько дверей у ролика. */
  queueCount: v.number(),
  /** Когда эти строки собираются выйти: самое раннее плановое время. */
  queueAt: v.union(v.number(), v.null()),
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
    phase: row.phase ?? null,
    phaseAt: row.phaseAt ?? null,
    storyTitle: row.storyTitle ?? null,
    storyWords: row.storyWords ?? null,
    storyBeats: row.storyBeats ?? null,
    videoSeconds: row.videoSeconds ?? null,
    writer: row.writer ?? null,
    voice: row.voice ?? null,
    totalCostUsd: row.totalCostUsd ?? null,
    elapsedMs: row.elapsedMs ?? null,
    queueIds: row.queueIds ?? [],
    error: row.error ?? null,
  };
}

/** Положить идею: кнопка «Добавить» на /admin/social/instagram. */
export const add = mutation({
  args: { token: v.string(), text: v.string(), account: v.optional(v.string()) },
  returns: v.id("ops_reel_ideas"),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const text = args.text.trim();
    if (text.length === 0) throw new Error("идея пустая");
    if (text.length > MAX_TEXT) throw new Error(`идея длиннее ${MAX_TEXT} символов`);
    // Идея рождается ждущей выбора: раннер берёт только те, что владелец
    // отправил в работу кнопкой (⚖️ ideas-table-before-airtime).
    return await ctx.db.insert("ops_reel_ideas", {
      text,
      createdAt: Date.now(),
      status: "pending",
      account: args.account ?? "ruvibecoding",
    });
  },
});

/** Одна идея по id: раннер перечитывает её перед каждой фазой. */
export const get = query({
  args: { token: v.string(), id: v.id("ops_reel_ideas") },
  returns: v.union(ideaValidator, v.null()),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    return row ? shape(row) : null;
  },
});

/** Последние идеи — верхняя таблица экрана сети. */
export const listForAdmin = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  returns: v.array(ideaWithQueueValidator),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);
    const rows = await ctx.db
      .query("ops_reel_ideas")
      .withIndex("by_created")
      .order("desc")
      .take(limit);

    const out = [];
    for (const row of rows) {
      let posted = false;
      let postedMediaId: string | null = null;
      let queueCount = 0;
      let queueAt: number | null = null;
      for (const raw of row.queueIds ?? []) {
        const id = ctx.db.normalizeId("data_cooked_instagram_reels", raw);
        if (!id) continue;
        const queued = await ctx.db.get(id);
        if (!queued) continue;
        if (queued.status === "posted") {
          posted = true;
          postedMediaId = queued.mediaId ?? postedMediaId;
          continue;
        }
        if (!CANCELLABLE.includes(queued.status) && queued.status !== "posting") continue;
        queueCount += 1;
        const at = queued.scheduledAt ?? queued.createdAt;
        queueAt = queueAt === null ? at : Math.min(queueAt, at);
      }
      out.push({
        ...shape(row),
        videoUrl: row.storageId ? await ctx.storage.getUrl(row.storageId) : null,
        posted,
        postedMediaId,
        queueCount,
        queueAt,
      });
    }
    return out;
  },
});

/** Сколько стоили ролики за семь дней — подвал таблицы идей. */
export const weeklyCost = query({
  args: { token: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const since = Date.now() - WEEK_MS;
    const rows = await ctx.db
      .query("ops_reel_ideas")
      .withIndex("by_created", (q) => q.gte("createdAt", since))
      .collect();
    return rows.reduce((sum, row) => sum + (row.totalCostUsd ?? 0), 0);
  },
});

/** Раннер берёт самую старую идею в работе: new -> taken. Нечего брать — null. */
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
    await ctx.db.patch(row._id, { status: "taken", takenAt, note: args.worker, error: undefined });
    return shape({ ...row, status: "taken", takenAt, note: args.worker, error: undefined });
  },
});

/** Кнопка «В работу»: pending|failed -> new, след прошлой неудачи стирается. */
export const start = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    if (row.status !== "pending" && row.status !== "failed") {
      throw new Error(
        `в работу идёт идея, которая ждёт выбора или не вышла, а эта — ${row.status}`,
      );
    }
    await ctx.db.patch(args.id, {
      status: "new",
      error: undefined,
      phase: undefined,
      phaseAt: undefined,
    });
    return null;
  },
});

/** Кнопка «Убрать»: строка уходит совсем. Работающую идею убрать нельзя. */
export const remove = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    if (row.status === "taken" || row.status === "done") {
      throw new Error(`идею в статусе ${row.status} не убирают: сперва остановите или снимите её`);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Кнопка «Остановить»: taken -> failed. Раннер перечитывает строку перед
 * каждой фазой и, увидев не taken, прекращает работу сам.
 */
export const stop = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    if (row.status !== "taken")
      throw new Error(`останавливают идею в работе, а эта — ${row.status}`);
    await ctx.db.patch(args.id, { status: "failed", error: "остановлено руками" });
    return null;
  },
});

/** Строки очереди этой идеи — в failed с причиной; вышедшее в эфир не трогаем. */
async function cancelQueue(ctx: MutationCtx, ids: string[], error: string): Promise<number> {
  if (ids.length === 0) return 0;
  return await ctx.runMutation(internal.tables.data_cooked_instagram_reels.cancelByIds, {
    ids,
    error,
  });
}

/** Кнопка «Переписать»: done -> new, старый ролик снимается с очереди. */
export const rewrite = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    if (row.status !== "done") throw new Error(`переписывают готовую идею, а эта — ${row.status}`);
    await cancelQueue(ctx, row.queueIds ?? [], "переписано руками");
    await ctx.db.patch(args.id, {
      status: "new",
      error: undefined,
      phase: undefined,
      phaseAt: undefined,
      doneAt: undefined,
      storyId: undefined,
      story: undefined,
      storyTitle: undefined,
      storyWords: undefined,
      storyBeats: undefined,
      videoSeconds: undefined,
      writer: undefined,
      voice: undefined,
      totalCostUsd: undefined,
      elapsedMs: undefined,
      queueIds: undefined,
      storageId: undefined,
      permalink: undefined,
    });
    return null;
  },
});

/** Кнопка «Снять»: done -> failed, строки очереди тоже снимаются. */
export const withdraw = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    if (row.status !== "done") throw new Error(`снимают готовую идею, а эта — ${row.status}`);
    await cancelQueue(ctx, row.queueIds ?? [], "снято с эфира руками");
    await ctx.db.patch(args.id, { status: "failed", error: "снято с эфира руками" });
    return null;
  },
});

/** Раннер перешёл к следующему шагу: экран показывает фазу и её время. */
export const setPhase = mutation({
  args: { token: v.string(), id: v.id("ops_reel_ideas"), phase: phaseValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    await ctx.db.patch(args.id, { phase: args.phase, phaseAt: Date.now() });
    return null;
  },
});

/** История написана: заголовок, объём и чем она обошлась. */
export const setWriter = mutation({
  args: {
    token: v.string(),
    id: v.id("ops_reel_ideas"),
    storyTitle: v.optional(v.string()),
    storyWords: v.optional(v.number()),
    storyBeats: v.optional(v.number()),
    writer: v.optional(writerValidator),
    story: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    await ctx.db.patch(args.id, {
      storyTitle: args.storyTitle ?? row.storyTitle,
      storyWords: args.storyWords ?? row.storyWords,
      storyBeats: args.storyBeats ?? row.storyBeats,
      writer: args.writer ?? row.writer,
      story: args.story ?? row.story,
    });
    return null;
  },
});

/**
 * Идеи, застрявшие в работе дольше срока, возвращаются как «не вышло»: раннер
 * на маке мог умереть между «взял» и «готово», и без этого идея висела бы в
 * работе вечно. Зовёт сам раннер первым делом каждого тика.
 */
export const requeueStale = mutation({
  args: { token: v.string(), olderThanMs: v.optional(v.number()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const olderThanMs = args.olderThanMs ?? STALE_MS;
    const now = Date.now();
    const rows = await ctx.db
      .query("ops_reel_ideas")
      .withIndex("by_status_created", (q) => q.eq("status", "taken"))
      .collect();
    let freed = 0;
    for (const row of rows) {
      if (!isStale(row, now, olderThanMs)) continue;
      await ctx.db.patch(row._id, { status: "failed", note: STALE_NOTE, error: STALE_NOTE });
      freed += 1;
    }
    return freed;
  },
});

/** Ролик уехал: taken -> done, со следом работы — ролик, цена и строки очереди. */
export const finish = mutation({
  args: {
    token: v.string(),
    id: v.id("ops_reel_ideas"),
    storyId: v.optional(v.string()),
    story: v.optional(v.string()),
    permalink: v.optional(v.string()),
    note: v.optional(v.string()),
    voice: v.optional(voiceValidator),
    videoSeconds: v.optional(v.number()),
    totalCostUsd: v.optional(v.number()),
    elapsedMs: v.optional(v.number()),
    queueIds: v.optional(v.array(v.string())),
    storageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    await ctx.db.patch(args.id, {
      status: "done",
      doneAt: Date.now(),
      phase: undefined,
      phaseAt: undefined,
      error: undefined,
      storyId: args.storyId ?? row.storyId,
      story: args.story ?? row.story,
      permalink: args.permalink ?? row.permalink,
      note: args.note ?? row.note,
      voice: args.voice ?? row.voice,
      videoSeconds: args.videoSeconds ?? row.videoSeconds,
      totalCostUsd: args.totalCostUsd ?? row.totalCostUsd,
      elapsedMs: args.elapsedMs ?? row.elapsedMs,
      queueIds: args.queueIds ?? row.queueIds,
      storageId: (args.storageId as Id<"_storage"> | undefined) ?? row.storageId,
    });
    return null;
  },
});

/** Ролик не вышел: taken -> failed с причиной, её видно плашкой на экране. */
export const fail = mutation({
  args: {
    token: v.string(),
    id: v.id("ops_reel_ideas"),
    note: v.string(),
    story: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireAdminToken(args.token);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("идеи с таким id нет");
    const note = args.note.trim() || "без причины";
    await ctx.db.patch(args.id, {
      status: "failed",
      note,
      error: note,
      story: args.story ?? row.story,
    });
    return null;
  },
});
