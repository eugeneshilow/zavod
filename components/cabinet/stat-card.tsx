import { Card, Chip } from "@heroui/react";

/** Карточка показателя — блок 4 канона: подпись, число, чип рядом. */
export function StatCard({
  label,
  value,
  chip,
  note,
}: {
  label: string;
  value: string;
  chip?: string | null;
  note?: string | null;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Description>{label}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
          {chip ? (
            <Chip color="success" variant="soft" size="sm">
              {chip}
            </Chip>
          ) : null}
          {note ? <span className="text-xs text-muted">{note}</span> : null}
        </div>
      </Card.Content>
    </Card>
  );
}
