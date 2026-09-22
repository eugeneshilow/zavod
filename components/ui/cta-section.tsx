import { BAND_CLASS, SECTION_CLASS } from "@/lib/layout";
import { TELEGRAM_URL } from "@/lib/landing-copy";

// Блок 10 витрины: финальный призыв. Форма снята с блока cta-01 автора Felipe
// Menezes (21st.dev): скруглённая плашка, одна фраза, одна чёрная кнопка. Фон у
// донора серый, у нас белый: серых лент на витрине нет. Канон блоков —
// docs/landing/README.md.

export function CtaSection() {
  return (
    <section id="cta" className={SECTION_CLASS}>
      <div className={BAND_CLASS}>
        <div className="rounded-3xl border border-foreground/10 px-8 py-16 text-center">
          <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Есть новость? Сделаем ролик, пока она горячая.
          </h2>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Написать в Telegram
          </a>
          <p className="mt-4 text-xs text-foreground/50">
            Форма заказа на сайте появится следующим шагом.
          </p>
        </div>
      </div>
    </section>
  );
}
