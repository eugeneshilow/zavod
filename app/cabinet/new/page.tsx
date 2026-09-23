import { cookies } from "next/headers";
import { Header } from "../_components/shell";
import { parsePrefs, PREFS_COOKIE } from "@/lib/cabinet";
import { OrderForm } from "@/components/cabinet/order-form";
import { OrderPreview } from "@/components/cabinet/order-preview";

// Экран заказа «Сделать ролик» — раздел «Экран заказа» канона docs/cabinet/README.md.

export default async function CabinetNew({ searchParams }: PageProps<"/cabinet/new">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  return (
    <>
      <Header
        title="Сделать ролик"
        subtitle="Идея в вертикальный ролик за шесть минут"
        order={false}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <OrderForm error={error} prefs={prefs} />
        <OrderPreview />
      </div>
    </>
  );
}
