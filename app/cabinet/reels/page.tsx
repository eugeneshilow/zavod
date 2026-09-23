import Link from "next/link";
import { Header } from "../_components/shell";
import { Tabs } from "../_components/tabs";
import { ReelCard } from "@/components/cabinet/reel-card";
import {
  CABINET_PATH,
  filterRows,
  loadCabinet,
  REELS_FILTERS,
  type ReelsFilter,
} from "@/lib/cabinet";

export const dynamic = "force-dynamic";

// Экран «Ролики»: все ролики покупателя карточками с превью и фильтром по
// статусу. Канон — docs/cabinet/README.md, «Ролики».

export default async function CabinetReels({ searchParams }: PageProps<"/cabinet/reels">) {
  const params = await searchParams;
  const filter = (REELS_FILTERS.find((f) => f.id === params.f)?.id ?? "all") as ReelsFilter;
  const data = await loadCabinet();
  if ("reason" in data) {
    return (
      <>
        <Header title="Ролики" />
        <p className="text-sm text-muted">Данные не пришли: {data.reason}.</p>
      </>
    );
  }
  const rows = filterRows(data.rows, filter);
  return (
    <>
      <Header title="Ролики" ring={data.fresh} events={data.events} />
      <Tabs active={`${CABINET_PATH}/reels`} />
      <nav className="flex flex-wrap gap-2" aria-label="Фильтр роликов">
        {REELS_FILTERS.map((f) => {
          const count = filterRows(data.rows, f.id).length;
          const on = f.id === filter;
          return (
            <Link
              key={f.id}
              href={f.id === "all" ? `${CABINET_PATH}/reels` : `${CABINET_PATH}/reels?f=${f.id}`}
              aria-current={on ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                on
                  ? "border-accent bg-accent-soft text-accent-soft-foreground"
                  : "border-border text-muted"
              }`}
            >
              {f.label} <span className="tabular-nums opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Здесь пусто. Нажмите «Сделать ролик», и он появится в этом списке.
        </p>
      ) : (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {rows.map((row, i) => (
            <ReelCard key={row.id} row={row} index={i} />
          ))}
        </section>
      )}
    </>
  );
}
