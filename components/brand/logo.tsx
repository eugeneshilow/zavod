import { INK, LOCKUP, MARK, PAPER, WORD, YELLOW, letterPath, type MarkVariant } from "@/lib/brand";
import { cn } from "@/lib/utils";

// Логотип завода: знак (жёлтый круг с «z») и слово «zavod». Единственный
// компонент, которым логотип стоит на любой поверхности — шапка витрины,
// футер, хедер админки; favicon — тот же знак файлом app/icon.svg. Числа
// берутся из lib/brand.ts (канон — docs/brand/logo.md), здесь их нет.

/** Знак отдельно: размер в px, цветной или одноцветный. */
export function Mark({
  size = 24,
  variant = "color",
  className,
}: {
  size?: number;
  variant?: MarkVariant;
  className?: string;
}) {
  const half = MARK.size / 2;
  return (
    <svg
      viewBox={`0 0 ${MARK.size} ${MARK.size}`}
      width={size}
      height={size}
      role="img"
      aria-label={WORD}
      className={cn("shrink-0", className)}
    >
      <circle cx={half} cy={half} r={half} fill={variant === "color" ? YELLOW : INK} />
      <path d={letterPath()} fill={variant === "color" ? INK : PAPER} />
    </svg>
  );
}

/**
 * Знак и слово одной строкой. Кегль слова задаёт всё: диаметр знака и зазор —
 * доли кегля из LOCKUP. Цвет слова наследуется (currentColor), поэтому на
 * тёмном фоне слово белое само, а знак остаётся жёлтым.
 */
export function Logo({
  em = 18,
  variant = "color",
  word = true,
  className,
}: {
  /** кегль слова, px */
  em?: number;
  variant?: MarkVariant;
  /** false — только знак */
  word?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center font-bold", className)}
      style={{
        fontSize: em,
        gap: em * LOCKUP.gapPerEm,
        letterSpacing: `${LOCKUP.tracking}em`,
        fontWeight: LOCKUP.weight,
        lineHeight: 1,
      }}
    >
      <Mark size={em * LOCKUP.markPerEm} variant={variant} />
      {word ? <span>{WORD}</span> : null}
    </span>
  );
}
