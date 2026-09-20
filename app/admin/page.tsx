import { decisions, deployInfo, lastCheck, readDoc, renderMarkdown } from "@/lib/docs";
import { loadReelsBoard } from "@/lib/reels";
import ReelsBoard from "./reels-board";

export const dynamic = "force-dynamic";

export default async function Admin() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16">
        <p>закрыто: задай ADMIN_PASSWORD</p>
      </main>
    );
  }
  const [readme, journal, check, board] = await Promise.all([
    readDoc("README.md"),
    readDoc("journal.md"),
    lastCheck(),
    loadReelsBoard(),
  ]);
  const deploy = deployInfo();
  const list = decisions(journal);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <ReelsBoard board={board} />
      <section className="grid gap-2 rounded border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
        <div>
          <div className="text-zinc-500">Проверка</div>
          <div data-testid="check-status">
            {check
              ? `${check.status === "green" ? "зелёная" : "красная"} · ${check.at} · ${Math.round(check.durationMs / 1000)} с`
              : "ещё не запускалась"}
          </div>
        </div>
        <div>
          <div className="text-zinc-500">Коммит</div>
          <div>{deploy.commit}</div>
        </div>
        <div>
          <div className="text-zinc-500">Продакшен</div>
          <div>{deploy.url}</div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Решения</h2>
        <ul data-testid="decisions" className="list-disc space-y-1 pl-5">
          {list.map((d) => (
            <li key={d.name}>
              <span className="text-zinc-500">{d.date}</span> · <code>{d.name}</code> · {d.title}
            </li>
          ))}
        </ul>
      </section>
      <article
        className="prose prose-zinc max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
      />
      <article
        className="prose prose-zinc max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(journal) }}
      />
    </main>
  );
}
