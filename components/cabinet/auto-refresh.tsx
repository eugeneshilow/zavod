"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Пока заказ в пути — экран переспрашивает сервер сам, без ручного обновления. */
export function AutoRefresh({ everyMs, active }: { everyMs: number; active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [active, everyMs, router]);
  return null;
}
