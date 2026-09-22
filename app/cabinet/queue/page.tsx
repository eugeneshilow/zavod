import { Header } from "../_components/shell";
import { ReelsTable } from "@/components/cabinet/reels-table";
import { loadCabinet } from "@/lib/cabinet";

export const dynamic = "force-dynamic";

export default async function CabinetQueue() {
  const data = await loadCabinet();
  return (
    <>
      <Header title="Очередь" />
      {"reason" in data ? (
        <p className="text-sm text-muted">Данные не пришли: {data.reason}.</p>
      ) : (
        <ReelsTable
          title="Ждут выхода"
          rows={data.rows.filter(
            (r) => r.status === "queued" || r.status === "rendering" || r.status === "failed",
          )}
        />
      )}
    </>
  );
}
