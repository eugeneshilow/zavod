import { Clapperboard, Link as LinkIcon, Mic, type LucideIcon } from "lucide-react";

// Блок 4 витрины: как это работает. Форма снята с блока how-it-works-01 автора
// LN (21st.dev): подпись капсом и заголовок по центру, три карточки с номерами
// 01–03 и иконкой, под ними одна чёрная кнопка. Канон блоков —
// docs/landing/README.md.

const STEPS: { n: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    n: "01",
    icon: LinkIcon,
    title: "Вставьте ссылку",
    body: "Любая новость: статья, пост, пресс-релиз. Завод сам вытащит суть и напишет историю на минуту.",
  },
  {
    n: "02",
    icon: Mic,
    title: "Выберите голос",
    body: "Рассказчик, темп и подача. Голос читает историю слово в слово, без запинок и переписок.",
  },
  {
    n: "03",
    icon: Clapperboard,
    title: "Заберите ролик",
    body: "Вертикальный файл с карточками, цитатами и субтитрами плюс подпись для публикации. Через шесть минут.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
            Как это работает
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Три шага от ссылки до ролика
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <div key={n} className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-[0.2em] text-foreground/50">{n}</span>
                <Icon className="size-5 text-foreground/70" strokeWidth={1.5} />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#cta"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Сделать ролик
          </a>
        </div>
      </div>
    </section>
  );
}
