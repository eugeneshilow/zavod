import { Card } from "@heroui/react";
import { Header } from "../_components/shell";
import { buyProduct } from "./actions";
import { AutoRefresh } from "@/components/cabinet/auto-refresh";
import { DEMO_CUSTOMER } from "@/lib/cabinet";
import {
  loadAccountPayments,
  paymentsAccess,
  PRODUCTS,
  productTitle,
  rub,
  STATUS_WORD,
  tariffLine,
  tariffOf,
  type PaymentRow,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// Экран «Тариф»: строка тарифа, два товара с кнопкой «Оплатить», плашка
// возврата с оплаты и список платежей покупателя. Тариф считается из
// оплаченных строк. Канон — docs/payments/README.md, «Экраны».

const DATE = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function CabinetTariff({ searchParams }: PageProps<"/cabinet/tariff">) {
  const params = await searchParams;
  const orderId = typeof params.order === "string" ? params.order : null;
  const error = typeof params.error === "string" ? params.error : null;
  const keys = paymentsAccess();
  const payments = await loadAccountPayments(DEMO_CUSTOMER.account);
  const rows: PaymentRow[] = "reason" in payments ? [] : payments;
  const tariff = tariffOf(rows);
  const returned = orderId ? (rows.find((p) => p.orderId === orderId) ?? null) : null;
  return (
    <>
      <Header title="Тариф" subtitle={tariffLine(tariff)} order={false} />
      {orderId ? <Returned orderId={orderId} payment={returned} /> : null}
      {error ? <p className="text-sm text-danger">Оплата не началась: {error}.</p> : null}
      <section className="grid gap-4 md:grid-cols-2" aria-label="Товары">
        {PRODUCTS.map((p) => (
          <Card key={p.id}>
            <Card.Header>
              <Card.Title>{p.title}</Card.Title>
              <Card.Description>{p.note}</Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {rub(p.priceRub)}
              </p>
              {"reason" in keys ? (
                <p className="mt-4 text-sm text-muted">
                  Касса не подключена: нет YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY
                </p>
              ) : (
                <form action={buyProduct} className="mt-4">
                  <input type="hidden" name="product" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
                  >
                    Оплатить
                  </button>
                </form>
              )}
            </Card.Content>
          </Card>
        ))}
      </section>
      <Card>
        <Card.Header>
          <Card.Title>Платежи</Card.Title>
          <Card.Description>
            {tariff.reelsLeft
              ? `Оплачено разовых роликов: ${tariff.reelsLeft}`
              : "Разовых роликов не покупали"}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {"reason" in payments ? (
            <p className="text-sm text-muted">Данные не пришли: {payments.reason}.</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted">Платежей пока нет.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((p) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[96px_minmax(0,1fr)_76px_72px_32px] items-center gap-2 py-2.5 text-sm"
                >
                  <span className="text-muted tabular-nums">
                    {DATE.format(new Date(p.paidAt ?? p.createdAt))}
                  </span>
                  <span className="truncate">{productTitle(p.product)}</span>
                  <span className="text-right tabular-nums">{rub(p.amountRub)}</span>
                  <span
                    className={
                      p.status === "succeeded"
                        ? "text-accent"
                        : p.status === "canceled"
                          ? "text-danger"
                          : "text-muted"
                    }
                  >
                    {STATUS_WORD[p.status] ?? p.status}
                  </span>
                  <span className="text-xs text-muted">{p.test ? "тест" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Card.Content>
      </Card>
    </>
  );
}

/** Плашка после возврата с оплаты: статус строки, а не сам факт возврата. */
function Returned({ orderId, payment }: { orderId: string; payment: PaymentRow | null }) {
  if (payment?.status === "succeeded")
    return (
      <p className="rounded-xl border border-success px-4 py-3 text-sm font-medium text-success">
        Оплата прошла: {productTitle(payment.product)} · {rub(payment.amountRub)}
      </p>
    );
  if (payment?.status === "canceled")
    return (
      <p className="rounded-xl border border-danger px-4 py-3 text-sm text-danger">
        Платёж отменён: деньги не списаны
      </p>
    );
  return (
    <div className="rounded-xl border border-warning px-4 py-3 text-sm">
      <AutoRefresh everyMs={3000} active={payment !== null} />
      {payment
        ? "Ждём подтверждения от ЮKassa — страница обновится сама"
        : `Платёж ${orderId} не найден`}
    </div>
  );
}
