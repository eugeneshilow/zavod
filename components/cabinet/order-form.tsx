import { Button, Card } from "@heroui/react";
import { Plus } from "lucide-react";
import { DEMO_CUSTOMER, DESTINATIONS, IDEA_HINT, VOICES } from "@/lib/cabinet";

/** Форма заказа — четыре шага по канону «Экран заказа». Нажатие пока без механики. */
export function OrderForm() {
  return (
    <form className="flex flex-col gap-4" aria-label="Заказ ролика">
      <Step n={1} title="Идея ролика">
        <input
          name="idea"
          type="text"
          placeholder="Вставьте ссылку или опишите идею"
          className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <p className="mt-2 text-xs text-muted">{IDEA_HINT}</p>
      </Step>
      <Step n={2} title="Голос рассказчика">
        <div className="grid gap-2 sm:grid-cols-3">
          {VOICES.map((v) => (
            <label
              key={v.id}
              className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border px-3 py-2.5 has-checked:border-accent has-checked:bg-accent-soft"
            >
              <input
                type="radio"
                name="voice"
                value={v.id}
                defaultChecked={v.isDefault}
                className="sr-only"
              />
              <span className="text-sm font-medium">{v.name}</span>
              <span className="text-xs text-muted">{v.note}</span>
            </label>
          ))}
        </div>
      </Step>
      <Step n={3} title="Куда выложить">
        <div className="flex flex-wrap gap-2">
          {DESTINATIONS.map((d) => (
            <label
              key={d.id}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-checked:border-accent has-checked:bg-accent-soft"
            >
              <input
                type="checkbox"
                name="to"
                value={d.id}
                defaultChecked={d.on}
                className="size-3.5 accent-[var(--accent)]"
              />
              {d.label}
            </label>
          ))}
        </div>
      </Step>
      <Step n={4} title="Пожелание" optional>
        <textarea
          name="note"
          rows={2}
          placeholder="например: сделай акцент на цифрах, без шуток"
          className="w-full rounded-xl border border-border bg-surface-secondary px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </Step>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" type="button">
          <Plus className="size-4" aria-hidden />
          Сделать ролик
        </Button>
        <span className="text-xs text-muted">
          ≈ 6 минут · 1 ролик из тарифа «{DEMO_CUSTOMER.plan}»
        </span>
      </div>
      <p className="text-xs text-muted">
        Кнопка пока не отправляет заказ: механика подключается следующим шагом стройки.
      </p>
    </form>
  );
}

function Step({
  n,
  title,
  optional,
  children,
}: {
  n: number;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Card.Header className="flex-row items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
          {n}
        </span>
        <Card.Title>{title}</Card.Title>
        {optional ? <span className="text-xs text-muted">необязательно</span> : null}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
