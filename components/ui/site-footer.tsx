import { TELEGRAM_URL } from "@/lib/landing-copy";

// Блок 11 витрины: футер. Форма снята с блока footer-17 автора LN (21st.dev):
// слева имя и реквизиты, справа группы ссылок, внизу через линию копирайт.
// Канон блоков — docs/landing/README.md.

const PAGE_LINKS = [
  { label: "Как работает", href: "#how" },
  { label: "Примеры", href: "#examples" },
  { label: "Цена", href: "#price" },
  { label: "Вопросы", href: "#faq" },
];

export function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-foreground/10 bg-background py-12">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-lg font-bold tracking-wider">zavod</p>
            <p className="mt-3 text-sm text-foreground/70">
              Новость в вертикальный ролик за шесть минут.
            </p>
            <p className="mt-4 text-xs text-foreground/50">
              ИП Шилов Евгений Владимирович · ИНН 665914016215 · ОГРНИП 325665800131697
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
              Страница
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-medium tracking-[0.2em] text-foreground/50 uppercase">
              Связь
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/ruvibecoding/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                >
                  Ролики завода
                </a>
                <p className="text-xs text-foreground/50">площадка коротких видео</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-foreground/10 pt-6 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 zavod</p>
          <p>Оферта и политика данных появятся вместе с кассой.</p>
        </div>
      </div>
    </footer>
  );
}
