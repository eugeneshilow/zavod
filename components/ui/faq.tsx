import { ChevronDown } from "lucide-react";
import { FAQ, TELEGRAM_URL } from "@/lib/landing-copy";

// Блок 9 витрины: вопросы и ответы. Форма снята с блока faqs-01 автора LN
// (21st.dev): заголовок по центру, список раскрывашек, внизу пилюля «остался
// вопрос». Раскрывашки — родные details/summary, без клиентского кода. Пары
// вопросов живут в lib/landing-copy.ts. Канон блоков — docs/landing/README.md.

export function Faq() {
  return (
    <section id="faq" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
            Вопросы и ответы
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Что спрашивают перед первым заказом
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl divide-y divide-foreground/10">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-foreground/50 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pt-2 text-sm leading-relaxed text-foreground/70">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-between gap-4 rounded-full border border-foreground/10 px-6 py-4 sm:flex-row">
          <p className="font-medium">Остался вопрос?</p>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Написать в Telegram
          </a>
        </div>
      </div>
    </section>
  );
}
