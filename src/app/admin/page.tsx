import Link from "next/link";
import { readAdminContent } from "@/lib/project";

export const dynamic = "force-dynamic";
export const metadata = { title: "Управление" };

export default async function AdminPage() {
  const { overviewHtml, journalHtml, decisions, check } =
    await readAdminContent();
  const checkedAt = check
    ? new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "Europe/Moscow",
      }).format(new Date(check.checkedAt))
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:py-16">
      <Link
        className="text-sm text-stone-600 underline underline-offset-4"
        href="/"
      >
        ← На главную
      </Link>
      <header className="mt-8 mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Управление</h1>
        <p className="mt-3 text-stone-600">
          Документы, решения и последняя проверка проекта.
        </p>
      </header>

      <section className="panel" aria-labelledby="check-title">
        <h2 id="check-title" className="section-title">
          Последняя проверка
        </h2>
        <p
          className={`mt-4 font-medium ${check?.status === "green" ? "text-emerald-800" : check?.status === "red" ? "text-red-800" : "text-stone-600"}`}
        >
          {check?.status === "green"
            ? "Зелёный — все проверки пройдены"
            : check?.status === "red"
              ? "Красный — проверка не пройдена"
              : "Нет доступного результата проверки"}
        </p>
        {check && (
          <p className="mt-2 text-sm text-stone-600">
            <time dateTime={check.checkedAt}>{checkedAt}</time> МСК
          </p>
        )}
        {check?.failedStep && (
          <p className="mt-2 text-sm">Этап: {check.failedStep}</p>
        )}
        <p className="mt-3 text-sm text-stone-600">
          Обновить: <code>pnpm check</code>, затем перезагрузить страницу.
        </p>
      </section>

      <section className="panel" aria-labelledby="decisions-title">
        <h2 id="decisions-title" className="section-title">
          Решения
        </h2>
        <ol
          aria-label="Решения из журнала"
          className="mt-5 divide-y divide-stone-200"
        >
          {decisions.map((decision) => (
            <li key={decision.anchor} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm text-stone-500">
                {decision.date} МСК · <code>{decision.name}</code>
              </p>
              <a
                className="mt-1 block font-medium underline underline-offset-4"
                href={`#${decision.anchor}`}
              >
                ⚖️ {decision.title}
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section id="overview" className="panel" aria-label="Описание проекта">
        <div
          className="document"
          dangerouslySetInnerHTML={{ __html: overviewHtml }}
        />
      </section>
      <section id="journal" className="panel" aria-label="Журнал проекта">
        <div
          className="document"
          dangerouslySetInnerHTML={{ __html: journalHtml }}
        />
      </section>
    </main>
  );
}
