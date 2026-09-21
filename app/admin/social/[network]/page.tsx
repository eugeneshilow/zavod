import Link from "next/link";
import { setChannelState } from "@/app/admin/actions";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { moscow, num, type Channel } from "@/lib/reels";
import { loadSocial, NETWORKS, type NetworkGlance } from "@/lib/social";
import { Box, SectionLabel } from "../../_components/shell";
import { collectMetricsNow, runQueueNow } from "../actions";

export const dynamic = "force-dynamic";

// /admin/social/<сеть> — одна сеть: четыре числа, кнопки руками, лучшие
// ролики, канон сети. Канон — docs/social/README.md и docs/social/<сеть>.md.

const button =
  "rounded border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 hover:border-zinc-400";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-950">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p> : null}
    </div>
  );
}

function Actions({ n, channel }: { n: NetworkGlance; channel: Channel }) {
  const paused = n.door?.on !== true;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={setChannelState} className="flex items-center gap-2">
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="action" value={paused ? "on" : "off"} />
        <input
          type="text"
          name="reason"
          placeholder="причина"
          className="rounded border border-zinc-200 px-2 py-0.5 text-xs"
        />
        <button type="submit" className={button} data-testid="door-button">
          {paused ? "Включить дверь" : "Поставить дверь на паузу"}
        </button>
      </form>
      <form action={runQueueNow}>
        <input type="hidden" name="network" value={n.id} />
        <button type="submit" className={button}>
          Опубликовать следующий сейчас
        </button>
      </form>
      {n.id === "instagram" ? (
        <>
          <form action={collectMetricsNow}>
            <input type="hidden" name="network" value={n.id} />
            <button type="submit" className={button}>
              Снять цифры сейчас
            </button>
          </form>
          <Link prefetch={false} href="/admin/publish#canon" className={button}>
            Подключить второй аккаунт
          </Link>
        </>
      ) : null}
    </div>
  );
}

export default async function NetworkPage({ params }: PageProps<"/admin/social/[network]">) {
  const { network } = await params;
  const meta = NETWORKS.find((x) => x.id === network);
  const [social, canon] = await Promise.all([loadSocial(), resolveDoc(["social", network])]);
  const n =
    meta && !("reason" in social) ? social.networks.find((x) => x.id === meta.id) : undefined;

  return (
    <>
      {!meta ? (
        <>
          <SectionLabel>СЕТИ НЕТ — данных по этой сети база не отдаёт</SectionLabel>
          <Box title={`Сеть «${network}» без кода экрана`}>
            <p className="text-sm text-zinc-600">
              Файл правил может лежать в docs/social, но дверь с таким именем в очереди не заведена.
              Ниже — канон, если файл есть.
            </p>
          </Box>
        </>
      ) : n ? (
        <>
          <SectionLabel id="pulse">ПУЛЬС — четыре числа и кнопки</SectionLabel>
          <div className="grid gap-3 lg:grid-cols-4">
            <Stat
              label="подписчики"
              value={num(n.followers)}
              sub={n.capturedAt ? `снято ${moscow(n.capturedAt)}` : "снимков нет"}
            />
            <Stat
              label="просмотры за 7 дней"
              value={num(n.views7d)}
              sub={
                n.best[0]?.views != null
                  ? `лучший ролик ${num(n.best[0].views)}`
                  : "по постам цифр нет"
              }
            />
            <Stat
              label="токен"
              value={n.accounts[0] ? `до ${moscow(n.accounts[0].expiresAt)}` : "—"}
              sub={
                n.accounts.length
                  ? `аккаунтов ${n.accounts.length} · прогон ${moscow(n.accounts[0].lastRunAt)}`
                  : "бот по переменным окружения"
              }
            />
            <Stat
              label="квота за сутки"
              value={n.quotaTotal != null ? `${num(n.quotaUsage)} из ${num(n.quotaTotal)}` : "—"}
              sub={`ждёт ${n.waiting} · не уехало ${n.failed}`}
            />
          </div>
          <Box
            title="Дверь и кнопки"
            aside={
              n.door
                ? `${n.door.on ? "включена" : "на паузе"} · ${n.door.reason} · ${moscow(n.door.at)}`
                : "дверь не переключалась"
            }
          >
            <Actions n={n} channel={meta.channel} />
          </Box>
          <SectionLabel id="best">ЛУЧШИЕ РОЛИКИ — по просмотрам</SectionLabel>
          <Box title="Эфир сети" aside="data_raw_instagram_media · data_raw_instagram_metrics">
            {n.best.length === 0 ? (
              <p className="text-xs text-zinc-500">
                {n.id === "telegram"
                  ? "Telegram цифр по постам не отдаёт: только посты по дням на /admin/social."
                  : "В эфире пока ничего нет."}
              </p>
            ) : (
              <table data-testid="best" className="w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">
                      ролик
                    </th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-zinc-500">
                      просмотры
                    </th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-zinc-500">
                      охват
                    </th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-zinc-500">
                      48 ч
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {n.best.map((r) => (
                    <tr key={r.mediaId} className="border-t border-zinc-100">
                      <td className="px-2 py-[3px]">
                        {r.permalink ? (
                          <a
                            href={r.permalink}
                            rel="noreferrer"
                            className="text-[#C2410C] hover:underline"
                          >
                            {moscow(r.postedAt)}
                          </a>
                        ) : (
                          moscow(r.postedAt)
                        )}
                        {r.caption ? (
                          <span className="ml-2 text-zinc-500">{r.caption.slice(0, 60)}</span>
                        ) : null}
                      </td>
                      <td className="px-2 py-[3px] text-right tabular-nums">{num(r.views)}</td>
                      <td className="px-2 py-[3px] text-right tabular-nums">{num(r.reach)}</td>
                      <td className="px-2 py-[3px] text-right tabular-nums">
                        {r.delta48 == null ? "—" : `+${r.delta48}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>
        </>
      ) : (
        <Box title={meta.label}>
          <p data-testid="social-unavailable" className="text-sm text-zinc-500">
            Цифры недоступны: {"reason" in social ? social.reason : "сеть не найдена в данных"}.
            Переменные окружения — docs/publish.md.
          </p>
        </Box>
      )}

      {canon ? (
        <>
          <SectionLabel id="canon">КАНОН — как сеть устроена прямо сейчас</SectionLabel>
          <Box title="Канон сети" aside={canon.doc}>
            <div
              className="doc"
              dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(canon.md), canon.doc) }}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}
