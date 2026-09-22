// Блок 8 витрины: отзывы. Форма снята с блока testimonials-3 автора Efferd
// (21st.dev): три карточки цитат со сдвигом второй вниз. Отзывов нет — блока
// нет: пустой блок на витрину не выводится (канон блоков,
// docs/landing/README.md).

export type Testimonial = { quote: string; name: string; role: string };

export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section id="reviews" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
            Отзывы
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Первые заказы
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <figure
              key={item.name}
              className={`rounded-2xl border border-foreground/10 bg-background p-6 ${
                i === 1 ? "md:translate-y-6" : ""
              }`}
            >
              <blockquote className="text-base leading-relaxed text-foreground/80">
                {item.quote}
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-foreground/50">{item.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
