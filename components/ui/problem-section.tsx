import { BAND_CLASS, SECTION_CLASS } from "@/lib/layout";
// Блок 3 витрины: проблема. Формы «один абзац» на маркетплейсе нет — сделана по
// лекалу серии LN: подпись капсом, заголовок в две строки слева, абзац справа.
// Ни карточек, ни кнопок, ни иконок: блок держит остальную страницу, а не
// продаёт. Канон блоков — docs/landing/README.md.

export function ProblemSection() {
  return (
    <section id="problem" className={SECTION_CLASS}>
      <div className={BAND_CLASS}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-6">
            <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
              Проблема
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-pretty md:text-4xl lg:text-5xl">
              Новость живёт день. Ролик по ней делают неделю.
            </h2>
          </div>
          <div className="md:col-span-6 md:pt-10">
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
