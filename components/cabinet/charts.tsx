import { Card } from "@heroui/react";
import { fmt, type CabinetData } from "@/lib/cabinet";

// Графики — блок 5 канона. SVG руками: библиотеки графиков в проекте нет.

/** Столбики выпуска роликов за две недели с тремя подчислами. */
export function ReleaseBars({ data }: { data: CabinetData }) {
  const max = Math.max(1, ...data.days.map((d) => d.count));
  const w = 26;
  const gap = 10;
  const h = 120;
  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between">
        <Card.Title>Выпуск роликов</Card.Title>
        <span className="text-sm text-muted">2 недели</span>
      </Card.Header>
      <Card.Content>
        <div className="mb-4 flex gap-6 text-sm">
          <Sub value={String(data.week.posts7d)} label="за неделю" />
          <Sub value={String(data.week.postsToday)} label="за день" />
          <Sub value={String(data.stats.total)} label="всего" />
        </div>
        <svg
          viewBox={`0 0 ${data.days.length * (w + gap)} ${h + 20}`}
          className="h-[140px] w-full"
          role="img"
          aria-label="Роликов по дням за две недели"
        >
          {data.days.map((d, i) => {
            const bar = Math.round((d.count / max) * (h - 10));
            const x = i * (w + gap);
            return (
              <g key={d.key}>
                <rect
                  x={x}
                  y={h - bar}
                  width={w}
                  height={bar}
                  rx={6}
                  fill={d.count ? "var(--accent)" : "var(--surface-tertiary)"}
                />
                {!d.count ? (
                  <rect
                    x={x}
                    y={h - 4}
                    width={w}
                    height={4}
                    rx={2}
                    fill="var(--surface-tertiary)"
                  />
                ) : null}
                <text
                  x={x + w / 2}
                  y={h + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </Card.Content>
    </Card>
  );
}

function Sub({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/** Лучшие ролики по просмотрам: горизонтальные полосы. */
export function TopReels({ data }: { data: CabinetData }) {
  const max = Math.max(1, ...data.top.map((t) => t.views));
  const total = data.top.reduce((s, t) => s + t.views, 0);
  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between">
        <Card.Title>Лучшие ролики</Card.Title>
        <span className="text-sm text-muted">по просмотрам</span>
      </Card.Header>
      <Card.Content>
        <p className="text-lg font-semibold tabular-nums">{fmt(total)}</p>
        <p className="mb-4 text-xs text-muted">просмотров у пяти лучших</p>
        {data.top.length === 0 ? (
          <p className="text-sm text-muted">Пока ни одного ролика с просмотрами.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.top.map((t) => (
              <li key={t.title} className="text-sm">
                <div className="mb-1 flex justify-between gap-3">
                  <span className="truncate">{t.title}</span>
                  <span className="shrink-0 tabular-nums text-muted">{fmt(t.views)}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-tertiary">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${Math.max(3, Math.round((t.views / max) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
