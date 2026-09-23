"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell as BellIcon } from "lucide-react";
import type { CabinetEvent } from "@/lib/cabinet";

const TIME = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const TONE: Record<CabinetEvent["tone"], string> = {
  good: "bg-accent",
  wait: "bg-warning",
  bad: "bg-danger",
  off: "bg-border-tertiary",
};

/** Колокольчик: события заказов за три дня; точка — готовый ролик за сутки. */
export function Bell({ events, ring }: { events: CabinetEvent[]; ring: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ring ? "Уведомления: ролик готов" : "Уведомления"}
        aria-expanded={open}
        className="relative flex size-10 items-center justify-center rounded-full hover:bg-surface-secondary"
      >
        <BellIcon className="size-4" aria-hidden />
        {ring ? (
          <span className="absolute right-2.5 top-2.5 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
        ) : null}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-border bg-surface p-2 shadow-xl"
          >
            <p className="px-3 py-2 text-xs text-muted">Заказы за три дня</p>
            {events.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-muted">Пока тихо. Закажите ролик.</p>
            ) : (
              <ul className="flex flex-col">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-surface-secondary"
                    >
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE[e.tone]}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{e.title}</span>
                        <span className="text-xs text-muted">
                          {e.what} · {TIME.format(new Date(e.at))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
