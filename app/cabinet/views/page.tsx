import { Card } from "@heroui/react";
import { Header } from "../_components/shell";
import { StatCard } from "@/components/cabinet/stat-card";
import { ReelThumb } from "@/components/cabinet/reel-thumb";
import { fmt, loadCabinet } from "@/lib/cabinet";

export const dynamic = "force-dynamic";

// Экран «Просмотры»: ролики в эфире по просмотрам и прирост за сутки.
// Цифры площадка отдаёт с задержкой, сбор — раз в час. Канон —
// docs/cabinet/README.md, «Просмотры».

export default async function CabinetViews() {
  const data = await loadCabinet();
  if ("reason" in data) {
    return (
      <>
        <Header title="Просмотры" />
        <p className="text-sm text-muted">Данные не пришли: {data.reason}.</p>
      </>
    );
  }
  const live = data.rows
    .filter((r) => r.status === "live")
    .sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
  const max = Math.max(1, ...live.map((r) => r.views ?? 0));
  const day = live.reduce((s, r) => s + Math.max(0, r.delta24 ?? 0), 0);
  const all = live.reduce((s, r) => s + (r.views ?? 0), 0);
  return (
    <>
      <Header title="Просмотры" ring={data.fresh} events={data.events} />
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Итоги">
        <StatCard label="Всего просмотров" value={fmt(all)} />
        <StatCard label="За неделю" value={fmt(data.stats.views7d)} />
        <StatCard label="За сутки" value={fmt(day)} chip={day ? `+${fmt(day)}` : null} />
        <StatCard label="Роликов в эфире" value={fmt(live.length)} />
      </section>
      <Card>
        <Card.Header>
          <Card.Title>По роликам</Card.Title>
          <Card.Description>
            Площадка отдаёт цифры с задержкой, обновляем раз в час
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {live.length === 0 ? (
            <p className="text-sm text-muted">В эфире пока ничего нет.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {live.map((r) => (
                <li key={r.id} className="flex items-center gap-4 py-3">
                  <ReelThumb src={r.videoUrl} live />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <div className="mt-1.5 h-2 rounded-full bg-surface-tertiary">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{
                          width: `${Math.max(2, Math.round(((r.views ?? 0) / max) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-semibold tabular-nums">{fmt(r.views)}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {r.delta24 ? `+${fmt(r.delta24)} за сутки` : "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card.Content>
      </Card>
    </>
  );
}
