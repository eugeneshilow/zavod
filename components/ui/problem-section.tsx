// Блок 3 витрины: проблема. Формы «один абзац» на маркетплейсе нет — сделана по
// лекалу серии LN: подпись капсом, заголовок в две строки слева, абзац справа.
// Ни карточек, ни кнопок, ни иконок: блок держит остальную страницу, а не
// продаёт. Канон блоков — docs/landing/README.md.

export function ProblemSection() {
  return (
    <section id="problem" className="bg-background py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
              Проблема
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
              Новость живёт день. Ролик по ней делают неделю.
            </h2>
          </div>
          <div className="md:col-span-7 md:pt-10">
            <p className="text-lg leading-relaxed text-foreground/70">
              Пока редактор пишет сценарий, монтажёр режет, а диктор записывает, новость остывает. К
              вечеру её уже пересказали все, и ролик выходит в пустоту. Завод делает ролик, пока
              новость ещё горячая: шесть минут от ссылки до файла.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
