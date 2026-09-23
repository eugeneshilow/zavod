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

export type RowStatus = "live" | "rendering" | "queued" | "failed" | "deleted";

export const STATUS_LABEL: Record<RowStatus, string> = {
  live: "в эфире",
  rendering: "рендерится",
  queued: "в очереди",
  failed: "ошибка",
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
};

export type CabinetData = {
  customer: typeof DEMO_CUSTOMER;
  now: number;
  stats: { live: number; views7d: number | null; queued: number; total: number };
  week: { posts7d: number; postsToday: number };
  days: { key: string; label: string; count: number }[];
  top: { title: string; views: number }[];
  rows: CabinetRow[];
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
  const text = line ?? "Ролик";
  return text.length > 70 ? `${text.slice(0, 69).trimEnd()}…` : text;
}

function ideaStatus(idea: Idea): RowStatus {
  if (idea.status === "failed") return "failed";
  if (idea.status === "taken" && (idea.phase === "story" || idea.phase === "render"))
    return "rendering";
  return "queued";
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
    };
  };
  const pending = input.ideas
    .filter((idea) => !idea.posted)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map<CabinetRow>((idea) => ({
      id: idea.id,
      title: reelTitle(idea.storyTitle, idea.text),
      source: ideaHost(idea.text) ?? "идея",
      status: ideaStatus(idea),
      views: null,
      at: idea.phaseAt ?? idea.takenAt ?? idea.createdAt,
      permalink: null,
      videoUrl: idea.videoUrl,
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
  };
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

/** Голоса рассказчика: имя для покупателя и параметр `voice` истории (docs/reels.md). */
export const VOICES = [
  {
    id: "ermil",
    name: "Ермил",
    note: "голос канала, спокойный",
    voice: "yandex:ermil:good",
    isDefault: true,
  },
  {
    id: "alexander",
    name: "Александр",
    note: "ниже, деловой",
    voice: "yandex:alexander:good",
    isDefault: false,
  },
  {
    id: "alena",
    name: "Алёна",
    note: "женский, тёплый",
    voice: "yandex:alena:good",
    isDefault: false,
  },
] as const;

/** Куда выложить: двери публикации словами покупателя, площадка по имени не зовётся. */
export const DESTINATIONS = [
  { id: "reels", label: "Площадка коротких видео, канал завода", on: true },
  { id: "telegram", label: "Telegram", on: true },
  { id: "download", label: "Только скачать", on: false },
] as const;

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
