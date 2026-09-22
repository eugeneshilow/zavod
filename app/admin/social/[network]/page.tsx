import { setChannelState } from "@/app/admin/actions";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { moscow, num, type Channel } from "@/lib/reels";
import {
  dayKey,
  engagementRate,
  ideaCostLines,
  ideaCounts,
  ideaHost,
  ideaPhaseChip,
  loadSocial,
  moneyWord,
  NETWORKS,
  replays,
  watchThrough,
  type Idea,
  type NetworkGlance,
  type Reel,
} from "@/lib/social";
import { Box, SectionLabel } from "../../_components/shell";
import {
  addIdea,
  collectMetricsNow,
  removeIdea,
  rewriteIdea,
  runQueueNow,
  startIdea,
  stopIdea,
  withdrawIdea,
} from "../actions";

export const dynamic = "force-dynamic";

// /admin/social/<сеть> — одна сеть: четыре числа, кнопки руками, таблица идей
// до эфира, таблица эфира после него, канон сети. Идея живёт в верхней таблице,
// пока её ролик не вышел; вышел — строка уезжает вниз, в «Эфир сети».
// Канон — docs/social/README.md и docs/social/<сеть>.md.

const button =
  "rounded border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 hover:border-zinc-400";

/** Процент с одним знаком или прочерк. */
function pct(v: number | null): string {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}

/** Средний просмотр в секундах: площадка отдаёт миллисекунды. */
function watch(r: Reel): string {
  if (r.avgWatchMs == null) return "—";
  return `${(r.avgWatchMs / 1000).toFixed(1)} с`;
}

/** Длина ролика в секундах, если очередь её знает. */
function length(r: Reel): string {
  return r.durationMs ? `${Math.round(r.durationMs / 1000)} с` : "—";
}

/** Повторы: 1,4× — в среднем каждый охваченный посмотрел 1,4 раза. */
function replayText(r: Reel): string {
  const v = replays(r);
  return v == null ? "—" : `${v.toFixed(1)}×`;
}

const TH = "px-2 py-1 text-right text-[10px] font-medium text-zinc-500";
const TD = "px-2 py-[3px] text-right tabular-nums";

function ReelRow({ r, muted }: { r: Reel; muted?: boolean }) {
  const cell = muted ? `${TD} text-zinc-400` : TD;
  return (
    <tr className={`border-t border-zinc-100 ${muted ? "text-zinc-400" : ""}`}>
      <td className="px-2 py-[3px]">
        {r.permalink ? (
          <a
            href={r.permalink}
            rel="noreferrer"
            className={muted ? "text-zinc-400 hover:underline" : "text-[#C2410C] hover:underline"}
          >
            {moscow(r.postedAt)}
          </a>
        ) : (
          moscow(r.postedAt)
        )}
        {r.caption ? (
          <span className={muted ? "ml-2 text-zinc-400" : "ml-2 text-zinc-500"}>
            {r.caption.slice(0, 60)}
          </span>
        ) : null}
        {r.fromIdea ? <span className="ml-2 text-[10px] text-zinc-400">из идеи</span> : null}
        {r.videoUrl ? (
          <a
            href={r.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-[#C2410C] hover:underline"
            title="посмотреть ролик"
          >
            ▶
          </a>
        ) : null}
        {r.missingSince ? (
          <span className="ml-2 text-zinc-400">удалён {dayKey(r.missingSince)}</span>
        ) : null}
      </td>
      <td className={cell}>{num(r.views)}</td>
      <td className={cell}>{num(r.reach)}</td>
      <td className={cell}>{replayText(r)}</td>
      <td className={cell}>{pct(watchThrough(r))}</td>
      <td className={cell}>{watch(r)}</td>
      <td className={cell}>{length(r)}</td>
      <td className={cell}>{pct(r.skipRate)}</td>
      <td className={cell}>{num(r.likes)}</td>
      <td className={cell}>{num(r.comments)}</td>
      <td className={cell}>{num(r.saved)}</td>
      <td className={cell}>{num(r.shares)}</td>
      <td className={cell}>{num(r.reposts)}</td>
      <td className={cell}>{pct(engagementRate(r))}</td>
      <td className={cell}>{r.delta48 == null ? "—" : `+${r.delta48}`}</td>
      <td className={`${cell} font-mono text-[11px]`}>
        {r.costUsd == null ? (r.fromIdea ? "—" : "руками") : moneyWord(r.costUsd)}
      </td>
    </tr>
  );
}

const CHIP: Record<"grey" | "warn" | "bad", string> = {
  grey: "border-zinc-300 text-zinc-500",
  warn: "border-[#EF9F27] bg-[#FAEEDA] text-[#633806]",
  bad: "border-[#F09595] bg-[#FCEBEB] text-[#791F1F]",
};

/** Кнопка строки идеи: форма с её id, чтобы работало без JavaScript. */
function IdeaButton({
  action,
  id,
  network,
  label,
  quiet,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  network: string;
  label: string;
  quiet?: boolean;
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="network" value={network} />
      <button type="submit" className={`${button} ${quiet ? "text-zinc-400" : ""}`}>
        {label}
      </button>
    </form>
  );
}

/** Кнопки «руками» по статусу идеи: у каждой фазы свои. */
function IdeaHands({ idea, network }: { idea: Idea; network: string }) {
  const pass = { id: idea.id, network };
  if (idea.status === "pending") {
    return (
      <>
        <IdeaButton action={startIdea} label="В работу" {...pass} />{" "}
        <IdeaButton action={removeIdea} label="Убрать" quiet {...pass} />
      </>
    );
  }
  if (idea.status === "new")
    return <IdeaButton action={removeIdea} label="Убрать" quiet {...pass} />;
  if (idea.status === "taken")
    return <IdeaButton action={stopIdea} label="Остановить" quiet {...pass} />;
  if (idea.status === "done") {
    return (
      <>
        <IdeaButton action={rewriteIdea} label="Переписать" {...pass} />{" "}
        <IdeaButton action={withdrawIdea} label="Снять" quiet {...pass} />
      </>
    );
  }
  return (
    <>
      <IdeaButton action={startIdea} label="Повторить" {...pass} />{" "}
      <IdeaButton action={removeIdea} label="Убрать" quiet {...pass} />
    </>
  );
}

/** Одна строка верхней таблицы: идея до эфира. */
function IdeaRow({ idea, network, now }: { idea: Idea; network: string; now: number }) {
  const chip = ideaPhaseChip(idea, now);
  const host = ideaHost(idea.text);
  const cost = ideaCostLines(idea);
  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-2 py-[3px] text-zinc-800">
        {idea.text.replace(/\s+/g, " ").slice(0, 70)}
        {host ? <span className="ml-2 text-[10px] text-zinc-400">· {host}</span> : null}
      </td>
      <td className="px-2 py-[3px] tabular-nums text-zinc-500">{moscow(idea.createdAt)}</td>
      <td className="px-2 py-[3px]">
        <span
          className={`inline-block rounded-full border px-2 py-[1px] text-[10px] ${CHIP[chip.tone]}`}
        >
          {chip.text}
        </span>
      </td>
      <td className="px-2 py-[3px]">
        {idea.storyTitle ? (
          <>
            {idea.storyTitle}
            {idea.storyWords ? (
              <span className="ml-2 text-[10px] text-zinc-400">· {idea.storyWords} слов</span>
            ) : null}
          </>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-2 py-[3px]">
        {idea.videoUrl ? (
          <a
            href={idea.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#C2410C] hover:underline"
          >
            {idea.videoSeconds ? `▶ ${idea.videoSeconds} с` : "▶ ролик"}
          </a>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-2 py-[3px] font-mono text-[11px] text-zinc-600">
        {cost.length === 0 ? (
          <span className="font-sans text-zinc-400">—</span>
        ) : (
          cost.map((line) => <div key={line}>{line}</div>)
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-[3px] text-right">
        <IdeaHands idea={idea} network={network} />
      </td>
    </tr>
  );
}

/** Верхняя таблица: идеи до эфира, от свежей вниз. */
function IdeasTable({ n, now }: { n: NetworkGlance; now: number }) {
  const counts = ideaCounts(n.ideas);
  if (n.ideas.length === 0) return <p className="mt-3 text-xs text-zinc-500">идей нет</p>;
  return (
    <>
      <table data-testid="ideas-table" className="mt-3 w-full text-xs">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">идея</th>
            <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">добавлена</th>
            <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">фаза</th>
            <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">история</th>
            <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">ролик</th>
            <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">
              модели и цена
            </th>
            <th className={TH}>руками</th>
          </tr>
        </thead>
        <tbody>
          {n.ideas.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} network={n.id} now={now} />
          ))}
        </tbody>
      </table>
      <p className="mt-2 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500">
        ждут выбора {counts.pending} · в работе {counts.working} · не вышло {counts.failed} ·
        потрачено за неделю {moneyWord(n.ideasCost7d)}
      </p>
    </>
  );
}

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
        </>
      ) : null}
    </div>
  );
}

export default async function NetworkPage(props: PageProps<"/admin/social/[network]">) {
  const { network } = await props.params;
  const search = (await props.searchParams) as { idea?: string } | undefined;
  const meta = NETWORKS.find((x) => x.id === network);
  const [social, canon] = await Promise.all([loadSocial(), resolveDoc(["social", network])]);
  const n =
    meta && !("reason" in social) ? social.networks.find((x) => x.id === meta.id) : undefined;
  // Часы приходят вместе с данными: компонент их не спрашивает, иначе один и
  // тот же экран считал бы «пишет историю · N мин» от разного «сейчас».
  const now = "reason" in social ? 0 : social.now;

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
              sub={n.top?.views != null ? `лучший ролик ${num(n.top.views)}` : "по постам цифр нет"}
            />
            <Stat
              label="токен"
              value={n.accounts[0] ? `до ${moscow(n.accounts[0].expiresAt)}` : "—"}
              sub={
                n.accounts[0]
                  ? `@${n.accounts[0].username ?? n.accounts[0].account} · прогон ${moscow(n.accounts[0].lastRunAt)}`
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
          {n.id === "instagram" ? (
            <>
              <SectionLabel id="ideas">ИДЕИ — до эфира: накидываем, кнопкой выбираем</SectionLabel>
              <Box title="Идеи" aside="ops_reel_ideas">
                <form action={addIdea} className="flex items-start gap-2" data-testid="ideas">
                  <input type="hidden" name="network" value={n.id} />
                  <textarea
                    name="text"
                    rows={2}
                    placeholder="Ссылка на пост или новость и фраза, чем это интересно"
                    className="flex-1 rounded border border-zinc-200 px-2 py-1 text-xs"
                  />
                  <button type="submit" className={button}>
                    Добавить
                  </button>
                </form>
                {search?.idea === "empty" ? (
                  <p className="mt-1 text-[11px] text-[#C2410C]">Идея пустая: добавлять нечего.</p>
                ) : null}
                <IdeasTable n={n} now={now} />
              </Box>
            </>
          ) : null}
          <SectionLabel id="best">ЭФИР СЕТИ — после эфира: по просмотрам, с ценой</SectionLabel>
          <Box title="Эфир сети" aside="data_raw_instagram_media · data_raw_instagram_metrics">
            {n.reels.length === 0 && n.deleted.length === 0 ? (
              <p className="text-xs text-zinc-500">
                {n.id === "telegram"
                  ? "Telegram цифр по постам не отдаёт: только посты по дням на /admin/social."
                  : "В эфире пока ничего нет."}
              </p>
            ) : (
              <>
                <p className="mb-1 text-[10px] text-zinc-500">
                  в эфире {n.reels.length}
                  {n.deleted.length > 0 ? ` · удалено ${n.deleted.length}` : ""}
                </p>
                <table data-testid="best" className="w-full text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">
                        ролик
                      </th>
                      <th className={TH}>просмотры</th>
                      <th className={TH}>охват</th>
                      <th className={TH}>повторы</th>
                      <th className={TH}>досмотр</th>
                      <th className={TH}>ср. просмотр</th>
                      <th className={TH}>длина</th>
                      <th className={TH}>ушли за 3 с</th>
                      <th className={TH}>лайки</th>
                      <th className={TH}>комм.</th>
                      <th className={TH}>сохр.</th>
                      <th className={TH}>шеры</th>
                      <th className={TH}>репосты</th>
                      <th className={TH}>вовлеч.</th>
                      <th className={TH}>48 ч</th>
                      <th className={TH}>цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {n.reels.map((r) => (
                      <ReelRow key={r.mediaId} r={r} />
                    ))}
                    {n.deleted.length > 0 ? (
                      <tr className="border-t border-zinc-200 bg-zinc-50">
                        <td colSpan={16} className="px-2 py-1 text-[10px] text-zinc-500">
                          Удалены с площадки — цифры последние известные
                        </td>
                      </tr>
                    ) : null}
                    {n.deleted.map((r) => (
                      <ReelRow key={r.mediaId} r={r} muted />
                    ))}
                  </tbody>
                </table>
              </>
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
