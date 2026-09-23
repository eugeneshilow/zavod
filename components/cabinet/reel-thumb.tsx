"use client";

import { useRef } from "react";

/**
 * Превью ролика: первый кадр видео, при наведении ролик играет без звука.
 * Видео нет — ровная плашка цвета статуса.
 */
export function ReelThumb({
  src,
  live,
  className = "h-12 w-7 rounded-md",
}: {
  src: string | null;
  live: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  if (!src)
    return (
      <span
        className={`${className} block shrink-0 ${live ? "bg-accent" : "border border-border bg-surface-secondary"}`}
        aria-hidden
      />
    );
  return (
    <video
      ref={ref}
      src={`${src}#t=0.5`}
      muted
      playsInline
      preload="metadata"
      loop
      onMouseEnter={() => void ref.current?.play().catch(() => {})}
      onMouseLeave={() => {
        const v = ref.current;
        if (!v) return;
        v.pause();
        v.currentTime = 0.5;
      }}
      className={`${className} shrink-0 bg-black object-cover`}
      aria-hidden
    />
  );
}
