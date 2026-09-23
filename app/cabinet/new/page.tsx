import { Header } from "../_components/shell";
import { OrderForm } from "@/components/cabinet/order-form";
import { OrderPreview } from "@/components/cabinet/order-preview";

// Экран заказа «Сделать ролик» — раздел «Экран заказа» канона docs/cabinet/README.md.

export default function CabinetNew() {
  return (
    <>
      <Header
        title="Сделать ролик"
        subtitle="Идея в вертикальный ролик за шесть минут"
        order={false}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <OrderForm />
        <OrderPreview />
      </div>
    </>
  );
}
