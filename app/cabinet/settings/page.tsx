import { cookies } from "next/headers";
import { Avatar, Card } from "@heroui/react";
import { Header } from "../_components/shell";
import { savePrefs } from "./actions";
import { DEMO_CUSTOMER, DESTINATIONS, parsePrefs, PREFS_COOKIE, VOICES } from "@/lib/cabinet";
import { loadAccountPayments, tariffLine, tariffOf } from "@/lib/payments";

// Экран «Настройки»: профиль и то, с чем открывается форма заказа. Канон —
// docs/cabinet/README.md, «Настройки».

export default async function CabinetSettings({ searchParams }: PageProps<"/cabinet/settings">) {
  const params = await searchParams;
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  const payments = await loadAccountPayments(DEMO_CUSTOMER.account);
  const plan = "reason" in payments ? null : tariffLine(tariffOf(payments));
  return (
    <>
      <Header title="Настройки" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <Card.Header>
            <Card.Title>Профиль</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center gap-4">
              <Avatar size="lg" color="accent" variant="soft">
                <Avatar.Fallback>{DEMO_CUSTOMER.initials}</Avatar.Fallback>
              </Avatar>
              <div>
                <p className="font-medium">{DEMO_CUSTOMER.name}</p>
                {plan ? <p className="text-sm text-muted">{plan}</p> : null}
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted">Канал</dt>
              <dd>канал завода, площадка коротких видео и Telegram</dd>
              <dt className="text-muted">Вход</dt>
              <dd>по паролю, вход по почте появится позже</dd>
            </dl>
          </Card.Content>
        </Card>
        <Card>
          <Card.Header>
            <Card.Title>Заказ по умолчанию</Card.Title>
            <Card.Description>С этим откроется форма «Сделать ролик»</Card.Description>
          </Card.Header>
          <Card.Content>
            <form action={savePrefs} className="flex flex-col gap-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Голос рассказчика</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {VOICES.map((v) => (
                    <label
                      key={v.id}
                      className="flex cursor-pointer flex-col gap-0.5 rounded-xl border border-border px-3 py-2.5 has-checked:border-accent has-checked:bg-accent-soft"
                    >
                      <input
                        type="radio"
                        name="voice"
                        value={v.id}
                        defaultChecked={v.id === prefs.voice}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="text-xs text-muted">{v.note}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Куда выкладывать</legend>
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
                        defaultChecked={prefs.to.includes(d.id)}
                        className="size-3.5 accent-[var(--accent)]"
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
                >
                  Сохранить
                </button>
                {params.saved ? <span className="text-sm text-accent">Сохранено</span> : null}
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
    </>
  );
}
