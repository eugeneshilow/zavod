import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { reelsAccess } from "@/lib/reels";

// Иммунитет рельсы публикации: счётчики очереди целиком и по дверям, время
// последнего прогона и включены ли кроны. Секретов не отдаёт. Сторож —
// .github/workflows/reels-alive.yml: он читает queue.failed, поэтому счётчики
// всей очереди остаются на верхнем уровне. Канон зоны — docs/publish.md.

export const dynamic = "force-dynamic";

export async function GET() {
  const access = reelsAccess();
  if ("reason" in access) {
    return NextResponse.json({ error: access.reason }, { status: 500 });
  }
  try {
    const health = await access.client.query(api.tables.data_cooked_instagram_reels.health, {
      token: access.token,
    });
    return NextResponse.json({
      queue: health.queue,
      byChannel: health.byChannel,
      lastRunAt: health.lastRunAt,
      cronsEnabled: health.cronsEnabled,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
