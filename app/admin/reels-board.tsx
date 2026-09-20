import type { Channel, ChannelState, ReelsBoardData } from "@/lib/reels";
import { CHANNELS, delta, moscow, num } from "@/lib/reels";
import { setChannelState } from "./actions";

// Два блока стекла рельсы публикации: очередь и эфир. Очередь одна, дверей
// две — у каждой своя кнопка паузы. Блок «Эфир» — только про Instagram:
// цифры по каналу Telegram Bot API не отдаёт. Канон — docs/publish.md.

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

/** Тумблер одной двери: состояние словами и кнопка, которая его меняет. */
function ChannelSwitch({ name, state }: { name: Channel; state: ChannelState }) {
  const paused = state?.action !== "on";
  return (
    <form action={setChannelState} className="flex flex-wrap items-center gap-2 text-sm">
      <input type="hidden" name="channel" value={name} />
      <input type="hidden" name="action" value={paused ? "on" : "off"} />
      <span data-testid={`channel-state-${name}`}>
        {CHANNEL_LABEL[name]}: <strong>{paused ? "на паузе" : "включён"}</strong>
        {state ? ` · ${state.reason} · ${moscow(state.createdAt)}` : ""}
      </span>
      <input
        type="text"
        name="reason"
        placeholder="причина"
        className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700"
      >
        {paused ? "Включить" : "Поставить на паузу"}
      </button>
    </form>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ReelsBoard({ board }: { board: ReelsBoardData | { reason: string } }) {
  if ("reason" in board) {
    return (
      <Frame title="Очередь Reels">
        <p data-testid="reels-unavailable" className="text-sm text-zinc-500">
          Рельса публикации не отвечает: {board.reason}. Проверьте переменные окружения по
          docs/publish.md.
        </p>
      </Frame>
    );
  }

  return (
    <>
      <Frame title="Очередь Reels">
        <div className="mb-4 flex flex-col gap-2">
          {CHANNELS.map((name) => (
            <ChannelSwitch key={name} name={name} state={board.channels[name]} />
          ))}
        </div>
        <p className="mb-3 text-sm text-zinc-500">
          Токен: {board.state.hasToken ? "на месте" : "нет"} · аккаунт{" "}
          {board.state.username ? `@${board.state.username}` : board.state.account} · токен до{" "}
          {moscow(board.state.expiresAt)} · последний прогон {moscow(board.state.lastRunAt)}
        </p>
        {board.queue.length === 0 ? (
          <p className="text-sm text-zinc-500">Очередь пуста.</p>
        ) : (
          <div className="overflow-x-auto">
            <table data-testid="reels-queue" className="w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-1 pr-3">Статус</th>
                  <th className="py-1 pr-3">Дверь</th>
                  <th className="py-1 pr-3">Тип</th>
                  <th className="py-1 pr-3">Подпись</th>
                  <th className="py-1 pr-3">План</th>
                  <th className="py-1 pr-3">Факт</th>
                  <th className="py-1 pr-3">Попытки</th>
                  <th className="py-1">Ошибка</th>
                </tr>
              </thead>
              <tbody>
                {board.queue.map((row) => (
                  <tr key={row._id} className="border-t border-zinc-100 dark:border-zinc-900">
                    <td className="py-1 pr-3">{STATUS_LABEL[row.status] ?? row.status}</td>
                    <td className="py-1 pr-3">{row.channel ?? "instagram"}</td>
                    <td className="py-1 pr-3">
                      {row.mediaType === "IMAGE" ? "картинка" : "ролик"}
                    </td>
                    <td className="py-1 pr-3">{row.caption.slice(0, 60)}</td>
                    <td className="py-1 pr-3">{moscow(row.scheduledAt)}</td>
                    <td className="py-1 pr-3">
                      {row.permalink ? (
                        <a
                          href={row.permalink}
                          className="underline underline-offset-4"
                          rel="noreferrer"
                        >
                          {moscow(row.postedAt)}
                        </a>
                      ) : (
                        moscow(row.postedAt)
                      )}
                    </td>
                    <td className="py-1 pr-3">{row.attempts}</td>
                    <td className="py-1 text-zinc-500">{row.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {board.alerts.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-zinc-500">
            {board.alerts.map((alert) => (
              <li key={`${alert.kind}-${alert.at}`}>
                {moscow(alert.at)} · {alert.message}
              </li>
            ))}
          </ul>
        )}
      </Frame>

      <Frame title="Эфир">
        <p className="mb-3 text-sm text-zinc-500">
          Подписчики: {num(board.account?.followers)} · квота за сутки:{" "}
          {num(board.account?.quotaUsage)} из {num(board.account?.quotaTotal)} · снято{" "}
          {moscow(board.account?.capturedAt)}
        </p>
        {board.airtime.length === 0 ? (
          <p className="text-sm text-zinc-500">В эфире пока ничего нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table data-testid="reels-airtime" className="w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-1 pr-3">Медиа</th>
                  <th className="py-1 pr-3">Просмотры</th>
                  <th className="py-1 pr-3">Охват</th>
                  <th className="py-1 pr-3">Лайки</th>
                  <th className="py-1 pr-3">Комменты</th>
                  <th className="py-1 pr-3">Сохранения</th>
                  <th className="py-1 pr-3">Репосты</th>
                  <th className="py-1 pr-3">24 ч</th>
                  <th className="py-1">48 ч</th>
                </tr>
              </thead>
              <tbody>
                {board.airtime.map((row) => (
                  <tr key={row.mediaId} className="border-t border-zinc-100 dark:border-zinc-900">
                    <td className="py-1 pr-3">
                      {row.permalink ? (
                        <a
                          href={row.permalink}
                          className="underline underline-offset-4"
                          rel="noreferrer"
                        >
                          {moscow(row.postedAt)}
                        </a>
                      ) : (
                        moscow(row.postedAt)
                      )}
                    </td>
                    <td className="py-1 pr-3">{num(row.metrics?.views)}</td>
                    <td className="py-1 pr-3">{num(row.metrics?.reach)}</td>
                    <td className="py-1 pr-3">{num(row.metrics?.likes)}</td>
                    <td className="py-1 pr-3">{num(row.metrics?.comments)}</td>
                    <td className="py-1 pr-3">{num(row.metrics?.saved)}</td>
                    <td className="py-1 pr-3">{num(row.metrics?.shares)}</td>
                    <td className="py-1 pr-3">{delta(row.views24h)}</td>
                    <td className="py-1">{delta(row.views48h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Frame>
    </>
  );
}
