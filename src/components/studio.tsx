"use client";

import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import {
  filterClips,
  formatStats,
  initialClips,
  needsDecision,
  stages,
  subscriptions,
  traffic,
  transitionClips,
  visits,
  type Clip,
  type ClipFilter,
} from "@/lib/studio";

const sections = [
  "Пульт",
  "Производство",
  "Форматы",
  "Референсы",
  "Публикации",
  "Аналитика",
  "Настройки",
  "Документы",
] as const;
type Section = (typeof sections)[number];
type Modal = "preview" | "feedback" | "compare" | "metric" | "format" | null;
const number = (value: number) => value.toLocaleString("ru-RU");

function Icon({
  name,
  size = 16,
}: {
  name:
    | "search"
    | "arrow"
    | "pause"
    | "play"
    | "close"
    | "check"
    | "expand"
    | "link"
    | "clock"
    | "instagram";
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pause: (
      <>
        <path d="M8 5v14M16 5v14" strokeWidth="3" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    expand: <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" />,
    link: (
      <>
        <path d="m10 7 2-2a5 5 0 0 1 7 7l-2 2M14 17l-2 2a5 5 0 0 1-7-7l2-2m1 7 8-8" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" strokeWidth="3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Sparkline({
  points,
  tone = "muted",
  area = false,
}: {
  points: number[];
  tone?: string;
  area?: boolean;
}) {
  if (points.length === 1) return <span className="no-trend">—</span>;
  const max = Math.max(...points),
    min = Math.min(...points);
  const coords = points
    .map(
      (value, i) =>
        `${3 + (i / (points.length - 1)) * 94},${29 - ((value - min) / (max - min || 1)) * 24}`,
    )
    .join(" ");
  return (
    <svg
      className={`sparkline ${tone}`}
      viewBox="0 0 100 34"
      aria-hidden="true"
    >
      {area && (
        <polygon
          points={`3,34 ${coords} 97,34`}
          fill="currentColor"
          opacity=".07"
        />
      )}
      <polyline
        points={coords}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Poster({ clip, mini = false }: { clip: Clip; mini?: boolean }) {
  return (
    <div
      className={`poster ${clip.theme} ${mini ? "mini" : ""}`}
      aria-hidden="true"
    >
      <div className="poster-grain" />
      <span className="poster-kicker">VIBE / BUILD / REPEAT</span>
      <strong>
        {clip.format === "До / После" ? (
          <>
            Было.
            <br />
            <em>Стало.</em>
          </>
        ) : clip.format === "Разбор" ? (
          <>
            Меньше
            <br />
            <em>ошибок.</em>
          </>
        ) : clip.format === "Челлендж" ? (
          <>
            20 минут.
            <br />
            <em>Один MVP.</em>
          </>
        ) : (
          <>
            Есть идея?
            <br />
            <em>Собери.</em>
          </>
        )}
      </strong>
      <div className="poster-window">
        <div className="window-bar">
          <i />
          <i />
          <i />
          <span>workspace</span>
        </div>
        <div className="window-body">
          <div className="window-sidebar">
            <b />
            <b />
            <b />
          </div>
          <div className="window-content">
            <small>Мой первый проект</small>
            <div className="window-chart">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span />
            <span />
          </div>
        </div>
      </div>
      <span className="poster-bottom">
        vibecoding.tech <span>↗</span>
      </span>
    </div>
  );
}

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="studio-dialog"
      onCancel={onClose}
      aria-labelledby="dialog-title"
    >
      <header>
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}

export default function Studio({ documents }: { documents: ReactNode }) {
  const [clips, dispatch] = useReducer(transitionClips, initialClips);
  const [section, setSection] = useState<Section>("Пульт");
  const [selectedId, setSelectedId] = useState("042");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClipFilter>("all");
  const [sort, setSort] = useState<"default" | "time" | "id">("default");
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [feedback, setFeedback] = useState("");
  const [formatIndex, setFormatIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState("—:—");
  const search = useRef<HTMLInputElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const selected = clips.find((clip) => clip.id === selectedId) ?? clips[0];
  const assetsPending =
    selected.stage === "script" || selected.stage === "rendering";
  const attention = clips.filter(needsDecision);
  const filtered = filterClips(clips, query, filter, sort);
  const visibleClips =
    expanded || section === "Производство" ? filtered : filtered.slice(0, 7);
  const queued = filterClips(
    clips.filter((clip) => clip.stage === "queued"),
    query,
    "all",
    "time",
  );
  const dashboard = section === "Пульт";

  useEffect(() => {
    const update = () =>
      setClock(
        new Intl.DateTimeFormat("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Moscow",
        }).format(new Date()),
      );
    update();
    const timer = setInterval(update, 30_000);
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);

  function selectClip(id: string) {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1000px)").matches)
      requestAnimationFrame(() =>
        inspector.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
  }
  function openClip(clip: Clip) {
    setSection("Производство");
    setFilter("all");
    setQuery("");
    selectClip(clip.id);
  }
  function approve() {
    dispatch({ type: "approve", id: selected.id });
    setNotice(
      `${selected.id} · Согласован и добавлен в демоочередь. Публикации не будет.`,
    );
  }
  function retry(clip: Clip) {
    dispatch({ type: "retry", id: clip.id });
    setNotice(`${clip.id} · Демо: озвучка пересобрана. Выпуск ждёт проверки.`);
  }
  function experiment() {
    dispatch({ type: "experiment" });
    setSelectedId("053");
    setSection("Производство");
    setFilter("all");
    setQuery("");
    setNotice("053 · Открыт демоэксперимент. Выберите начало A или B.");
  }
  function reset() {
    dispatch({ type: "reset" });
    setSelectedId("042");
    setFilter("all");
    setQuery("");
    setSort("default");
    setExpanded(false);
    setPaused(false);
    setNotice("Демонстрационные данные восстановлены.");
  }

  const productionPanel = (
    <section
      className="terminal-panel production-panel"
      aria-labelledby="production-title"
    >
      <div className="panel-heading">
        <h2 id="production-title">
          Производство{" "}
          <span className="subtle count-inline">/ {clips.length}</span>
        </h2>
        <span className="panel-meta">
          <b className="warm">{attention.length}</b> требуют решения
        </span>
      </div>
      <div className="table-toolbar">
        <div className="filter-tabs" aria-label="Фильтр производства">
          {(
            [
              ["all", "Все", clips.length],
              ["attention", "Требуют решения", attention.length],
              [
                "today",
                "Сегодня",
                clips.filter((clip) => clip.day === "Сегодня").length,
              ],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <label className="sort-label">
          <span className="sr-only">Сортировка роликов</span>
          <select
            aria-label="Сортировка роликов"
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
          >
            <option value="default">По приоритету</option>
            <option value="time">По времени</option>
            <option value="id">Сначала новые</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table className="production-table">
          <thead>
            <tr>
              <th scope="col">Ролик</th>
              <th scope="col">Формат</th>
              <th scope="col">Этап</th>
              <th scope="col">Публикация · МСК</th>
              <th scope="col">Что дальше</th>
            </tr>
          </thead>
          <tbody>
            {visibleClips.map((clip) => (
              <tr
                key={clip.id}
                className={selected.id === clip.id ? "selected" : ""}
              >
                <td>
                  <button
                    className="clip-select"
                    aria-pressed={selected.id === clip.id}
                    onClick={() => selectClip(clip.id)}
                  >
                    <Poster clip={clip} mini />
                    <span className="clip-id">{clip.id}</span>
                    <span className="clip-title">{clip.title}</span>
                  </button>
                </td>
                <td>{clip.format}</td>
                <td>
                  <span className={`stage ${clip.stage}`}>
                    <i />
                    {stages[clip.stage].label}
                  </span>
                  {clip.stage === "rendering" && (
                    <span className="render-progress">
                      <i />
                    </span>
                  )}
                </td>
                <td className="muted numeric">
                  {clip.day} {clip.time}
                </td>
                <td>
                  <button
                    className={`text-button next-action ${needsDecision(clip) ? "warm" : "muted"}`}
                    onClick={() => {
                      selectClip(clip.id);
                      if (clip.stage === "hook") setModal("compare");
                      if (clip.stage === "error") retry(clip);
                      if (clip.stage === "script") setModal("preview");
                      if (clip.stage === "rendering")
                        setNotice(
                          "Рендер показан как пример этапа. Генерация видео ещё не подключена.",
                        );
                    }}
                  >
                    {stages[clip.stage].next}
                    {needsDecision(clip) && <Icon name="arrow" size={13} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleClips.length === 0 && (
        <div className="empty-inline">
          Ничего не найдено.{" "}
          <button
            className="text-button warm"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Сбросить поиск и фильтр
          </button>
        </div>
      )}
      <div className="panel-foot">
        <span>
          Показано {visibleClips.length} из {filtered.length}
          {query && ` · «${query}»`}
        </span>
        {!expanded && filtered.length > 7 && section !== "Производство" ? (
          <button
            className="text-button warm"
            onClick={() => setExpanded(true)}
          >
            Вся очередь <Icon name="arrow" size={14} />
          </button>
        ) : (
          <span>Изменения до перезагрузки</span>
        )}
      </div>
    </section>
  );

  const inspectorPanel = (
    <section
      ref={inspector}
      className="terminal-panel inspector-panel"
      aria-labelledby="inspector-title"
    >
      <div className="panel-heading">
        <h2 id="inspector-title">
          Выбран ролик <span className="numeric">{selected.id}</span>
        </h2>
        <span className="muted">Instagram Reels</span>
      </div>
      <div className="inspector-body">
        <h3>{selected.title}</h3>
        <div className="inspector-content">
          <button
            className="poster-button"
            onClick={() => setModal("preview")}
            aria-label={`Открыть раскадровку ${selected.id}`}
          >
            <Poster clip={selected} />
            <span className="preview-tag">
              <Icon name="expand" size={12} /> Раскадровка{" "}
              <span>0:{selected.duration}</span>
            </span>
          </button>
          <div className="clip-details">
            <dl>
              <div>
                <dt>Формат</dt>
                <dd>{selected.format}</dd>
              </div>
              <div>
                <dt>Рецепт</dt>
                <dd>{selected.recipe}</dd>
              </div>
              <div>
                <dt>Длительность</dt>
                <dd>{selected.duration} сек.</dd>
              </div>
              <div>
                <dt>Выпуск · МСК</dt>
                <dd>
                  {selected.day.toLowerCase()} {selected.time}
                </dd>
              </div>
            </dl>
            <div
              className={`reason-box ${selected.stage === "error" ? "danger" : selected.stage === "queued" ? "success" : ""}`}
            >
              <span className="reason-icon">
                {selected.stage === "queued" ? "✓" : "!"}
              </span>
              <div>
                <strong>
                  {selected.stage === "review"
                    ? "Нужно согласование"
                    : stages[selected.stage].label}
                </strong>
                <p>
                  {selected.stage === "review"
                    ? selected.hook
                      ? `Выбрано начало ${selected.hook}. Проверьте выпуск.`
                      : "Первый выпуск по новому рецепту"
                    : selected.stage === "error"
                      ? "Озвучка не собрана. Нужен повтор."
                      : selected.stage === "hook"
                        ? "Два варианта первых двух секунд"
                        : selected.stage === "queued"
                          ? "Согласован. В демонстрационной очереди."
                          : selected.stage === "rendering"
                            ? "Пример процесса · прогресс не обновляется"
                            : selected.feedback ||
                              "Подготовка структуры и текста"}
                </p>
              </div>
            </div>
            <div
              className={`quality-checks ${assetsPending ? "pending-checks" : ""}`}
              aria-label="Проверки деморолика"
            >
              <span className={selected.stage === "error" ? "bad" : ""}>
                {assetsPending ? "○" : selected.stage === "error" ? "×" : "✓"}{" "}
                Звук
              </span>
              <span>{assetsPending ? "○" : "✓"} Титры</span>
              <span>{assetsPending ? "○" : "✓"} Ссылка</span>
            </div>
            <span className="demo-caption">
              {assetsPending
                ? "Проверки после подготовки видео"
                : "Условные проверки · не анализ видео"}
            </span>
          </div>
        </div>
        <div className="inspector-actions">
          {selected.stage === "review" ? (
            <button className="primary-button" onClick={approve}>
              Согласовать и в очередь <Icon name="arrow" />
            </button>
          ) : selected.stage === "error" ? (
            <button className="primary-button" onClick={() => retry(selected)}>
              Повторить озвучку
            </button>
          ) : selected.stage === "hook" ? (
            <button
              className="primary-button"
              onClick={() => setModal("compare")}
            >
              Сравнить начало A / B
            </button>
          ) : selected.stage === "queued" ? (
            <button
              className="primary-button"
              onClick={() => setSection("Публикации")}
            >
              Открыть очередь <Icon name="arrow" />
            </button>
          ) : (
            <button
              className="secondary-button"
              onClick={() => setModal("preview")}
            >
              Открыть сценарий <Icon name="arrow" />
            </button>
          )}
          {selected.stage !== "rendering" && (
            <button
              className="secondary-button"
              onClick={() => {
                setFeedback("");
                setModal("feedback");
              }}
            >
              Вернуть с правкой
            </button>
          )}
        </div>
      </div>
    </section>
  );

  const formatsPanel = (
    <section
      className="terminal-panel formats-panel"
      aria-labelledby="formats-title"
    >
      <div className="panel-heading">
        <h2 id="formats-title">Форматы: что повторять</h2>
        <span className="panel-meta">Первые 72 часа каждого выпуска</span>
      </div>
      <div className="table-scroll">
        <table className="formats-table">
          <thead>
            <tr>
              <th>Формат</th>
              <th>Выпуски</th>
              <th>Медиана просмотров</th>
              <th>Ср. просмотр</th>
              <th>Репосты</th>
              <th>Динамика</th>
              <th>Следующий шаг</th>
            </tr>
          </thead>
          <tbody>
            {formatStats.map((format, index) => (
              <tr key={format.name}>
                <td>
                  <button
                    className="text-button format-name"
                    onClick={() => {
                      setFormatIndex(index);
                      setModal("format");
                    }}
                  >
                    {format.name}
                  </button>
                </td>
                <td className="numeric">{format.count}</td>
                <td className="numeric">{format.views}</td>
                <td className="numeric">{format.watch}</td>
                <td className="numeric">{format.shares}</td>
                <td>
                  <Sparkline points={format.points} tone={format.tone} />
                </td>
                <td>
                  <button
                    className="text-button muted"
                    onClick={() => {
                      setFormatIndex(index);
                      setModal("format");
                    }}
                  >
                    {format.next}
                    <Icon name="arrow" size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-foot">
        <span>
          Репосты ÷ просмотры · сравнение со своей историей · данные демо
        </span>
        <button
          className="text-button"
          aria-label="Определения метрик"
          onClick={() => setModal("metric")}
        >
          ⓘ
        </button>
      </div>
    </section>
  );

  const attentionPanel = (
    <section
      className="terminal-panel attention-panel"
      aria-labelledby="attention-title"
    >
      <div className="panel-heading">
        <h2 id="attention-title">
          Требует внимания{" "}
          <span className="count-pill">{attention.length}</span>
        </h2>
      </div>
      <div className="attention-list">
        {attention.slice(0, 3).map((clip) => (
          <div className="attention-item" key={clip.id}>
            <span
              className={`alert-symbol ${clip.stage === "error" ? "bad" : "warm"}`}
            >
              !
            </span>
            <button className="attention-copy" onClick={() => openClip(clip)}>
              <strong>
                {clip.id} ·{" "}
                {clip.stage === "error"
                  ? "Не собрана озвучка"
                  : clip.stage === "hook"
                    ? "Не выбрано начало"
                    : "Выпуск ждёт проверки"}
              </strong>
              <span>
                {clip.stage === "error"
                  ? "Публикация заблокирована"
                  : clip.stage === "hook"
                    ? "2 варианта готовы"
                    : "Первый выпуск по рецепту"}
              </span>
            </button>
            <button
              className="secondary-button small"
              onClick={() => {
                if (clip.stage === "error") retry(clip);
                else {
                  openClip(clip);
                  if (clip.stage === "hook") setModal("compare");
                }
              }}
            >
              {clip.stage === "error"
                ? "Повторить"
                : clip.stage === "hook"
                  ? "Сравнить"
                  : "Проверить"}
            </button>
          </div>
        ))}
        {attention.length === 0 && (
          <p className="empty-inline good">
            ✓ Все решения приняты. Демоочередь готова.
          </p>
        )}
        {attention.length > 3 && (
          <button
            className="text-button warm more-attention"
            onClick={() => {
              setSection("Производство");
              setFilter("attention");
              setQuery("");
            }}
          >
            Ещё {attention.length - 3} · показать все
          </button>
        )}
      </div>
    </section>
  );

  const trafficPanel = (
    <section
      className="terminal-panel traffic-panel"
      aria-labelledby="traffic-title"
    >
      <div className="panel-heading">
        <h2 id="traffic-title">
          Трафик <span className="normal-case">на vibecoding.tech</span>
        </h2>
        <span className="panel-meta">07–13 сентября · демо</span>
      </div>
      <div className="traffic-body">
        <div className="traffic-chart">
          <div className="chart-legend">
            <i /> Визиты по UTM <span>по дням</span>
          </div>
          <svg
            viewBox="0 0 570 105"
            role="img"
            aria-label={`Визиты по дням с 7 по 13 сентября: ${traffic.join(", ")}. Всего ${visits}.`}
          >
            <defs>
              <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#288854" stopOpacity=".17" />
                <stop offset="100%" stopColor="#288854" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 100, 200, 300].map((value) => (
              <g key={value}>
                <line
                  x1="32"
                  y1={80 - value / 4}
                  x2="551"
                  y2={80 - value / 4}
                  stroke="#e6e9e9"
                />
                <text x="3" y={83 - value / 4}>
                  {value}
                </text>
              </g>
            ))}
            <polygon
              points={`32,80 ${traffic.map((value, i) => `${32 + i * 85},${80 - value / 4}`).join(" ")} 542,80`}
              fill="url(#traffic-fill)"
            />
            <polyline
              points={traffic
                .map((value, i) => `${32 + i * 85},${80 - value / 4}`)
                .join(" ")}
              fill="none"
              stroke="#258054"
              strokeWidth="1.7"
            />
            {traffic.map((value, i) => (
              <g key={i}>
                <circle
                  cx={32 + i * 85}
                  cy={80 - value / 4}
                  r={i === 6 ? 4 : 2.5}
                  fill="#258054"
                />
                <text x={32 + i * 85} y="99" textAnchor="middle">
                  {String(i + 7).padStart(2, "0")}
                </text>
                <title>{`${i + 7} сентября: ${value} визитов`}</title>
              </g>
            ))}
          </svg>
        </div>
        <div className="traffic-summary">
          <p>
            <b>{number(visits)}</b> визита <span>→</span> <b>{subscriptions}</b>{" "}
            подписок
          </p>
          <span>Конверсия в подписку</span>
          <strong>
            {((subscriptions / visits) * 100).toFixed(1).replace(".", ",")}%
          </strong>
          <button
            className="text-button muted"
            onClick={() => setModal("metric")}
          >
            Как считаем <Icon name="arrow" size={12} />
          </button>
        </div>
      </div>
    </section>
  );

  const experimentPanel = (
    <section
      className="terminal-panel experiment-panel"
      aria-labelledby="experiment-title"
    >
      <div className="panel-heading">
        <h2 id="experiment-title">Следующий эксперимент</h2>
        <span className="hypothesis">Гипотеза</span>
      </div>
      <div className="experiment-body">
        <strong>До / После · первые 2 секунды</strong>
        <div className="experiment-options">
          <div>
            <p>
              <b>A</b> Сначала проблема
            </p>
            <p>
              <b>B</b> Сначала результат
            </p>
          </div>
          <button className="secondary-button" onClick={experiment}>
            {clips.some((clip) => clip.id === "053")
              ? "Открыть варианты"
              : "Подготовить варианты"}
            <Icon name="arrow" />
          </button>
        </div>
        <p className="subtle">
          Проверить, какое начало лучше удерживает зрителя.
        </p>
      </div>
    </section>
  );

  return (
    <main className="studio-shell">
      {(dashboard || section === "Производство") && (
        <h1 className="sr-only">Завод · {section}</h1>
      )}
      <header className="studio-topbar">
        <a href="/admin" className="brand" aria-label="Завод — пульт">
          <svg width="30" height="25" viewBox="0 0 34 28" aria-hidden="true">
            <path d="M1 27V13l10-6v7L22 7v7l5-3V1h6v26Z" fill="currentColor" />
          </svg>
          <span>ЗАВОД</span>
        </a>
        <a
          className="brand-domain"
          href="https://vibecoding.tech"
          target="_blank"
          rel="noreferrer"
        >
          vibecoding.tech <Icon name="link" size={11} />
        </a>
        <div className="global-search">
          <Icon name="search" />
          <input
            ref={search}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!["Пульт", "Производство", "Публикации"].includes(section))
                setSection("Производство");
            }}
            placeholder="Найти ролик, формат или этап…"
            aria-label="Найти ролик, формат или этап"
          />
          {query ? (
            <button
              className="icon-button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
            >
              <Icon name="close" size={13} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>
        <span
          className="demo-label"
          title="Все ролики и показатели условные. Изменения живут до перезагрузки."
        >
          <i /> ДЕМО <span>· условные данные</span>
        </span>
        <time className="top-clock">
          {clock} <span>МСК</span>
        </time>
        <button
          className={`secondary-button pause-button ${paused ? "is-paused" : ""}`}
          aria-pressed={paused}
          onClick={() => {
            setPaused(!paused);
            setNotice(
              paused
                ? "Демоочередь возобновлена. Реальная публикация не подключена."
                : "Демоочередь на паузе. Реальная публикация не подключена.",
            );
          }}
        >
          <Icon name={paused ? "play" : "pause"} size={13} />
          {paused ? "Продолжить" : "Пауза"}
        </button>
      </header>
      <div className="studio-nav-row">
        <nav aria-label="Разделы админки">
          {sections.map((item) => (
            <button
              key={item}
              className={section === item ? "active" : ""}
              aria-current={section === item ? "page" : undefined}
              onClick={() => setSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="mode-button" onClick={() => setSection("Настройки")}>
          <span className="status-dot" /> Режим: согласование <span>⌄</span>
        </button>
      </div>

      {section !== "Документы" && (
        <>
          <div className="metrics-strip">
            <div className="scope-box">
              <div>
                <Icon name="instagram" size={18} />
                <strong>Instagram</strong>
              </div>
              <span>
                <Icon name="clock" size={12} /> 7 дней · 07–13 сен.
              </span>
              <small>Демонстрационный период</small>
            </div>
            <button className="metric" onClick={() => setModal("metric")}>
              <span>Переходы на сайт</span>
              <strong>{number(visits)}</strong>
              <small>
                <b className="good">↗ 18%</b> к прошлой неделе · UTM
              </small>
              <Sparkline points={traffic} tone="good" area />
            </button>
            <button className="metric" onClick={() => setModal("metric")}>
              <span>Подписки на сайте</span>
              <strong>{subscriptions}</strong>
              <small>7,5% от визитов</small>
              <Sparkline points={[2, 5, 4, 8, 7, 9, 10, 14]} />
            </button>
            <button className="metric" onClick={() => setSection("Форматы")}>
              <span>Опубликовано</span>
              <strong>
                28 <em>роликов</em>
              </strong>
              <small>за 7 дней · демо</small>
              <div className="mini-bars" aria-hidden="true">
                {[20, 29, 33, 46, 53, 69, 85].map((height) => (
                  <i key={height} style={{ height: `${height}%` }} />
                ))}
              </div>
            </button>
            <button className="metric" onClick={() => setModal("metric")}>
              <span>Расход</span>
              <strong>$186</strong>
              <small>$1,94 за подписку</small>
              <Sparkline points={[2, 3, 7, 6, 6, 10, 13, 12, 17]} />
            </button>
          </div>
          {paused && (
            <div className="pause-banner">
              <Icon name="pause" size={14} /> Демоочередь на паузе. Проверять и
              готовить ролики можно.
            </div>
          )}
        </>
      )}
      <div
        className={`notice ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice && (
          <>
            <Icon name="check" size={14} />
            <span>{notice}</span>
            <button
              className="icon-button"
              onClick={() => setNotice("")}
              aria-label="Скрыть уведомление"
            >
              <Icon name="close" size={13} />
            </button>
          </>
        )}
      </div>
      {(dashboard || section === "Производство") && (
        <div className="workspace-grid">
          {productionPanel}
          {inspectorPanel}
          {dashboard && (
            <>
              {formatsPanel}
              {attentionPanel}
              {trafficPanel}
              {experimentPanel}
            </>
          )}
        </div>
      )}
      {section === "Форматы" && (
        <div className="section-workspace">
          <div className="section-intro">
            <span className="eyebrow">БИБЛИОТЕКА ФОРМАТОВ</span>
            <h1>Повторять то, что работает.</h1>
            <p>
              Сравнивайте одинаковое окно наблюдения. Любой следующий шаг пока —
              гипотеза на демоданных.
            </p>
          </div>
          {formatsPanel}
          <div className="two-panels">
            {experimentPanel}
            <div className="terminal-panel explainer">
              <h2>От референса к рецепту</h2>
              <p>
                Сначала разберём механику успешного ролика: обещание, начало,
                темп, доказательство и призыв к действию. Затем проверим свою
                версию на сопоставимых выпусках.
              </p>
              <button
                className="text-button warm"
                onClick={() => setSection("Референсы")}
              >
                Открыть референсы <Icon name="arrow" />
              </button>
            </div>
          </div>
        </div>
      )}
      {section === "Публикации" && (
        <div className="section-workspace">
          <div className="section-intro">
            <span className="eyebrow">ОЧЕРЕДЬ ВЫПУСКОВ</span>
            <h1>Готово к следующему шагу.</h1>
            <p>
              {paused ? "Демоочередь на паузе." : "Демоочередь активна."}{" "}
              Instagram не подключён — эти ролики не будут опубликованы.
            </p>
          </div>
          <section className="terminal-panel">
            <div className="panel-heading">
              <h2>
                Согласованные ролики{" "}
                <span className="count-inline">/ {queued.length}</span>
              </h2>
              <span>Время · МСК</span>
            </div>
            <div className="publication-list">
              {queued.map((clip) => (
                <button
                  className="publication-row"
                  key={clip.id}
                  onClick={() => openClip(clip)}
                >
                  <time>
                    {clip.day}
                    <b>{clip.time}</b>
                  </time>
                  <Poster clip={clip} mini />
                  <span className="publication-title">
                    <strong>
                      {clip.id} · {clip.title}
                    </strong>
                    <span>
                      {clip.format} · {clip.duration} сек.
                    </span>
                  </span>
                  <span className="stage queued">
                    <i />
                    {paused ? "На паузе" : "В демоочереди"}
                  </span>
                  <Icon name="arrow" />
                </button>
              ))}
              {queued.length === 0 && (
                <p className="empty-inline">
                  Нет роликов по этому запросу. Согласуйте выпуск в производстве
                  или очистите поиск.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
      {section === "Аналитика" && (
        <div className="section-workspace">
          <div className="section-intro">
            <span className="eyebrow">ОБРАТНАЯ СВЯЗЬ</span>
            <h1>Просмотры — начало. Трафик — цель.</h1>
            <p>
              Недельный результат по UTM и сравнение форматов за первые 72 часа.
              Все значения иллюстративные.
            </p>
          </div>
          {trafficPanel}
          {formatsPanel}
          <div className="terminal-panel explainer">
            <h2>Что нужно для реальных выводов</h2>
            <p>
              Связать публикацию, рецепт и UTM-метку; собрать удержание,
              репосты, визиты и подписки. Сравнивать несколько выпусков, а не
              выбирать победителя по одному всплеску.
            </p>
            <button
              className="text-button warm"
              onClick={() => setModal("metric")}
            >
              Определения показателей <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}
      {section === "Референсы" && (
        <div className="section-workspace">
          <div className="section-intro">
            <span className="eyebrow">ВХОД В ПРОИЗВОДСТВО</span>
            <h1>Сильный формат начинается с наблюдения.</h1>
            <p>
              Здесь появятся ваши референсы роликов и разбор механики каждого из
              них.
            </p>
          </div>
          <div className="reference-empty terminal-panel">
            <span className="empty-mark">↗</span>
            <h2>Референсов пока нет</h2>
            <p>
              Вы предоставите примеры позднее. Условные форматы на пульте
              показывают устройство системы и не взяты из реальных успешных
              кейсов.
            </p>
            <div className="reference-fields">
              <span>
                01 <b>Ссылка на ролик</b>
              </span>
              <span>
                02 <b>Что цепляет в начале</b>
              </span>
              <span>
                03 <b>Механика и подача</b>
              </span>
              <span>
                04 <b>Как адаптировать</b>
              </span>
            </div>
            <p className="subtle">
              Импорт и сохранение референсов появятся вместе с подключением
              базы.
            </p>
          </div>
        </div>
      )}
      {section === "Настройки" && (
        <div className="section-workspace settings-workspace">
          <div className="section-intro">
            <span className="eyebrow">КОНТРОЛЬ И ПОДКЛЮЧЕНИЯ</span>
            <h1>Сначала согласование. Затем автоматизация.</h1>
            <p>
              Текущая версия работает локально. Внешние сервисы не подключены.
            </p>
          </div>
          <section className="terminal-panel">
            <div className="panel-heading">
              <h2>Каналы и данные</h2>
            </div>
            {[
              ["Instagram Reels", "Первый канал публикации", "Не подключён"],
              ["TikTok / YouTube Shorts", "Следующие каналы", "Позднее"],
              [
                "Аналитика vibecoding.tech",
                "Визиты по UTM и подписки",
                "Не подключена",
              ],
              [
                "Convex",
                "Провайдер подготовлен; облачная база для демо не используется",
                "Демо без базы",
              ],
            ].map(([name, description, status]) => (
              <div className="settings-row" key={name}>
                <div>
                  <strong>{name}</strong>
                  <p>{description}</p>
                </div>
                <span className="neutral-tag">{status}</span>
              </div>
            ))}
          </section>
          <section className="terminal-panel">
            <div className="panel-heading">
              <h2>Работа с демо</h2>
            </div>
            <div className="settings-row">
              <div>
                <strong>Режим согласования</strong>
                <p>Перед очередью выпуск проверяет человек.</p>
              </div>
              <span className="good">Включён</span>
            </div>
            <div className="settings-row">
              <div>
                <strong>Сбросить демонстрацию</strong>
                <p>
                  Вернуть исходные ролики, фильтры и состояния. Изменения также
                  исчезают при перезагрузке.
                </p>
              </div>
              <button className="secondary-button" onClick={reset}>
                Сбросить демо
              </button>
            </div>
          </section>
        </div>
      )}
      <section
        hidden={section !== "Документы"}
        aria-label="Документы и состояние проекта"
      >
        {documents}
      </section>
      <footer className="studio-statusbar">
        <span>
          <span className={`status-dot ${paused ? "orange" : ""}`} />
          {paused ? "Демоочередь на паузе" : "Локальный деморежим"}
        </span>
        <span className="statusbar-note">Изменения до перезагрузки</span>
        <span className="statusbar-right">
          Интеграции не подключены <span className="status-divider">|</span>{" "}
          Демо: $186 / $250
        </span>
        <button className="text-button" onClick={() => setSection("Документы")}>
          Документы и проверка <Icon name="arrow" size={12} />
        </button>
      </footer>
      {modal && (
        <ModalFrame
          title={
            modal === "preview"
              ? `${selected.id} · Раскадровка`
              : modal === "feedback"
                ? `${selected.id} · Вернуть с правкой`
                : modal === "compare"
                  ? `${selected.id} · Выбрать начало`
                  : modal === "format"
                    ? formatStats[formatIndex].name
                    : "Как читаются показатели"
          }
          onClose={() => setModal(null)}
        >
          {modal === "preview" && (
            <>
              <p className="dialog-note">
                Демонстрационная структура. Готового видео пока нет.
              </p>
              <div className="storyboard">
                <Poster clip={selected} />
                <ol>
                  <li>
                    <time>00–02</time>
                    <strong>
                      {selected.hook === "B"
                        ? "Сначала результат"
                        : "Проблема или обещание"}
                    </strong>
                    <p>
                      {selected.hook === "B"
                        ? "Показать готовое приложение в действии."
                        : `Показать задачу из формата «${selected.format}».`}
                    </p>
                  </li>
                  <li>
                    <time>02–{selected.duration - 5}</time>
                    <strong>Процесс и доказательство</strong>
                    <p>
                      Показать изменение на экране. Один шаг — один понятный
                      результат.
                    </p>
                  </li>
                  <li>
                    <time>
                      {selected.duration - 5}–{selected.duration}
                    </time>
                    <strong>Следующий шаг для зрителя</strong>
                    <p>
                      Перейти на vibecoding.tech. Точный текст подготовим по
                      референсу.
                    </p>
                  </li>
                </ol>
              </div>
              {selected.feedback && (
                <div className="reason-box">
                  <p>Правка: {selected.feedback}</p>
                </div>
              )}
            </>
          )}
          {modal === "feedback" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!feedback.trim()) return;
                dispatch({ type: "feedback", id: selected.id, text: feedback });
                setModal(null);
                setNotice(
                  `${selected.id} · Возвращён в сценарий. Правка сохранена до перезагрузки.`,
                );
              }}
            >
              <label className="form-label" htmlFor="feedback">
                Что нужно изменить?
              </label>
              <textarea
                id="feedback"
                required
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Например: показать результат в первые две секунды"
                rows={4}
                maxLength={1000}
              />
              <p className="dialog-note">
                Ролик вернётся на этап «Сценарий». Комментарий останется в его
                карточке.
              </p>
              <button
                className="primary-button"
                disabled={!feedback.trim()}
                type="submit"
              >
                Сохранить правку
              </button>
            </form>
          )}
          {modal === "compare" && (
            <>
              <p className="dialog-note">
                Гипотеза: начало с готового результата лучше удерживает зрителя.
                Данных для выбора победителя пока нет.
              </p>
              <div className="variant-grid">
                {(["A", "B"] as const).map((variant) => (
                  <div className="variant" key={variant}>
                    <span className="variant-letter">{variant}</span>
                    <h3>
                      {variant === "A"
                        ? "Сначала проблема"
                        : "Сначала результат"}
                    </h3>
                    <p>
                      {variant === "A"
                        ? selected.format === "Челлендж"
                          ? "«Можно собрать приложение за 20 минут?»"
                          : "«До сих пор ведёшь всё в таблице?»"
                        : selected.format === "Челлендж"
                          ? "«Вот что получилось за 20 минут»"
                          : "«Это приложение я собрал из своей таблицы»"}
                    </p>
                    <span className="subtle">00:00–00:02 · пример текста</span>
                    <button
                      className="primary-button"
                      onClick={() => {
                        dispatch({ type: "hook", id: selected.id, variant });
                        setModal(null);
                        setNotice(
                          `${selected.id} · Выбрано начало ${variant}. Выпуск отправлен на проверку.`,
                        );
                      }}
                    >
                      Выбрать {variant}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {modal === "format" && (
            <>
              <p className="dialog-note">
                Демонстрационный рецепт · {formatStats[formatIndex].count}{" "}
                выпусков в выборке
              </p>
              <h3 className="dialog-subtitle">
                Следующий шаг: {formatStats[formatIndex].next.toLowerCase()}
              </h3>
              <p>{formatStats[formatIndex].note}</p>
              <div className="reason-box">
                <div>
                  <strong>Гипотеза, не подтверждённый вывод</strong>
                  <p>
                    Показатели на экране условные. Реальные референсы и
                    аналитика ещё не загружены.
                  </p>
                </div>
              </div>
              <button
                className="secondary-button"
                onClick={() => {
                  setQuery(formatStats[formatIndex].name);
                  setFilter("all");
                  setSection("Производство");
                  setModal(null);
                }}
              >
                Ролики этого формата <Icon name="arrow" />
              </button>
            </>
          )}
          {modal === "metric" && (
            <>
              <p className="dialog-note">
                Все показатели демонстрационные. Фиксированная неделя: 7–13
                сентября.
              </p>
              <dl className="metric-definitions">
                <div>
                  <dt>Переходы на сайт</dt>
                  <dd>
                    Визиты, помеченные UTM. Не уникальные люди и не клики по
                    ролику. {traffic.join(" + ")} = {number(visits)}.
                  </dd>
                </div>
                <div>
                  <dt>Подписки на сайте</dt>
                  <dd>
                    {subscriptions} завершённых подписок. Конверсия:{" "}
                    {subscriptions} ÷ {number(visits)} = 7,5%.
                  </dd>
                </div>
                <div>
                  <dt>Расход</dt>
                  <dd>
                    Условные $186 на производство и сервисы; $186 ÷ 96 = $1,94
                    за подписку. Это не реальные списания.
                  </dd>
                </div>
                <div>
                  <dt>Сравнение форматов</dt>
                  <dd>
                    Просмотры, среднее время просмотра в секундах и репосты ÷
                    просмотры за первые 72 часа выпуска. Медиана уменьшает
                    влияние отдельных всплесков.
                  </dd>
                </div>
              </dl>
            </>
          )}
        </ModalFrame>
      )}
    </main>
  );
}
