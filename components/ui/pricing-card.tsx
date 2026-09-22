import { Check } from "lucide-react";

// Блок 7 витрины: цена. Форма снята с блока pricing-17 автора LN (21st.dev) —
// одна карточка тарифа со списком «что входит»; у нас колонки стоят рядом, а не
// друг под другом, потому что цена одна и список короткий. Канон блоков —
// docs/landing/README.md.

const INCLUDED = [
  "вертикальный ролик до 60 секунд",
  "голос, карточки, цитаты, субтитры",
  "подпись для публикации",
  "готов через шесть минут",
  "один круг правок",
];

export function PricingCard() {
  return (
    <section id="price" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">Цена</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Один тариф на старт
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-foreground/10 bg-background p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
                Ролик поштучно
              </p>
              <p className="mt-4 text-3xl font-bold tracking-tight text-balance">
                Цена за ролик: договоримся на первом заказе
              </p>
              <p className="mt-3 text-sm text-foreground/50">Подписка появится позже.</p>
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
