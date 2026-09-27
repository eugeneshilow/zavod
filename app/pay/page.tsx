import type { Metadata } from "next";
import Link from "next/link";
import { paySite } from "./actions";
import { Logo } from "@/components/brand/logo";
import { AutoRefresh } from "@/components/cabinet/auto-refresh";
import { BAND_CLASS } from "@/lib/layout";
import { TELEGRAM_URL } from "@/lib/landing-copy";
import {
  loadAccountPayments,
  paymentsAccess,
  PRODUCTS,
  productTitle,
  rub,
  SELLER,
  SITE_ACCOUNT,
  type PaymentRow,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

// Оплата на витрине: открытая страница zavod.today, вход не нужен. Почта,
// две карточки товаров с кнопкой «Оплатить», строка об оферте, реквизиты
// продавца. После возврата с ЮKassa — плашка статуса строки по номеру заказа
// и что делать дальше. Канон — docs/payments/README.md, «Путь оплаты» и
// «Проверка сайта ЮKassa».

export const metadata: Metadata = {
  title: "Оплата — zavod.today",
  description: "Оплатить разовый ролик или месяц zavod.today картой через ЮKassa.",
  robots: { index: true, follow: true },
};

const LINK = "underline underline-offset-2 transition-colors hover:text-foreground";

export default async function PayPage({ searchParams }: PageProps<"/pay">) {
  const params = await searchParams;
  const orderId = typeof params.order === "string" ? params.order : null;
  const error = typeof params.error === "string" ? params.error : null;
  const keys = paymentsAccess();
  let returned: PaymentRow | null = null;
  if (orderId) {
    const rows = await loadAccountPayments(SITE_ACCOUNT);
    returned = "reason" in rows ? null : (rows.find((p) => p.orderId === orderId) ?? null);
  }
  const mail = (
    <a href={`mailto:${SELLER.email}`} className={LINK}>
      {SELLER.email}
    </a>
  );
  return (
    <main className="flex w-full flex-1 flex-col bg-background">
      <header className={`${BAND_CLASS} pt-8`}>
        <Link href="/" aria-label="zavod, на главную" className="inline-block">
          <Logo height={54} />
        </Link>
      </header>

      <article className={`${BAND_CLASS} py-12 md:py-20`}>
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
            Оплата
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Ролик или месяц
          </h1>

          {orderId ? <Returned orderId={orderId} payment={returned} /> : null}
          {error ? <p className="mt-6 text-sm text-red-700">Оплата не началась: {error}.</p> : null}

          {"reason" in keys ? (
            <p className="mt-8 text-base text-foreground/70">
              Касса не подключена. Напишите на {mail}, пришлём счёт.
            </p>
          ) : (
            <form action={paySite} className="mt-8 flex flex-col gap-6" aria-label="Оплата">
              {/* Enter в поле почты не покупает первый товар: неактивная кнопка по умолчанию гасит неявную отправку формы. */}
              <button type="submit" disabled hidden aria-hidden="true" />
              <label className="flex max-w-sm flex-col gap-1.5">
                <span className="text-sm font-medium">Почта</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.ru"
                  className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
                />
                <span className="text-xs text-foreground/50">
                  На неё придёт чек, по ней мы с вами свяжемся
                </span>
              </label>

              <section className="grid gap-4 md:grid-cols-2" aria-label="Товары">
                {PRODUCTS.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-foreground/10 p-6">
                    <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
                      {p.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                      {rub(p.priceRub)}
                    </p>
                    <p className="mt-1 text-sm text-foreground/50">{p.note}</p>
                    <button
                      type="submit"
                      name="product"
                      value={p.id}
                      className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                    >
                      Оплатить
                    </button>
                  </div>
                ))}
              </section>

              <div className="flex flex-col gap-2 text-sm text-foreground/70">
                <p>
                  Нажимая «Оплатить», вы принимаете{" "}
                  <Link href="/offer" className={LINK}>
                    оферту
                  </Link>
                  .
                </p>
                <p>
                  Оплата картой через ЮKassa. Данные карты вводятся на странице ЮKassa, к нам они не
                  попадают.
                </p>
              </div>
            </form>
          )}

          <section className="mt-12 border-t border-foreground/10 pt-8">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">После оплаты</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/70 md:text-base">
              Пришлите ссылку на новость и номер заказа в{" "}
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                Telegram
              </a>{" "}
              или на {mail}. Готовый ролик пришлём туда же.
            </p>
          </section>

          <p className="mt-12 text-xs leading-relaxed text-foreground/50">
            {SELLER.name} · ИНН {SELLER.inn} · ОГРНИП {SELLER.ogrnip} · {SELLER.email}
          </p>
        </div>
      </article>
    </main>
  );
}

/** Плашка после возврата с оплаты: статус строки, а не сам факт возврата. */
function Returned({ orderId, payment }: { orderId: string; payment: PaymentRow | null }) {
  if (payment?.status === "succeeded")
    return (
      <div className="mt-8 rounded-2xl border-2 border-emerald-600 px-5 py-4 text-base text-emerald-800">
        <p className="font-bold">
          Оплата прошла: {productTitle(payment.product)} · {rub(payment.amountRub)}
        </p>
        <p className="mt-1">
          Номер заказа {orderId}. Пришлите его вместе со ссылкой на новость — порядок ниже.
        </p>
      </div>
    );
  if (payment?.status === "canceled")
    return (
      <p className="mt-8 rounded-2xl border-2 border-red-600 px-5 py-4 text-base text-red-800">
        Платёж отменён: деньги не списаны
      </p>
    );
  if (payment?.status === "refunded")
    return (
      <p className="mt-8 rounded-2xl border border-foreground/15 px-5 py-4 text-base text-foreground/70">
        Деньги вернули: {productTitle(payment.product)} · {rub(payment.amountRub)}
      </p>
    );
  return (
    <div className="mt-8 rounded-2xl border-2 border-amber-400 px-5 py-4 text-base">
      <AutoRefresh everyMs={3000} active={payment !== null} />
      {payment
        ? "Ждём подтверждения от ЮKassa — страница обновится сама"
        : `Платёж ${orderId} не найден`}
    </div>
  );
}
