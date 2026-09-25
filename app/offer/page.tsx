import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { BAND_CLASS } from "@/lib/layout";
import { TELEGRAM_URL } from "@/lib/landing-copy";
import { PRODUCTS, rub, SELLER } from "@/lib/payments";

// Оферта и контакты: открытая страница на zavod.today, вход не нужен. Кто
// продаёт, что продаётся, как выдаётся, как вернуть деньги, как связаться.
// Реквизиты и товары — из переносчика lib/payments.ts (SELLER, PRODUCTS).
// Канон — docs/payments/README.md, «Бой: чеки, оферта, возвраты».

export const metadata: Metadata = {
  title: "Оферта — zavod.today",
  description:
    "Кто продаёт ролики zavod.today, что входит, цены, как вернуть деньги и как связаться.",
  robots: { index: true, follow: true },
};

/** Дата редакции: правка текста оферты — новая дата. */
const EDITION = "25 сентября 2026";

const LINK = "underline underline-offset-2 transition-colors hover:text-foreground";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-foreground/10 py-8">
      <h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-foreground/70 md:text-base">
        {children}
      </div>
    </section>
  );
}

export default function OfferPage() {
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
            Документы
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Оферта и контакты
          </h1>
          <div
            role="note"
            className="mt-6 rounded-2xl border-2 border-amber-400 bg-amber-50 px-5 py-4 text-base leading-relaxed text-amber-950"
          >
            <p className="font-bold">Это пример оферты, а не юридический документ.</p>
            <p className="mt-2">
              zavod.today — учебный проект курса vibecoding.ru: на нём показано, как устроить кассу.
              Текст ниже написан для примера, юрист его не проверял. Для настоящей оферты своего
              продукта обратитесь к юристу.
            </p>
          </div>
          <p className="mt-6 text-base leading-relaxed text-foreground/70">
            Здесь условия, на которых zavod.today продаёт ролики. Нажимая «Оплатить» в кабинете, вы
            принимаете эти условия.
          </p>

          <div className="mt-10">
            <Section title="Кто продаёт">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                <dt className="text-foreground/50">Продавец</dt>
                <dd>{SELLER.name}</dd>
                <dt className="text-foreground/50">ИНН</dt>
                <dd className="tabular-nums">{SELLER.inn}</dd>
                <dt className="text-foreground/50">ОГРНИП</dt>
                <dd className="tabular-nums">{SELLER.ogrnip}</dd>
                <dt className="text-foreground/50">Почта</dt>
                <dd>{mail}</dd>
              </dl>
            </Section>

            <Section title="Что продаётся">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-foreground/50">
                      <th className="py-2 pr-4 font-medium">Товар</th>
                      <th className="py-2 pr-4 font-medium">Что входит</th>
                      <th className="py-2 text-right font-medium">Цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCTS.map((p) => (
                      <tr key={p.id} className="border-t border-foreground/10">
                        <td className="py-3 pr-4 font-medium text-foreground">{p.title}</td>
                        <td className="py-3 pr-4">{p.note}</td>
                        <td className="py-3 text-right whitespace-nowrap text-foreground tabular-nums">
                          {rub(p.priceRub)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>Оплата через ЮKassa. Месяц считается с дня оплаты.</p>
            </Section>

            <Section title="Как выдаётся">
              <p>
                Всё выдаётся в личном кабинете на app.zavod.today. После оплаты вы заказываете ролик
                в кабинете, и готовый ролик появляется там же.
              </p>
            </Section>

            <Section title="Как вернуть деньги">
              <p>Чтобы вернуть деньги, напишите на {mail}.</p>
              <p>
                За разовый ролик вернём деньги, если написали до того, как ролик вышел. За месяц —
                если написали в течение 14 дней с оплаты и за это время не заказали ни одного
                ролика.
              </p>
            </Section>

            <Section title="Какие данные мы берём">
              <p>
                Для оплаты мы берём только почту: на неё ЮKassa присылает чек. Данные карты вводятся
                на странице ЮKassa, к нам они не попадают.
              </p>
              <p>
                Почта хранится вместе с платежом и нужна для чека и ответа на ваше письмо. Чтобы мы
                её удалили, напишите на {mail}.
              </p>
            </Section>

            <Section title="Как связаться">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                <dt className="text-foreground/50">Почта</dt>
                <dd>{mail}</dd>
                <dt className="text-foreground/50">Telegram</dt>
                <dd>
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                    написать
                  </a>
                </dd>
              </dl>
            </Section>
          </div>

          <div className="flex flex-col gap-2 border-t border-foreground/10 pt-6 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between">
            <p>Редакция от {EDITION}</p>
            <Link href="/" className={LINK}>
              На главную
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
