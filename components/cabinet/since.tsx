"use client";

import { useEffect, useState } from "react";

/** «0:42», «3:05», «1 ч 4 мин» от момента `at`; тикает раз в секунду после монтирования. */
export function sinceWord(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s >= 3600) return `${Math.floor(s / 3600)} ч ${Math.floor((s % 3600) / 60)} мин`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Since({ at, className }: { at: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`tabular-nums ${className ?? ""}`} suppressHydrationWarning>
      {sinceWord(now - at)}
    </span>
  );
}
