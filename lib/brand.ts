// Модуль-переносчик канона логотипа (Spec-Driven: эталон — docs/brand/logo.md,
// поверка — tests/brand.test.ts). Единственный дом чисел знака и написания:
// компонент Logo, favicon (app/icon.svg) и экран /admin/brand/logo берут
// геометрию отсюда и своих чисел не знают. Расхождение кода с каноном — баг кода.

/** Слово завода: строчными, одним словом, без точки. */
export const WORD = "zavod";

/** Цвета логотипа: жёлтый круга — тот же, что круг героя витрины. */
export const YELLOW = "#F5B700";
export const INK = "#000000";
export const PAPER = "#FFFFFF";

/**
 * Знак: жёлтый круг и чёрная геометрическая «z» из трёх штрихов. Числа — в
 * юнитах квадрата 1024 (таблица «Числа знака» канона). Буква строится из
 * прямых, не из шрифта, поэтому favicon и знак на странице совпадают до
 * пикселя и не зависят от загрузки Inter.
 */
export const MARK = {
  /** сторона квадрата знака, юниты */
  size: 1024,
  /** буква: левый край, правый край, верх, низ — юниты */
  left: 296,
  right: 728,
  top: 296,
  bottom: 728,
  /** толщина горизонтальных штрихов, юниты */
  stroke: 96,
  /** горизонтальный сдвиг кромок диагонали, юниты: даёт толщину диагонали ≈ штриху */
  diagonal: 152,
} as const;

/** Написание рядом со знаком: доли кегля слова. */
export const LOCKUP = {
  /** диаметр знака в кеглях слова */
  markPerEm: 1.25,
  /** зазор между знаком и словом в кеглях слова */
  gapPerEm: 0.45,
  /** разрядка слова, em */
  tracking: 0.05,
  /** вес Inter */
  weight: 700,
} as const;

/** Охранное поле вокруг логотипа: доля диаметра знака с каждой стороны. */
export const CLEAR_SPACE = 0.5;

/** Меньше — не ставить, px. */
export const MIN_SIZE = { mark: 16, word: 12 } as const;

/** Путь буквы «z»: верхний штрих, диагональ из правого верха в левый низ, нижний штрих. */
export function letterPath(): string {
  const { left: l, right: r, top: t, bottom: b, stroke: s, diagonal: d } = MARK;
  const topEdge = t + s; // низ верхнего штриха
  const bottomEdge = b - s; // верх нижнего штриха
  return [
    `M ${l} ${t}`,
    `H ${r}`,
    `V ${topEdge}`,
    `L ${l + d} ${bottomEdge}`,
    `H ${r}`,
    `V ${b}`,
    `H ${l}`,
    `V ${bottomEdge}`,
    `L ${r - d} ${topEdge}`,
    `H ${l}`,
    "Z",
  ].join(" ");
}

export type MarkVariant = "color" | "mono";

/**
 * SVG знака строкой: цветной (жёлтый круг, чёрная буква) или одноцветный
 * (чёрный круг, белая буква — для печати и мест, где жёлтого нет).
 * Тот же текст лежит в app/icon.svg: favicon — копия, тест сверяет.
 */
export function markSvg(variant: MarkVariant = "color"): string {
  const { size } = MARK;
  const half = size / 2;
  const circle = variant === "color" ? YELLOW : INK;
  const letter = variant === "color" ? INK : PAPER;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${WORD}">` +
    `<circle cx="${half}" cy="${half}" r="${half}" fill="${circle}"/>` +
    `<path d="${letterPath()}" fill="${letter}"/>` +
    `</svg>\n`
  );
}
