// Чистые правила реестра медиа: без Convex ctx, тестируются как обычный код.
// Канон зоны — docs/social/instagram.md, «Удалённые».

export type RegistryRow = { id: string; mediaId: string; missingSince?: number };

/**
 * Кого площадка перестала отдавать. На вход — реестр аккаунта и все id из
 * полного ответа API; на выход — строки, которым пора поставить missingSince.
 *
 * Уже помеченные не трогаем: пометка ставится один раз, это наблюдение, а не
 * статус. Пустой ответ API при непустом реестре считаем сбоем площадки, а не
 * удалением всего эфира, — не помечаем никого.
 */
export function findMissing<T extends RegistryRow>(registry: T[], apiIds: Set<string>): string[] {
  if (apiIds.size === 0) return [];
  return registry
    .filter((row) => row.missingSince === undefined && !apiIds.has(row.mediaId))
    .map((row) => row.id);
}
