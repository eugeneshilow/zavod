"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Рама админки с выключателем: полноэкранные инструменты (бренд-атлас и то,
// что он показывает в своей раме) идут без хедера и шапки — как атлас ЦУПа
// vibecoding.ru, который собирает живую страницу сам. Список голых адресов —
// здесь; остальное получает хедер, шапку-путь и полосу «вверх · вниз».

export const BARE_PATHS = new Set(["/admin/brand", "/admin/brand/lab", "/admin/brand/logo"]);

export function Frame({ chrome, children }: { chrome: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (BARE_PATHS.has(pathname)) return <>{children}</>;
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-[1640px] space-y-3 px-5 py-3">
        {chrome}
        <main className="space-y-4 pb-10">{children}</main>
      </div>
    </div>
  );
}
