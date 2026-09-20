import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Расписание рельсы публикации. Рубильник — переменная окружения Convex
// INSTAGRAM_CRONS_ENABLED: пока она не равна "true", кронов нет в расписании
// вовсе. Значение читается в момент деплоя Convex, а не на каждом тике.
// Канон зоны — docs/publish.md.

const crons = cronJobs();

if (process.env.INSTAGRAM_CRONS_ENABLED === "true") {
  crons.interval(
    "instagram-run-queue",
    { minutes: 30 },
    internal.workflows.instagram_publishing.runQueue,
    {},
  );
  crons.interval(
    "instagram-collect-metrics",
    { hours: 6 },
    internal.workflows.instagram_publishing.collectMetrics,
    {},
  );
  crons.daily(
    "instagram-refresh-token",
    { hourUTC: 0, minuteUTC: 20 },
    internal.workflows.instagram_publishing.refreshToken,
    {},
  );
}

export default crons;
