// Единый гейт непубличных Convex-функций: строка-пропуск из переменной
// окружения ADMIN_API_TOKEN. То же значение лежит в Vercel, им ходят
// страница /admin и проверка /api/reels/health. Значение не печатается
// ни в ошибку, ни в лог. Канон зоны — docs/publish.md.

/** Сравнение за постоянное время: длина и содержимое не утекают по таймингу. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function requireAdminToken(token: string): void {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) throw new Error("ADMIN_API_TOKEN не задан в Convex env — доступ закрыт");
  if (!safeEqual(token, expected)) throw new Error("невалидный admin-токен");
}
