import { Header } from "./_components/shell";
import { Tabs } from "./_components/tabs";
import { StatCard } from "@/components/cabinet/stat-card";
import { ReleaseBars, TopReels } from "@/components/cabinet/charts";
import { ReelsTable } from "@/components/cabinet/reels-table";
import { CABINET_PATH, fmt, greeting, loadCabinet } from "@/lib/cabinet";

export const dynamic = "force-dynamic";

// Первый экран кабинета — шесть блоков канона docs/cabinet/README.md.

export default async function CabinetHome({ searchParams }: PageProps<"/cabinet">) {
  const params = await searchParams;
  const ordered = params.order === "ok";
  const data = await loadCabinet();
  if ("reason" in data) {
    return (
      <>
        <Header title="Кабинет" />
        <p className="text-sm text-muted">Данные не пришли: {data.reason}.</p>
      </>
    );
  }
  return (
    <>
      <Header title={greeting(data.now, data.customer.name)} />
      <Tabs active={CABINET_PATH} />
      {ordered ? (
        <p
          role="status"
          className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground"
        >
          Заказ принят, идея в очереди. Робот берёт её в течение десяти минут, дальше ролик
          собирается примерно за шесть.
        </p>
      ) : null}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Показатели">
        <StatCard
          label="В эфире"
          value={fmt(data.stats.live)}
          chip={data.week.posts7d ? `+${data.week.posts7d}` : null}
        />
        <StatCard label="Просмотров за неделю" value={fmt(data.stats.views7d)} />
        <StatCard
          label="В очереди"
          value={fmt(data.stats.queued)}
          note={data.stats.queued ? "≈ 6 мин каждый" : null}
        />
        <StatCard label="Всего роликов" value={fmt(data.stats.total)} />
      </section>
      <section className="grid gap-4 xl:grid-cols-2" aria-label="Графики">
        <ReleaseBars data={data} />
        <TopReels data={data} />
      </section>
      <ReelsTable rows={data.rows.slice(0, 12)} />
    </>
  );
}
