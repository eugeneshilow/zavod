import Link from "next/link";
import { Button, Card, Chip } from "@heroui/react";
import { Download, ExternalLink } from "lucide-react";
import { moscow } from "@/lib/reels";
import { fmt, STATUS_LABEL, type CabinetRow, type RowStatus } from "@/lib/cabinet";

const CHIP: Record<
  RowStatus,
  { color: "success" | "warning" | "default" | "danger"; variant: "soft" | "secondary" }
> = {
  live: { color: "success", variant: "soft" },
  rendering: { color: "warning", variant: "soft" },
  queued: { color: "default", variant: "secondary" },
  ready: { color: "success", variant: "secondary" },
  publishing: { color: "warning", variant: "secondary" },
  failed: { color: "danger", variant: "soft" },
  deleted: { color: "default", variant: "secondary" },
};

/** Таблица роликов — блок 6 канона. */
export function ReelsTable({ rows, title = "Все ролики" }: { rows: CabinetRow[]; title?: string }) {
  return (
    <Card>
      <Card.Header className="flex-row items-center gap-2">
        <Card.Title>{title}</Card.Title>
        <span className="rounded-md bg-surface-secondary px-1.5 text-xs text-muted">
          {rows.length}
        </span>
      </Card.Header>
      <Card.Content>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">Роликов пока нет. Нажмите «Сделать ролик».</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-2 font-normal">Ролик</th>
                <th className="pb-2 font-normal">Статус</th>
                <th className="pb-2 text-right font-normal">Просмотры</th>
                <th className="pb-2 text-right font-normal">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-9 w-6 shrink-0 rounded-md ${row.status === "live" ? "bg-accent" : "border border-border bg-surface-secondary"}`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        {row.orderHref ? (
                          <Link
                            href={row.orderHref}
                            className="block truncate font-medium hover:underline"
                          >
                            {row.title}
                          </Link>
                        ) : (
                          <p className="truncate font-medium">{row.title}</p>
                        )}
                        <p className="text-xs text-muted">
                          {row.source} · {moscow(row.at)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <Chip
                      color={CHIP[row.status].color}
                      variant={CHIP[row.status].variant}
                      size="sm"
                    >
                      {STATUS_LABEL[row.status]}
                    </Chip>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{fmt(row.views)}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex gap-1">
                      {row.permalink ? (
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Открыть ролик">
                          <a href={row.permalink} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" aria-hidden />
                          </a>
                        </Button>
                      ) : null}
                      {row.videoUrl ? (
                        <Button variant="ghost" size="sm" isIconOnly aria-label="Скачать ролик">
                          <a href={row.videoUrl} download>
                            <Download className="size-4" aria-hidden />
                          </a>
                        </Button>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card.Content>
    </Card>
  );
}
