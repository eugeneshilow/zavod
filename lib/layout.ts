// Модуль-переносчик канона сетки витрины (Spec-Driven: эталон —
// docs/brand/layout.md, поверка — tests/layout.test.ts). Единственный дом
// чисел раскладки страницы «/»: ширина полосы, поля, колонки, зазоры, ритм
// секций. Блоки витрины берут классы отсюда и своих чисел не знают; стекло
// /admin/brand/layout и накладка сетки на живой странице читают те же числа.

/** Полоса контента и поля по краям, px. Tailwind: max-w-6xl · px-6 · md:px-10. */
export const BAND = {
  /** ширина полосы контента, px (max-w-6xl) */
  width: 1152,
  /** поля на мобиле, px (px-6) */
  edgeMobile: 24,
  /** поля от md, px (md:px-10) */
  edgeDesktop: 40,
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

/** Исключения: два блока живут своей полосой, и это записано в каноне. */
export const EXCEPTIONS = {
  /** шапка-пилюля: полоса уже (max-w-5xl), отступ сверху top-4 */
  navbarWidth: 1024,
  navbarTop: 16,
  /** герой: во весь экран, полоса шире (max-w-7xl), поля p-8 · md:p-12 */
  heroWidth: 1280,
  heroEdgeMobile: 32,
  heroEdgeDesktop: 48,
} as const;

/** Классы блоков: секция и полоса. Блок пишет их отсюда, не строкой руками. */
export const SECTION_CLASS = "bg-background py-20 md:py-28";
export const BAND_CLASS = "mx-auto w-full max-w-6xl px-6 md:px-10";

/** Ширина одной колонки при полной полосе на десктопе, px. */
export function columnWidth(): number {
  const inner = BAND.width - BAND.edgeDesktop * 2;
  return (inner - COLUMNS.gutter * (COLUMNS.count - 1)) / COLUMNS.count;
}
