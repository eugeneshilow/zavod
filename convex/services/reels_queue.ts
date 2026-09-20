// Правила очереди Reels: что считается годным входом, что протухло и что
// делать с неудачной попыткой. Чистые функции без Convex ctx — их держат
// тесты (tests/reels.test.ts), а таблица и воркер только исполняют.
// Канон зоны — docs/publish.md.

/** Гейт свежести: ролик, пролежавший в очереди дольше двух суток, не постится. */
export const MAX_QUEUE_AGE_MS = 48 * 60 * 60 * 1000;

/** Сколько раз пробуем опубликовать один ролик, прежде чем сдаться. */
export const MAX_ATTEMPTS = 3;

/** На сколько сдвигается план после неудачной попытки. */
export const RETRY_DELAY_MS = 2 * 60 * 60 * 1000;

export function isStaleForPosting(freshnessFrom: number, now: number): boolean {
  return now - freshnessFrom > MAX_QUEUE_AGE_MS;
}

/**
 * Источник видео ровно один: публичный адрес XOR файл в хранилище.
 * Ни одного — постить нечего; оба — неясно, что именно уедет в эфир.
 */
export function videoSourceOf(args: {
  videoUrl?: string;
  storageId?: string;
}): { kind: "url"; videoUrl: string } | { kind: "storage"; storageId: string } {
  const videoUrl = args.videoUrl?.trim();
  const hasVideoUrl = videoUrl !== undefined && videoUrl.length > 0;
  const hasStorageId = args.storageId !== undefined;
  if (hasVideoUrl === hasStorageId) {
    throw new Error("нужен ровно один источник видео: videoUrl XOR storageId");
  }
  return hasVideoUrl
    ? { kind: "url", videoUrl: videoUrl as string }
    : { kind: "storage", storageId: args.storageId as string };
}

/**
 * Чьим токеном публиковать: строго токеном того аккаунта, чей материал забрала
 * дверь. Чужой токен не подставляется даже когда он один-единственный — пост
 * уехал бы не в тот аккаунт, и это необратимо.
 */
export function stateForAccount<T extends { account: string }>(
  states: readonly T[],
  account: string,
): T | null {
  return states.find((state) => state.account === account) ?? null;
}

export type FailurePlan =
  | { status: "approved"; attempts: number; scheduledAt: number; alert: false }
  | { status: "failed"; attempts: number; alert: true };

/**
 * Что делать с упавшей публикацией. Первая и вторая неудача возвращают ролик
 * в очередь со сдвигом плана; третья гасит его и зажигает тревогу.
 */
export function planAfterFailure(args: {
  attemptsBefore: number;
  now: number;
  scheduledAt?: number;
}): FailurePlan {
  const attempts = args.attemptsBefore + 1;
  if (attempts >= MAX_ATTEMPTS) return { status: "failed", attempts, alert: true };
  const base = Math.max(args.scheduledAt ?? 0, args.now);
  return { status: "approved", attempts, scheduledAt: base + RETRY_DELAY_MS, alert: false };
}
