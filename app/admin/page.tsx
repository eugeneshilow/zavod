import Link from "next/link";
import { decisions, deployInfo, lastCheck, navTree, projectSentence, readDoc } from "@/lib/docs";
import { loadReelsBoard, moscow, num, type ReelsBoardData } from "@/lib/reels";
import { Card } from "./_components/card";
import { SectionLabel } from "./_components/shell";

export const dynamic = "force-dynamic";

// /admin — executive summary завода одним взглядом: что это, пульс публикации
// и эфира, проверка и продакшен, двери в зоны, решения. Подробности живут
// на экранах зон (/admin/<зона>), сюда — только то, что читается с порога.
// Канон — docs/admin.md.

function queueLine(board: ReelsBoardData): string {
  const count = (status: string) => board.queue.filter((row) => row.status === status).length;
  return `ждёт ${count("approved") + count("draft")} · публикуется ${count("posting")} · в эфире ${count("posted")} · не уехало ${count("failed")}`;
}

function doorsLine(board: ReelsBoardData): string {
  const word = (name: "instagram" | "telegram") =>
    board.channels[name]?.action === "on" ? "включён" : "на паузе";
  return `двери: Instagram ${word("instagram")} · Telegram ${word("telegram")}`;
}

export default async function Admin() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <section className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        Закрыто: задай ADMIN_PASSWORD в файле с ключами — docs/deploy.md, «Где живут ключи».
      </section>
    );
  }
  const [readme, journal, check, board, tree] = await Promise.all([
    readDoc("README.md"),
    readDoc("journal.md"),
    lastCheck(),
    loadReelsBoard(),
    navTree(),
  ]);
  const deploy = deployInfo();
  const list = decisions(journal);
  const live = "reason" in board ? null : board;
  const lastAir = live?.airtime[0];
  const failed = live ? live.queue.some((row) => row.status === "failed") : false;

  return (
    <>
      <section className="space-y-2">
        <SectionLabel id="exec">EXECUTIVE SUMMARY — завод одним взглядом</SectionLabel>
        <p className="max-w-3xl text-sm leading-6 text-zinc-700">{projectSentence(readme)}</p>
        <div className="grid gap-3 lg:grid-cols-3">
          <Card
            title="Публикация"
            href="/admin/publish"
            accent={failed || (live?.alerts.length ?? 0) > 0}
            lines={
              live
                ? [queueLine(live), doorsLine(live)]
                : [`рельса не отвечает: ${(board as { reason: string }).reason}`]
            }
            code="data_cooked_instagram_reels · ops_channel_toggles"
          />
          <Card
            title="Эфир Instagram"
            href="/admin/publish#airtime"
            lines={
              live
                ? [
                    `подписчиков ${num(live.account?.followers)} · квота за сутки ${num(live.account?.quotaUsage)} из ${num(live.account?.quotaTotal)}`,
                    lastAir
                      ? `последний пост ${moscow(lastAir.postedAt)} · просмотров ${num(lastAir.metrics?.views)}`
                      : "в эфире пока ничего нет",
                  ]
                : ["цифры появятся вместе с рельсой"]
            }
            code="data_raw_instagram_media · ops_social_snapshots"
          />
          <Card
            title="Проверка и продакшен"
            href="/admin/deploy"
            accent={check?.status === "red"}
            lines={[
              check
                ? `проверка ${check.status === "green" ? "зелёная" : "красная"} · ${check.at} · ${Math.round(check.durationMs / 1000)} с`
                : "проверка ещё не запускалась",
              `коммит ${deploy.commit} · ${deploy.url}`,
            ]}
            code=".check-result.json · Vercel env"
          />
        </div>
      </section>

      <section className="space-y-2">
        <SectionLabel id="zones">
          ЗОНЫ — карточка = дверь в зону, её адрес = адрес канона
        </SectionLabel>
        <div className="grid gap-3 lg:grid-cols-4">
          {(tree.children ?? []).map((zone) => (
            <Card
              key={zone.href}
              title={zone.label}
              href={zone.href}
              lines={[
                zone.note ?? "",
                ...(zone.children?.length ? [`внутри: ${zone.children.length}`] : []),
              ].filter(Boolean)}
              code={zone.doc}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <SectionLabel id="decisions">РЕШЕНИЯ — журнал, новые сверху</SectionLabel>
        <div className="rounded-md border border-zinc-200 bg-white p-3">
          <ul data-testid="decisions" className="space-y-1 text-xs leading-5">
            {list.map((d) => (
              <li key={d.name} className="flex flex-wrap gap-x-2">
                <span className="tabular-nums text-zinc-400">{d.date}</span>
                <span className="font-medium text-[#C2410C]">{d.name}</span>
                <span className="text-zinc-700">{d.title}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-zinc-400">
            docs/journal.md ·{" "}
            <Link prefetch={false} href="/admin/journal" className="text-[#C2410C] hover:underline">
              весь журнал
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
