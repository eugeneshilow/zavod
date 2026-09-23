import { Card, Chip } from "@heroui/react";
import { ORDER_STEPS, REEL_PARTS } from "@/lib/cabinet";

/** Правая колонка экрана заказа: что получится и что происходит после нажатия. */
export function OrderPreview() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Header>
          <Card.Title>Что получится</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex gap-4">
            <div
              className="flex h-[176px] w-[100px] shrink-0 flex-col justify-between rounded-2xl p-2.5"
              style={{ background: "#063B3B" }}
              aria-hidden
            >
              <span className="h-2 w-3/5 rounded bg-[#B6F5E7]" />
              <span className="rounded-md bg-[#00BFA6] px-2 py-1.5 text-xs font-semibold text-[#063B3B]">
                258 тыс
              </span>
              <span className="flex flex-col gap-1">
                <span className="h-1.5 w-11/12 rounded bg-white" />
                <span className="h-1.5 w-8/12 rounded bg-white" />
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {REEL_PARTS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>После нажатия</Card.Title>
        </Card.Header>
        <Card.Content>
          <ol className="flex flex-col divide-y divide-border">
            {ORDER_STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3 py-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent-soft-foreground">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{s.title}</span>
                  <span className="block text-xs text-muted">{s.note}</span>
                </span>
                {s.time ? <span className="text-xs text-muted">{s.time}</span> : null}
              </li>
            ))}
          </ol>
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            На главной строка идёт по статусам:
            <Chip size="sm" variant="secondary" color="default">
              в очереди
            </Chip>
            <Chip size="sm" variant="soft" color="warning">
              рендерится
            </Chip>
            <Chip size="sm" variant="soft" color="success">
              в эфире
            </Chip>
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
