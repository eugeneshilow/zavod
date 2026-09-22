import { Captions, Hash, Mic, Quote, type LucideIcon } from "lucide-react";

// Блок 6 витрины: что внутри ролика. Форма снята с блока bento-01 автора LN
// (21st.dev): подпись капсом, заголовок, ровно четыре карточки с иконкой в
// скруглённом квадрате. Цветные акценты донора сняты — на витрине один цвет.
// Канон блоков — docs/landing/README.md.

const CARDS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Mic,
    title: "Голос рассказчика",
    body: "Историю читает живой на слух голос, а не робот из переводчика.",
  },
  {
    icon: Hash,
    title: "Карточки с цифрами",
    body: "Ключевые числа новости выносятся на экран крупно, чтобы их запомнили.",
  },
  {
    icon: Quote,
    title: "Цитаты постов",
    body: "Слова героев новости появляются как реплики, с подписью, кто сказал.",
  },
  {
    icon: Captions,
    title: "Субтитры слово в слово",
    body: "Ролик понятен без звука: в ленте девять из десяти смотрят без него.",
  },
];

export function InsideCards() {
  return (
    <section id="inside" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
            Что внутри
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Четыре вещи, которые делают ролик смотрибельным
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-foreground/10 bg-background p-6">
              <div className="grid size-10 place-items-center rounded-xl border border-foreground/10">
                <Icon className="size-5 text-foreground/70" strokeWidth={1.5} />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
