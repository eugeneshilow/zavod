import { BAND_CLASS, SECTION_CLASS } from "@/lib/layout";
import { PRODUCTS, rub } from "@/lib/payments";
import { Check } from "lucide-react";

// Блок 7 витрины: цена. Форма снята с блока pricing-17 автора LN (21st.dev) —
// одна карточка тарифа со списком «что входит»; у нас колонки стоят рядом, а не
// друг под другом, потому что цена одна и список короткий. Канон блоков —
// docs/landing/README.md. Цены — из кассы (lib/payments.ts, PRODUCTS), те же, что
// в оферте и кабинете.

const INCLUDED = [
  "вертикальный ролик до 60 секунд",
  "голос, карточки, цитаты, субтитры",
  "подпись для публикации",
  "готов через шесть минут",
  "один круг правок",
];

export function PricingCard() {
  return (
    <section id="price" className={SECTION_CLASS}>
      <div className={BAND_CLASS}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">Цена</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Ролик или месяц
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-foreground/10 bg-background p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <ul className="flex flex-col gap-5">
                {PRODUCTS.map((p) => (
                  <li key={p.id}>
                    <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
                      {p.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                      {rub(p.priceRub)}
                    </p>
                    <p className="mt-1 text-sm text-foreground/50">{p.note}</p>
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Сделать ролик
              </a>
            </div>

            <ul className="flex flex-col gap-3 md:border-l md:border-foreground/10 md:pl-8">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/70">
                  <Check className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
