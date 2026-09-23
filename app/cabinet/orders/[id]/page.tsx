import Link from "next/link";
import { Header } from "../../_components/shell";
import { AutoRefresh } from "@/components/cabinet/auto-refresh";
import { OrderProgress } from "@/components/cabinet/order-progress";
import { CABINET_PATH, loadOrder } from "@/lib/cabinet";

export const dynamic = "force-dynamic";

// Страница заказа: куда ведёт кнопка «Сделать ролик» и строка заказа на
// главной. Шаги считает `orderSteps` в переносчике; экран переспрашивает
// сервер каждые четыре секунды, пока путь не закончен.
// Канон — docs/cabinet/README.md, «Страница заказа».

export default async function CabinetOrder({
  params,
  searchParams,
}: PageProps<"/cabinet/orders/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : null;
  const view = await loadOrder(id);
  if (view === null || (view && "reason" in view)) {
    return (
      <>
        <Header title="Заказ" />
        <p className="text-sm text-muted">
          {view === null ? "Такого заказа нет." : `Данные не пришли: ${view.reason}.`}{" "}
          <Link href={CABINET_PATH} className="underline">
            На главную
          </Link>
        </p>
      </>
    );
  }
  return (
    <>
      <Header title="Заказ ролика" subtitle="Шаги обновляются сами" />
      <AutoRefresh everyMs={4000} active={!view.final} />
      <OrderProgress view={view} error={error} />
    </>
  );
}
