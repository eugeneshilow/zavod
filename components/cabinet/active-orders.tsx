"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import type { OrderView } from "@/lib/cabinet";
import { Since } from "./since";

/** Заказы в пути — карточки сверху главной, пока ролик не в эфире. */
export function ActiveOrders({ orders }: { orders: OrderView[] }) {
  if (orders.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" aria-label="Заказы в работе">
      {orders.map((o, i) => {
        const running = !o.final;
        return (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={o.href}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border px-5 py-4 transition-colors ${
                o.failed
                  ? "border-danger/40 bg-danger/5"
                  : running
                    ? "border-warning/50 bg-warning/10"
                    : "border-accent/40 bg-accent-soft"
              }`}
            >
              <span
                className={`relative flex size-9 shrink-0 items-center justify-center rounded-full ${
                  o.failed
                    ? "bg-danger text-white"
                    : running
                      ? "bg-warning/25 text-warning"
                      : "bg-accent text-accent-foreground"
                }`}
              >
                {running ? (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-warning/30" />
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  </>
                ) : o.failed ? (
                  <X className="size-4" aria-hidden />
                ) : (
                  <Check className="size-4" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{o.title}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  {o.failed
                    ? "не вышло, откройте заказ"
                    : o.current
                      ? o.current.title.toLowerCase()
                      : o.final
                        ? "готов"
                        : "в пути"}
                  {running && o.current?.at ? (
                    <>
                      <span aria-hidden>·</span>
                      <Since at={o.current.at} />
                    </>
                  ) : null}
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
                  <motion.span
                    className={`block h-full rounded-full ${o.failed ? "bg-danger" : "bg-accent"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(o.progress * 100)}%` }}
                    transition={{ type: "spring", stiffness: 60, damping: 18 }}
                  />
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </motion.div>
        );
      })}
    </section>
  );
}
