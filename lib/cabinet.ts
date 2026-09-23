import { api } from "@/convex/_generated/api";
import { reelsAccess, type AirtimeRow } from "@/lib/reels";
import {
  attachIdeas,
  dayKey,
  ideaHost,
  splitAirtime,
  toReel,
  type Idea,
  type Reel,
} from "@/lib/social";

// Переносчик зоны кабинета: канон — docs/cabinet/README.md. Здесь живут
// список блоков экрана, демо-покупатель до входа, хост-роутинг и сборка
// чисел из тех же таблиц, что у экрана сети. Экраны только рисуют.

export const CABINET_PATH = "/cabinet";

/** Хост кабинета: `app.zavod.today`, локально `app.localhost:<порт>`. */
export function isAppHost(host: string | null | undefined): boolean {
  const name = (host ?? "").split(":")[0].toLowerCase();
  return name.startsWith("app.");
}

/** Куда переписать путь с хоста кабинета; `null` — путь уже кабинетный или служебный. */
export function cabinetRewrite(pathname: string): string | null {
  if (pathname.startsWith(CABINET_PATH)) return null;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) return null;
  return pathname === "/" ? CABINET_PATH : `${CABINET_PATH}${pathname}`;
}

export type BlockSlug = "menu" | "header" | "tabs" | "stats" | "charts" | "reels";

const SLUG_OF: Record<string, BlockSlug> = {
  Меню: "menu",
  Шапка: "header",
  Вкладки: "tabs",
  Показатели: "stats",
  Графики: "charts",
  Ролики: "reels",
};

export type CabinetBlock = { n: number; title: string; slug: BlockSlug | null };

/** Блоки первого экрана из канона: нумерованный список раздела «## Блоки». */
export function cabinetBlocks(readme: string): CabinetBlock[] {
  const lines = readme.split("\n");
  const start = lines.findIndex((l) => /^## Блоки\s*$/.test(l));
  if (start < 0) return [];
  const out: CabinetBlock[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    const m = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*/);
    if (!m) continue;
    const title = m[2].trim();
    out.push({ n: Number(m[1]), title, slug: SLUG_OF[title] ?? null });
  }
  return out;
}

/** Что собрано в коде, в порядке канона. Тест сверяет с `cabinetBlocks`. */
export const BUILT_BLOCKS: BlockSlug[] = ["menu", "header", "tabs", "stats", "charts", "reels"];

/** До входа и кассы покупатель один — демо-аккаунт завода. */
export const DEMO_CUSTOMER = {
  name: "Евгений",
  initials: "ЕШ",
  plan: "Старт",
  account: "ruvibecoding",
} as const;

export const CABINET_NAV = [
  { href: CABINET_PATH, label: "Главная", icon: "home" },
  { href: `${CABINET_PATH}/reels`, label: "Ролики", icon: "film" },
  { href: `${CABINET_PATH}/queue`, label: "Очередь", icon: "list" },
  { href: `${CABINET_PATH}/views`, label: "Просмотры", icon: "chart" },
  { href: `${CABINET_PATH}/settings`, label: "Настройки", icon: "settings" },
] as const;

export const CABINET_TABS = [
  { href: CABINET_PATH, label: "Обзор" },
  { href: `${CABINET_PATH}/reels`, label: "Ролики" },
  { href: `${CABINET_PATH}/payments`, label: "Платежи" },
] as const;

const MSK = "Europe/Moscow";
const DAY = 24 * 60 * 60 * 1000;

/** Приветствие по московскому часу: утро 5–11, день 12–17, вечер 18–22, ночь. */
export function greeting(now: number, name: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("ru-RU", { timeZone: MSK, hour: "numeric", hour12: false }).format(
      new Date(now),
    ),
  );
  const word =
    hour >= 5 && hour <= 11
      ? "Доброе утро"
      : hour >= 12 && hour <= 17
        ? "Добрый день"
        : hour >= 18 && hour <= 22
          ? "Добрый вечер"
          : "Доброй ночи";
  return `${word}, ${name}`;
}

export type RowStatus =
  "live" | "rendering" | "queued" | "ready" | "publishing" | "failed" | "cancelled" | "deleted";

export const STATUS_LABEL: Record<RowStatus, string> = {
  live: "в эфире",
  rendering: "делается",
  queued: "ждёт робота",
  ready: "собран",
  publishing: "ждёт эфира",
  failed: "ошибка",
  cancelled: "отменён",
  deleted: "снят",
};

export type CabinetRow = {
  id: string;
  title: string;
  source: string;
  status: RowStatus;
  views: number | null;
  at: number | null;
  permalink: string | null;
  videoUrl: string | null;
  /** Строка идеи или заказа: ведёт на страницу заказа с шагами. */
  orderHref: string | null;
};

export type CabinetData = {
  customer: typeof DEMO_CUSTOMER;
  now: number;
  stats: { live: number; views7d: number | null; queued: number; total: number };
  week: { posts7d: number; postsToday: number };
  days: { key: string; label: string; count: number }[];
  top: { title: string; views: number }[];
  rows: CabinetRow[];
  /** Заказы в пути — карточки сверху главной, пока ролик не в эфире. */
  active: OrderView[];
  /** Заказ готов за последние сутки — точка на колокольчике. */
  fresh: boolean;
};

/** Заголовок ролика: название сюжета, иначе первая строка подписи без ссылок и хэштегов. */
export function reelTitle(storyTitle: string | null, caption: string): string {
  const fromStory = (storyTitle ?? "").trim();
  if (fromStory) return fromStory;
  const line = caption
    .split("\n")
    .map((l) =>
      l
        .replace(/https?:\/\/\S+/g, "")
        .replace(/#\S+/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .find((l) => l.length > 0);
  return clip(line ?? "Ролик");
}

function clip(text: string): string {
  return text.length > 70 ? `${text.slice(0, 69).trimEnd()}…` : text;
}

/**
 * Заголовок идеи до сюжета: текст целиком, ссылка сжата до адреса без
 * протокола — «Сделай рилс про vibecoding.ru/models/opus-5.5», а не обрубок.
 */
export function ideaTitle(storyTitle: string | null, text: string): string {
  const fromStory = (storyTitle ?? "").trim();
  if (fromStory) return fromStory;
  const line = text
    .replace(/https?:\/\/(www\.)?(\S+?)\/?(?=\s|$)/g, (_m, _w, rest: string) =>
      rest.length > 32 ? `${rest.split("/")[0]}/…` : rest,
    )
    .replace(/\s+/g, " ")
    .trim();
  return clip(line || "Идея");
}

/** Заказ отменён кнопкой в кабинете: пометку ставит мутация `cancelOrder`. */
export const CANCELLED_MARK = "отменён покупателем";

export function isCancelled(idea: Idea): boolean {
  return (idea.error ?? "") === CANCELLED_MARK;
}

/** Отменить можно, пока ролик не вышел везде: ждёт робота, делается или ждёт эфира. */
export function isCancellable(idea: Idea): boolean {
  if (idea.status === "new" || idea.status === "pending" || idea.status === "taken") return true;
  return idea.status === "done" && idea.queueCount > 0;
}

export function ideaStatus(idea: Idea): RowStatus {
  if (isCancelled(idea)) return "cancelled";
  if (idea.status === "failed") return "failed";
  if (idea.status === "taken") return "rendering";
  if (idea.status === "done") {
    if (idea.posted) return "live";
    return idea.queueCount > 0 ? "publishing" : "ready";
  }
  return "queued";
}

export const ORDER_BASE = `${CABINET_PATH}/orders`;

// ---------------------------------------------------------------- заказ по шагам

export type StepState = "done" | "now" | "next" | "failed" | "skip";

export type OrderStep = {
  key: "accepted" | "robot" | "story" | "render" | "ready" | "air";
  title: string;
  state: StepState;
  /** Когда шаг закончился или начался — время по Москве на экране. */
  at: number | null;
  note: string;
};

export type OrderView = {
  id: string;
  href: string;
  title: string;
  text: string;
  voiceName: string | null;
  doors: string;
  wish: string | null;
  createdAt: number;
  steps: OrderStep[];
  /** Доля пройденного пути от 0 до 1 — полоса над шагами. */
  progress: number;
  /** Путь закончен: ролик в эфире, скачан-готов или ошибка — обновлять незачем. */
  final: boolean;
  failed: boolean;
  cancelled: boolean;
  cancellable: boolean;
  videoUrl: string | null;
  permalink: string | null;
  current: OrderStep | null;
};

/** Двери заказа словами покупателя. */
export function doorsWord(to: string[] | undefined): string {
  if (!to) return "площадка коротких видео и Telegram";
  if (to.length === 0) return "только скачать";
  return DESTINATIONS.filter((d) => d.door && to.includes(d.door))
    .map((d) => (d.id === "reels" ? "площадка коротких видео" : d.label))
    .join(" и ");
}

/** Шесть шагов заказа из строки идеи: чистая функция, экран только рисует. */
export function orderSteps(idea: Idea, permalink: string | null = null): OrderStep[] {
  const phase = idea.phase;
  const taken = idea.status === "taken";
  const done = idea.status === "done";
  const cancelled = isCancelled(idea);
  const failed = idea.status === "failed" && !cancelled;
  const downloadOnly = idea.order ? idea.order.to.length === 0 : false;
  const failAt: OrderStep["key"] =
    phase === "render"
      ? "render"
      : phase === "publish"
        ? "ready"
        : idea.takenAt
          ? "story"
          : "robot";
  const st = (key: OrderStep["key"], passed: boolean, now: boolean): StepState => {
    if (failed && key === failAt) return "failed";
    if (passed) return "done";
    if (cancelled) return "skip";
    if (now && !failed) return "now";
    return "next";
  };
  const afterStory = done || phase === "render" || phase === "publish";
  const afterRender = done || phase === "publish";
  const air: StepState =
    downloadOnly || (cancelled && !idea.posted)
      ? "skip"
      : idea.posted
        ? "done"
        : done && idea.queueCount > 0
          ? "now"
          : done
            ? "failed"
            : "next";
  const queueAt = idea.queueAt ? moscowTime(idea.queueAt) : null;
  return [
    { key: "accepted", title: "Заказ принят", state: "done", at: idea.createdAt, note: "" },
    {
      key: "robot",
      title: idea.status === "new" ? "Ждёт робота" : "Робот взял заказ",
      state: st("robot", idea.takenAt !== null || done, idea.status === "new"),
      at: idea.takenAt,
      note: idea.status === "new" ? "обычно меньше минуты" : "",
    },
    {
      key: "story",
      title: "Пишет сюжет",
      state: st("story", afterStory, taken && (phase === "story" || phase === null)),
      at: taken && phase === "story" ? idea.phaseAt : taken && phase === null ? idea.takenAt : null,
      note: "читает идею, пишет историю · ≈ 1 мин",
    },
    {
      key: "render",
      title: "Озвучка и монтаж",
      state: st("render", afterRender, taken && phase === "render"),
      at: taken && phase === "render" ? idea.phaseAt : null,
      note: "голос, карточки, субтитры · ≈ 4 мин",
    },
    {
      key: "ready",
      title: "Ролик готов",
      state: st("ready", done, taken && phase === "publish"),
      at: idea.doneAt ?? null,
      note: done ? "смотреть и скачать ниже" : "",
    },
    {
      key: "air",
      title: air === "now" ? "Ждёт эфира" : "В эфире",
      state: air,
      at: null,
      note:
        air === "skip"
          ? cancelled
            ? "отменено"
            : "заказан «только скачать»"
          : idea.posted
            ? permalink
              ? "пост вышел"
              : "вышел"
            : air === "now"
              ? queueAt
                ? `выйдет в ${queueAt}`
                : "ждёт своей очереди"
              : air === "failed"
                ? "в очередь публикации не встал"
                : "",
    },
  ];
}

function moscowTime(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function orderView(idea: Idea, permalink: string | null = null): OrderView {
  const steps = orderSteps(idea, permalink);
  const counted = steps.filter((s) => s.state !== "skip");
  const passed = counted.filter((s) => s.state === "done").length;
  const nowIndex = counted.findIndex((s) => s.state === "now");
  // Отменённый заказ показывает, докуда дошёл, а не пустые шаги как пройденные.
  const total = isCancelled(idea) ? steps.length : counted.length;
  const progress = Math.min(1, (passed + (nowIndex >= 0 ? 0.5 : 0)) / total);
  const failed = steps.some((s) => s.state === "failed");
  const cancelled = isCancelled(idea);
  const final = failed || cancelled || counted.every((s) => s.state === "done");
  const voiceName = idea.order
    ? (VOICES.find((v) => v.voice === idea.order?.voice)?.name ?? null)
    : null;
  return {
    id: idea.id,
    href: `${ORDER_BASE}/${idea.id}`,
    title: ideaTitle(idea.storyTitle, idea.text),
    text: idea.text,
    voiceName,
    doors: doorsWord(idea.order?.to),
    wish: idea.order?.wish ?? null,
    createdAt: idea.createdAt,
    steps,
    progress,
    final,
    failed,
    cancelled,
    cancellable: !cancelled && isCancellable(idea),
    videoUrl: idea.videoUrl,
    permalink,
    current:
      steps.find((s) => s.state === "failed") ?? steps.find((s) => s.state === "now") ?? null,
  };
}

/** Чистая сборка кабинета из строк эфира и идей; `now` — часы экрана. */
export function composeCabinet(
  input: { airtime: AirtimeRow[]; ideas: Idea[] },
  now: number,
): CabinetData {
  const air = splitAirtime(attachIdeas(input.airtime.map(toReel), input.ideas), now);
  const ideaByMedia = new Map<string, Idea>();
  for (const idea of input.ideas) if (idea.postedMediaId) ideaByMedia.set(idea.postedMediaId, idea);
  const rowOfReel = (reel: Reel, status: RowStatus): CabinetRow => {
    const idea = ideaByMedia.get(reel.mediaId) ?? null;
    return {
      id: reel.mediaId,
      title: reelTitle(idea?.storyTitle ?? null, reel.caption),
      source: (idea ? ideaHost(idea.text) : null) ?? "ролик",
      status,
      views: reel.views,
      at: reel.postedAt,
      permalink: reel.permalink,
      videoUrl: reel.videoUrl,
      orderHref: idea ? `${ORDER_BASE}/${idea.id}` : null,
    };
  };
  const pending = input.ideas
    .filter((idea) => !idea.posted)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map<CabinetRow>((idea) => ({
      id: idea.id,
      title: ideaTitle(idea.storyTitle, idea.text),
      source: ideaHost(idea.text) ?? "идея",
      status: ideaStatus(idea),
      views: null,
      at: idea.phaseAt ?? idea.takenAt ?? idea.createdAt,
      permalink: null,
      videoUrl: idea.videoUrl,
      orderHref: `${ORDER_BASE}/${idea.id}`,
    }));
  const live = [...air.reels]
    .sort((a, b) => (b.postedAt ?? 0) - (a.postedAt ?? 0))
    .map((r) => rowOfReel(r, "live"));
  const deleted = air.deleted.map((r) => rowOfReel(r, "deleted"));
  const rows = [...pending, ...live, ...deleted];
  const queued = pending.filter((r) => r.status === "queued" || r.status === "rendering").length;
  const posted = [...air.reels, ...air.deleted];
  const days = Array.from({ length: 14 }, (_, i) => {
    const ms = now - (13 - i) * DAY;
    const key = dayKey(ms);
    return {
      key,
      label: key.slice(0, 2),
      count: posted.filter((r) => r.postedAt !== null && dayKey(r.postedAt) === key).length,
    };
  });
  const today = dayKey(now);
  const orders = input.ideas.filter((idea) => idea.order);
  const active = orders
    .filter(
      (idea) =>
        idea.status === "new" ||
        idea.status === "taken" ||
        (idea.status === "done" && !idea.posted && idea.queueCount > 0) ||
        ((idea.status === "done" || idea.status === "failed") &&
          (idea.doneAt ?? idea.createdAt) >= now - 2 * 60 * 60 * 1000),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3)
    .map((idea) => orderView(idea));
  return {
    customer: DEMO_CUSTOMER,
    now,
    stats: { live: air.reels.length, views7d: air.views7d, queued, total: posted.length },
    week: {
      posts7d: posted.filter((r) => (r.postedAt ?? 0) >= now - 7 * DAY).length,
      postsToday: posted.filter((r) => r.postedAt !== null && dayKey(r.postedAt) === today).length,
    },
    days,
    top: air.reels
      .filter((r) => r.views !== null)
      .slice(0, 5)
      .map((r) => ({
        title: reelTitle(ideaByMedia.get(r.mediaId)?.storyTitle ?? null, r.caption),
        views: r.views ?? 0,
      })),
    rows,
    active,
    fresh: orders.some((idea) => idea.status === "done" && (idea.doneAt ?? 0) >= now - DAY),
  };
}

/** Один заказ со страницы заказа; нет такого — null, нет базы — причина. */
export async function loadOrder(id: string): Promise<OrderView | null | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [ideas, airtime] = await Promise.all([
      client.query(api.tables.ops_reel_ideas.listForAdmin, { token, limit: 50 }),
      client.query(api.tables.data_raw_instagram_media.listAirtimeForAdmin, {
        token,
        limit: 50,
        account: DEMO_CUSTOMER.account,
      }),
    ]);
    const idea = ideas.find((row) => row.id === id);
    if (!idea) return null;
    const permalink = idea.postedMediaId
      ? (airtime.find((row) => row.mediaId === idea.postedMediaId)?.permalink ?? null)
      : null;
    return orderView(idea, permalink);
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}

/** Данные кабинета одной функцией; без пропуска к базе — причина строкой. */
export async function loadCabinet(now = Date.now()): Promise<CabinetData | { reason: string }> {
  const access = reelsAccess();
  if ("reason" in access) return access;
  const { client, token } = access;
  try {
    const [airtime, ideas] = await Promise.all([
      client.query(api.tables.data_raw_instagram_media.listAirtimeForAdmin, {
        token,
        limit: 50,
        account: DEMO_CUSTOMER.account,
      }),
      client.query(api.tables.ops_reel_ideas.listForAdmin, { token, limit: 50 }),
    ]);
    return composeCabinet({ airtime, ideas }, now);
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}

/** «12 300» — пробел тысяч, как читает владелец. */
export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("ru-RU").format(n);
}

// Экран заказа «Сделать ролик» — раздел «Экран заказа» канона docs/cabinet/README.md.
// Слова здесь, экран только рисует; механика нажатия — следующий заход.

export const ORDER_PATH = `${CABINET_PATH}/new`;

/**
 * Голоса рассказчика: имя для покупателя и параметр `voice` истории
 * (docs/reels.md, таблица голосов). Только те, что раннер озвучивает сам;
 * тот же список держит мутация `order` (ORDER_VOICES).
 */
export const VOICES = [
  {
    id: "stanislav",
    name: "Станислав",
    note: "голос канала, глубокий и тёплый",
    voice: "eleven:ogi2DyUAKJb7CEdqqvlU",
    isDefault: true,
  },
  {
    id: "egor",
    name: "Егор",
    note: "чёткий, командный",
    voice: "eleven:6A9D8WSMm4rFsg2DWFeE",
    isDefault: false,
  },
] as const;

/**
 * Куда выложить: двери публикации словами покупателя, площадка по имени не
 * зовётся. `door` — имя двери в очереди публикации; у «только скачать» двери нет.
 */
export const DESTINATIONS = [
  { id: "reels", label: "Площадка коротких видео, канал завода", on: true, door: "instagram" },
  { id: "telegram", label: "Telegram", on: true, door: "telegram" },
  { id: "download", label: "Только скачать", on: false, door: null },
] as const;

export const MAX_IDEA = 4000;
export const MAX_WISH = 500;

export type OrderInput = { text: string; voice: string; to: string[]; wish: string };

/**
 * Форма заказа в поля мутации `order`. Пустая идея, чужой голос или длинный
 * текст — строка причины для экрана. «Только скачать» снимает все двери.
 */
export function parseOrder(form: {
  idea?: string | null;
  voice?: string | null;
  to?: string[];
  note?: string | null;
}): OrderInput | { error: string } {
  const text = (form.idea ?? "").trim();
  if (!text) return { error: "впишите идею ролика: ссылку или пару фраз" };
  if (text.length > MAX_IDEA) return { error: `идея длиннее ${MAX_IDEA} знаков` };
  const voice = VOICES.find((v) => v.id === (form.voice ?? ""))?.voice;
  if (!voice) return { error: "выберите голос рассказчика" };
  const picked = new Set(form.to ?? []);
  const to = picked.has("download")
    ? []
    : DESTINATIONS.flatMap((d) => (d.door && picked.has(d.id) ? [d.door] : []));
  const wish = (form.note ?? "").trim();
  if (wish.length > MAX_WISH) return { error: `пожелание длиннее ${MAX_WISH} знаков` };
  return { text, voice, to, wish };
}

/** Что получится: части ролика, как их называет витрина. */
export const REEL_PARTS = [
  "до 60 секунд, вертикальный",
  "закадровый голос",
  "карточки с цифрами",
  "цитаты постов",
  "субтитры слово в слово",
  "подпись к посту",
] as const;

/** Что происходит после нажатия: три шага рельсы с примерным временем. */
export const ORDER_STEPS = [
  { title: "Сюжет", note: "агент читает идею и пишет историю", time: "≈ 1 мин" },
  { title: "Голос и монтаж", note: "озвучка, карточки, субтитры", time: "≈ 4 мин" },
  { title: "Публикация", note: "двери выкладывают, ссылка появляется в таблице", time: "" },
] as const;

/** Подсказка под полем идеи: что подойдёт. */
export const IDEA_HINT = "Ссылка на новость, пост или просто мысль своими словами";
