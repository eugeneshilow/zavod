import type { Channel, ChannelState, ReelsBoardData } from "@/lib/reels";
import { CHANNELS, delta, moscow, num } from "@/lib/reels";
import { setChannelState } from "../actions";
import { Box } from "../_components/shell";

// Два блока стекла рельсы публикации: очередь и эфир. Очередь одна, дверей
// две — у каждой своя кнопка паузы. Блок «Эфир» — только про Instagram:
// цифры по каналу Telegram Bot API не отдаёт. Канон — docs/publish.md.
// Форма — таблицы плотности терминала: мелкий кегль, числа вправо, статус словом.

const STATUS_LABEL: Record<string, string> = {
  draft: "черновик",
  approved: "ждёт",
  posting: "публикуется",
  posted: "в эфире",
  failed: "не уехал",
  skipped: "протух",
};

const CHANNEL_LABEL: Record<Channel, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
};

const th = "px-2 py-1 text-left text-[10px] font-medium text-zinc-500";
const thNum = `${th} text-right`;
const td = "px-2 py-[3px] align-top";
const tdNum = `${td} text-right tabular-nums`;

/** Тумблер одной двери: состояние словами и кнопка, которая его меняет. */
function ChannelSwitch({ name, state }: { name: Channel; state: ChannelState }) {
  const paused = state?.action !== "on";
  return (
    <form action={setChannelState} className="flex flex-wrap items-center gap-2 text-xs">
      <input type="hidden" name="channel" value={name} />
      <input type="hidden" name="action" value={paused ? "on" : "off"} />
      <span data-testid={`channel-state-${name}`} className="flex items-center gap-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full ${paused ? "bg-zinc-300" : "bg-emerald-500"}`}
        />
        {CHANNEL_LABEL[name]}: <strong>{paused ? "на паузе" : "включён"}</strong>
        {state ? (
          <span className="text-zinc-500">
            · {state.reason} · {moscow(state.createdAt)}
          </span>
        ) : null}
      </span>
      <input
        type="text"
        name="reason"
        placeholder="причина"
        className="rounded border border-zinc-200 px-2 py-0.5 text-xs"
      />
      <button
        type="submit"
        className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-700 hover:border-zinc-400"
      >
        {paused ? "Включить" : "Поставить на паузу"}
      </button>
    </form>
  );
}

function PostLink({ permalink, at }: { permalink?: string | null; at: number | null | undefined }) {
  return permalink ? (
    <a href={permalink} className="text-[#C2410C] hover:underline" rel="noreferrer">
      {moscow(at)}
    </a>
  ) : (
    <>{moscow(at)}</>
  );
}

export default function ReelsBoard({ board }: { board: ReelsBoardData | { reason: string } }) {
  if ("reason" in board) {
    return (
      <Box title="Очередь Reels">
        <p data-testid="reels-unavailable" className="text-sm text-zinc-500">
          Рельса публикации не отвечает: {board.reason}. Проверьте переменные окружения по
          docs/publish.md.
        </p>
      </Box>
    );
  }

  return (
    <>
      <Box title="Очередь Reels" aside="data_cooked_instagram_reels · ops_channel_toggles">
        <div className="mb-3 flex flex-col gap-1.5">
          {CHANNELS.map((name) => (
            <ChannelSwitch key={name} name={name} state={board.channels[name]} />
          ))}
        </div>
        {board.state.length === 0 ? (
          <p className="mb-2 text-xs text-zinc-500">
            Ни один аккаунт Instagram не подключён: токена нет. Как его получить — docs/publish.md,
            «Как аккаунт получает токен».
          </p>
        ) : (
          <div className="mb-2 text-xs text-zinc-500">
            {board.state.map((row) => (
              <p key={row.account}>
                Аккаунт {row.username ? `@${row.username}` : row.account} · токен на месте, до{" "}
                {moscow(row.expiresAt)} · последний прогон {moscow(row.lastRunAt)}
              </p>
            ))}
          </div>
        )}
        {board.queue.length === 0 ? (
          <p className="text-xs text-zinc-500">Очередь пуста.</p>
        ) : (
          <div className="overflow-x-auto">
            <table data-testid="reels-queue" className="w-full text-xs">
              <thead className="bg-zinc-50">
                <tr>
                  <th className={th}>Статус</th>
                  <th className={th}>Дверь</th>
                  <th className={th}>Аккаунт</th>
                  <th className={th}>Тип</th>
                  <th className={th}>Подпись</th>
                  <th className={th}>План</th>
                  <th className={th}>Факт</th>
                  <th className={thNum}>Попытки</th>
                  <th className={th}>Ошибка</th>
                </tr>
              </thead>
              <tbody>
                {board.queue.map((row) => (
                  <tr key={row._id} className="border-t border-zinc-100">
                    <td className={td}>
                      <span
                        className={
                          row.status === "failed"
                            ? "text-red-700"
                            : row.status === "posted"
                              ? "text-emerald-700"
                              : "text-zinc-700"
                        }
                      >
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className={td}>{row.channel ?? "instagram"}</td>
                    <td className={td}>{row.account}</td>
                    <td className={td}>{row.mediaType === "IMAGE" ? "картинка" : "ролик"}</td>
                    <td className={`${td} max-w-[28rem] truncate`}>{row.caption.slice(0, 80)}</td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>
                      {moscow(row.scheduledAt)}
                    </td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>
                      <PostLink permalink={row.permalink} at={row.postedAt} />
                    </td>
                    <td className={tdNum}>{row.attempts}</td>
                    <td className={`${td} text-zinc-500`}>{row.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {board.alerts.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-red-700">
            {board.alerts.map((alert) => (
              <li key={`${alert.kind}-${alert.at}`}>
                {moscow(alert.at)} · {alert.message}
              </li>
            ))}
          </ul>
        )}
      </Box>

      <div id="airtime" className="scroll-mt-20">
        <Box title="Эфир" aside="data_raw_instagram_media · data_raw_instagram_metrics">
          <p className="mb-2 text-xs text-zinc-500">
            Подписчики: {num(board.account?.followers)} · квота за сутки:{" "}
            {num(board.account?.quotaUsage)} из {num(board.account?.quotaTotal)} · снято{" "}
            {moscow(board.account?.capturedAt)}
          </p>
          {board.airtime.length === 0 ? (
            <p className="text-xs text-zinc-500">В эфире пока ничего нет.</p>
          ) : (
            <div className="overflow-x-auto">
              <table data-testid="reels-airtime" className="w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className={th}>Медиа</th>
                    <th className={thNum}>Просмотры</th>
                    <th className={thNum}>Охват</th>
                    <th className={thNum}>Лайки</th>
                    <th className={thNum}>Комменты</th>
                    <th className={thNum}>Сохранения</th>
                    <th className={thNum}>Репосты</th>
                    <th className={thNum}>24 ч</th>
                    <th className={thNum}>48 ч</th>
                  </tr>
                </thead>
                <tbody>
                  {board.airtime.map((row) => (
                    <tr key={row.mediaId} className="border-t border-zinc-100">
                      <td className={`${td} whitespace-nowrap tabular-nums`}>
                        <PostLink permalink={row.permalink} at={row.postedAt} />
                      </td>
                      <td className={tdNum}>{num(row.metrics?.views)}</td>
                      <td className={tdNum}>{num(row.metrics?.reach)}</td>
                      <td className={tdNum}>{num(row.metrics?.likes)}</td>
                      <td className={tdNum}>{num(row.metrics?.comments)}</td>
                      <td className={tdNum}>{num(row.metrics?.saved)}</td>
                      <td className={tdNum}>{num(row.metrics?.shares)}</td>
                      <td className={tdNum}>{delta(row.views24h)}</td>
                      <td className={tdNum}>{delta(row.views48h)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Box>
      </div>
    </>
  );
}
