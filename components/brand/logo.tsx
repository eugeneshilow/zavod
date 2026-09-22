import { WORD, horizontalSrc, logoFile } from "@/lib/brand";
import { cn } from "@/lib/utils";

// Логотип завода: файлы набора владельца (docs/brand/logo.md), пути — из
// переносчика lib/brand.ts. Единственный компонент, которым логотип стоит на
// поверхностях: шапка и футер витрины (primary), хедер админки (inverse).
// SVG набора — контуры без шрифтов, поэтому надпись одинакова везде.

/** Полный логотип: лента и надпись. Высота в px, ширина по пропорции файла. */
export function Logo({
  height = 28,
  variant = "primary",
  className,
}: {
  height?: number;
  variant?: "primary" | "inverse" | "black" | "white";
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={horizontalSrc(variant)}
      alt={WORD}
      height={height}
      width={Math.round((height * 1312) / 390)}
      className={cn("block h-auto w-auto shrink-0", className)}
      style={{ height }}
    />
  );
}

/** Отдельный знак: лента без надписи. */
export function Mark({
  size = 24,
  variant = "primary",
  className,
}: {
  size?: number;
  variant?: "primary" | "inverse";
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoFile(`mark-${variant}-svg`).path}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
