import { Header } from "../_components/shell";
import { Tabs } from "../_components/tabs";
import { ReelsTable } from "@/components/cabinet/reels-table";
import { CABINET_PATH, loadCabinet } from "@/lib/cabinet";

export const dynamic = "force-dynamic";

export default async function CabinetReels() {
  const data = await loadCabinet();
  return (
    <>
      <Header title="Ролики" />
      <Tabs active={`${CABINET_PATH}/reels`} />
      {"reason" in data ? (
        <p className="text-sm text-muted">Данные не пришли: {data.reason}.</p>
      ) : (
        <ReelsTable rows={data.rows} />
      )}
    </>
  );
}
