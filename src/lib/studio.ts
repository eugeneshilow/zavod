export type Stage =
  "review" | "error" | "rendering" | "queued" | "hook" | "script";
export type Clip = {
  id: string;
  title: string;
  format: string;
  stage: Stage;
  day: "Сегодня" | "Завтра";
  time: string;
  duration: number;
  recipe: string;
  theme: "mint" | "ink" | "sand" | "lilac";
  hook?: "A" | "B";
  feedback?: string;
};
export const stages: Record<Stage, { label: string; next: string }> = {
  review: { label: "На проверке", next: "Согласовать" },
  error: { label: "Ошибка звука", next: "Повторить озвучку" },
  rendering: { label: "Рендер · 77%", next: "Демо рендера" },
  queued: { label: "В очереди", next: "Готов к публикации" },
  hook: { label: "Выбор начала", next: "Сравнить A / B" },
  script: { label: "Сценарий", next: "Открыть сценарий" },
};
export const initialClips: Clip[] = [
  {
    id: "042",
    title: "Таблица → приложение",
    format: "До / После",
    stage: "review",
    day: "Сегодня",
    time: "18:30",
    duration: 22,
    recipe: "v3",
    theme: "mint",
  },
  {
    id: "041",
    title: "Ошибка новичка",
    format: "Разбор",
    stage: "error",
    day: "Сегодня",
    time: "18:10",
    duration: 28,
    recipe: "v2",
    theme: "sand",
  },
  {
    id: "043",
    title: "Один запрос",
    format: "Эксперимент",
    stage: "rendering",
    day: "Сегодня",
    time: "19:10",
    duration: 19,
    recipe: "v1",
    theme: "lilac",
  },
  {
    id: "044",
    title: "Миф про AI",
    format: "Миф / Факт",
    stage: "queued",
    day: "Сегодня",
    time: "20:00",
    duration: 24,
    recipe: "v2",
    theme: "ink",
  },
  {
    id: "045",
    title: "Челлендж: 20 минут",
    format: "Челлендж",
    stage: "hook",
    day: "Сегодня",
    time: "21:00",
    duration: 32,
    recipe: "v1",
    theme: "sand",
  },
  {
    id: "046",
    title: "Приложение для себя",
    format: "До / После",
    stage: "script",
    day: "Завтра",
    time: "12:00",
    duration: 25,
    recipe: "v3",
    theme: "mint",
  },
  {
    id: "047",
    title: "Три коротких шага",
    format: "Разбор",
    stage: "queued",
    day: "Завтра",
    time: "15:00",
    duration: 21,
    recipe: "v2",
    theme: "lilac",
  },
  {
    id: "048",
    title: "Лендинг за вечер",
    format: "До / После",
    stage: "queued",
    day: "Сегодня",
    time: "21:30",
    duration: 30,
    recipe: "v3",
    theme: "ink",
  },
  {
    id: "049",
    title: "AI заменит разработчика?",
    format: "Миф / Факт",
    stage: "script",
    day: "Сегодня",
    time: "22:00",
    duration: 26,
    recipe: "v2",
    theme: "sand",
  },
  {
    id: "050",
    title: "От идеи до кнопки",
    format: "Разбор",
    stage: "script",
    day: "Сегодня",
    time: "22:30",
    duration: 24,
    recipe: "v2",
    theme: "mint",
  },
  {
    id: "051",
    title: "Бот без кода",
    format: "Эксперимент",
    stage: "script",
    day: "Завтра",
    time: "17:00",
    duration: 20,
    recipe: "v1",
    theme: "lilac",
  },
  {
    id: "052",
    title: "Один экран, одна задача",
    format: "До / После",
    stage: "queued",
    day: "Завтра",
    time: "19:00",
    duration: 23,
    recipe: "v3",
    theme: "ink",
  },
];
export const needsDecision = (clip: Clip) =>
  ["review", "error", "hook"].includes(clip.stage);
export type ClipAction =
  | { type: "approve" | "retry"; id: string }
  | { type: "feedback"; id: string; text: string }
  | { type: "hook"; id: string; variant: "A" | "B" }
  | { type: "experiment" }
  | { type: "reset" };
export function transitionClips(clips: Clip[], action: ClipAction): Clip[] {
  if (action.type === "reset") return initialClips;
  if (action.type === "experiment") {
    if (clips.some((clip) => clip.id === "053")) return clips;
    return [
      ...clips,
      {
        id: "053",
        title: "Таблица → приложение: тест начала",
        format: "До / После",
        stage: "hook",
        day: "Завтра",
        time: "20:00",
        duration: 22,
        recipe: "v3 · тест",
        theme: "mint",
      },
    ];
  }
  return clips.map((clip) => {
    if (clip.id !== action.id) return clip;
    if (action.type === "approve" && clip.stage === "review")
      return { ...clip, stage: "queued" };
    if (action.type === "retry" && clip.stage === "error")
      return { ...clip, stage: "review" };
    if (
      action.type === "feedback" &&
      action.text.trim() &&
      clip.stage !== "rendering"
    )
      return { ...clip, stage: "script", feedback: action.text.trim() };
    if (action.type === "hook" && clip.stage === "hook")
      return { ...clip, stage: "review", hook: action.variant };
    return clip;
  });
}
export type ClipFilter = "all" | "attention" | "today";
export function filterClips(
  clips: Clip[],
  query: string,
  filter: ClipFilter,
  sort: "default" | "time" | "id",
) {
  const search = query.trim().toLocaleLowerCase("ru");
  const result = clips.filter((clip) => {
    if (filter === "attention" && !needsDecision(clip)) return false;
    if (filter === "today" && clip.day !== "Сегодня") return false;
    return `${clip.id} ${clip.title} ${clip.format} ${stages[clip.stage].label}`
      .toLocaleLowerCase("ru")
      .includes(search);
  });
  if (sort === "id") result.sort((a, b) => b.id.localeCompare(a.id));
  if (sort === "time")
    result.sort((a, b) =>
      a.day === b.day
        ? a.time.localeCompare(b.time)
        : a.day === "Сегодня"
          ? -1
          : 1,
    );
  return result;
}
export const traffic = [92, 137, 160, 178, 211, 240, 266];
export const visits = traffic.reduce((sum, value) => sum + value, 0);
export const subscriptions = 96;
export const formatStats = [
  {
    name: "До / После",
    count: 12,
    views: "42,8 тыс.",
    watch: "17,4 с",
    shares: "2,1%",
    points: [4, 6, 5, 9, 8, 12, 11, 15],
    tone: "good",
    next: "Тест начала",
    note: "Показать результат в первые две секунды. Проверить на сопоставимых выпусках.",
  },
  {
    name: "Разбор",
    count: 8,
    views: "31,2 тыс.",
    watch: "14,1 с",
    shares: "1,6%",
    points: [4, 6, 5, 7, 6, 9, 7, 11],
    tone: "good",
    next: "Продолжить",
    note: "Сохранить подачу и накопить выпуски. Рост на демографике — иллюстрация, не вывод.",
  },
  {
    name: "Челлендж",
    count: 4,
    views: "55,4 тыс.",
    watch: "15,8 с",
    shares: "2,8%",
    points: [4, 8, 3, 10, 5, 12, 8, 11],
    tone: "warm",
    next: "Набрать данные",
    note: "Большой разброс и четыре выпуска. Результат пока может быть случайным.",
  },
  {
    name: "Миф / Факт",
    count: 3,
    views: "16,7 тыс.",
    watch: "10,2 с",
    shares: "0,7%",
    points: [12, 13, 10, 11, 7, 8, 5, 6],
    tone: "muted",
    next: "Проверить начало",
    note: "Проверить ясность обещания в начале. Три выпуска не подтверждают закономерность.",
  },
  {
    name: "Эксперимент",
    count: 1,
    views: "8,3 тыс.",
    watch: "12,0 с",
    shares: "1,0%",
    points: [5],
    tone: "muted",
    next: "Рано оценивать",
    note: "Один выпуск. Сравнение динамики и вывод о победителе недоступны.",
  },
];
