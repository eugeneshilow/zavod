"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, ExternalLink, Eye } from "lucide-react";
import { STATUS_LABEL, type CabinetRow, type RowStatus } from "@/lib/cabinet";
import { ReelThumb } from "./reel-thumb";

const CHIP: Record<RowStatus, string> = {
  live: "bg-accent text-accent-foreground",
  rendering: "bg-warning text-black",
  queued: "bg-white/90 text-black",
  ready: "bg-white/90 text-black",
  publishing: "bg-warning text-black",
  failed: "bg-danger text-white",
  cancelled: "bg-white/80 text-black",
  deleted: "bg-white/80 text-black",
};

const DATE = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
});

/** Карточка ролика: вертикальное превью, статус поверх, под ним название и цифры. */
export function ReelCard({ row, index }: { row: CabinetRow; index: number }) {
  const dim = row.status === "deleted" || row.status === "cancelled";
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.04 }}
      className={`group flex flex-col gap-2 ${dim ? "opacity-60" : ""}`}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <ReelThumb
          src={row.videoUrl}
          live={row.status === "live"}
          className="aspect-[9/16] w-full rounded-2xl"
        />
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${CHIP[row.status]}`}
        >
          {STATUS_LABEL[row.status]}
        </span>
        <span className="absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {row.permalink ? (
            <a
              href={row.permalink}
              target="_blank"
              rel="noreferrer"
              aria-label="Открыть пост"
              className="rounded-full bg-white/90 p-1.5 text-black"
            >
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          {row.videoUrl ? (
            <a
              href={row.videoUrl}
              download
              aria-label="Скачать ролик"
              className="rounded-full bg-white/90 p-1.5 text-black"
            >
              <Download className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </span>
      </div>
      <div className="min-w-0 px-1">
        {row.orderHref ? (
          <Link href={row.orderHref} className="line-clamp-2 text-sm font-medium hover:underline">
            {row.title}
          </Link>
        ) : (
          <p className="line-clamp-2 text-sm font-medium">{row.title}</p>
        )}
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
          {row.at ? DATE.format(new Date(row.at)) : null}
          {row.views !== null ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" aria-hidden />
              {new Intl.NumberFormat("ru-RU").format(row.views)}
            </span>
          ) : null}
        </p>
      </div>
    </motion.article>
  );
}
