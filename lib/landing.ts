// Витрина: порядок блоков страницы «/» читается из канона зоны
// (docs/landing/README.md, раздел «## Блоки») — то же правило зеркала, по
// которому хедер админки читает список «Хедер» из docs/admin.md. Новый блок
// или другой порядок — правка канона, а не кода.

/** Слаги блоков: якорь секции на странице и ключ её кода. */
export type BlockSlug =
  | "header"
  | "hero"
  | "problem"
  | "how"
  | "examples"
  | "inside"
  | "price"
  | "reviews"
  | "faq"
  | "cta"
  | "footer";

/** Имя блока в каноне → слаг. Незнакомое имя даёт slug null: страница честно
 * покажет, что блока с таким именем она не знает. */
const SLUG_OF: Record<string, BlockSlug> = {
  Шапка: "header",
  Герой: "hero",
  Проблема: "problem",
  "Как это работает": "how",
  Примеры: "examples",
  "Что внутри ролика": "inside",
  Цена: "price",
  Отзывы: "reviews",
  "Вопросы и ответы": "faq",
  "Финальный призыв": "cta",
  Футер: "footer",
};

export type LandingBlock = { n: number; title: string; slug: BlockSlug | null };

/**
 * Блоки витрины из канона: нумерованный список раздела «## Блоки», имя блока —
 * жирный текст в начале строки, до тире с пояснением.
 */
export function landingBlocks(readme: string): LandingBlock[] {
  const lines = readme.split("\n");
  const start = lines.findIndex((l) => /^## Блоки\s*$/.test(l));
  if (start < 0) return [];
  const out: LandingBlock[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    const m = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*/);
    if (!m) continue;
    const title = m[2].trim();
    out.push({ n: Number(m[1]), title, slug: SLUG_OF[title] ?? null });
  }
  return out;
}

/** Ролик · ролика · роликов — по числу. */
export function reelWord(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "роликов";
  const mod10 = n % 10;
  if (mod10 === 1) return "ролик";
  if (mod10 >= 2 && mod10 <= 4) return "ролика";
  return "роликов";
}

/** Что машина говорит о себе внизу героя: без цифр — что она делает сама. */
export const HERO_METRIC_FALLBACK =
  "ролики выходят сами: очередь, две двери, цифры раз в шесть часов";

/**
 * Строка метрики героя: сколько роликов в эфире и сколько просмотров они
 * набрали за неделю. Цифр нет — фолбэк, никогда не выдуманное число.
 */
export function heroMetric(reels: number, views7d: number | null): string {
  if (!reels) return HERO_METRIC_FALLBACK;
  const left = `${reels} ${reelWord(reels)} в эфире`;
  if (views7d === null) return left;
  return `${left} · ${views7d.toLocaleString("ru-RU")} просмотров за неделю`;
}
