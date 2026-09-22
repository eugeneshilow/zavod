// Модуль-переносчик канона сетки витрины (Spec-Driven: эталон —
// docs/brand/layout.md, поверка — tests/layout.test.ts). Единственный дом
// чисел раскладки страницы «/»: ширина полосы, поля, колонки, зазоры, ритм
// секций. Блоки витрины берут классы отсюда и своих чисел не знают; накладка
// сетки и режим «числа» атласа читают те же числа.

/** Полоса контента и поля по краям, px — полоса героя, по ней стоят все блоки:
 * внутри полей ровно 1280 (сетка героя). Tailwind: max-w-[1376px] · px-8 · md:px-12. */
export const BAND = {
  /** ширина полосы с полями, px (max-w-[1376px]); внутри полей — 1280 */
  width: 1376,
  /** поля на мобиле, px (px-8) */
  edgeMobile: 32,
  /** поля от md, px (md:px-12) */
  edgeDesktop: 48,
} as const;

/** Колонки внутри полосы: двенадцать, зазор gap-6. */
export const COLUMNS = {
  count: 12,
  /** зазор между колонками, px (gap-6) */
  gutter: 24,
} as const;

/** Вертикальный ритм секций, px. Tailwind: py-20 · md:py-28. */
export const RHYTHM = {
  sectionMobile: 80,
  sectionDesktop: 112,
} as const;

/** Шапка-пилюля: плавает над страницей на той же полосе; отступ сверху top-4, высота пилюли. */
export const NAVBAR = {
  top: 16,
  height: 56,
} as const;

/** Классы блоков: секция и полоса. Блок пишет их отсюда, не строкой руками. */
export const SECTION_CLASS = "bg-background py-20 md:py-28";
export const BAND_CLASS = "mx-auto w-full max-w-[1376px] px-8 md:px-12";
/** Полоса шапки: те же поля снаружи пилюли, чтобы её края встали на V1 и V2. */
export const NAVBAR_BAND_CLASS = "mx-auto w-full";

/** Ширина одной колонки при полной полосе на десктопе, px. */
export function columnWidth(): number {
  const inner = BAND.width - BAND.edgeDesktop * 2;
  return (inner - COLUMNS.gutter * (COLUMNS.count - 1)) / COLUMNS.count;
}

/**
 * Оси накладки: две вертикальные по внутренним краям полосы (края героя,
 * шапки, футера и всех блоков) и одна горизонтальная по низу шапки. Больше
 * линий нет — так решил владелец 22.09.
 */
export const AXES = {
  V1: "левый край полосы",
  V2: "правый край полосы",
  /** низ шапки-пилюли, px от верха окна */
  H1: NAVBAR.top + NAVBAR.height,
} as const;

/** Положение вертикальных осей на экране заданной ширины, px от левого края. */
export function axisX(viewport: number): { V1: number; V2: number } {
  const band = Math.min(BAND.width, viewport);
  const edge = viewport >= 768 ? BAND.edgeDesktop : BAND.edgeMobile;
  const left = (viewport - band) / 2 + edge;
  return { V1: left, V2: viewport - left };
}
