"use client";

import { Logo } from "@/components/brand/logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BAND_CLASS, NAVBAR_BAND_CLASS } from "@/lib/layout";
import { cn } from "@/lib/utils";

// Блок 1 витрины: шапка. Форма снята с блока navbar-1 маркетплейса 21st.dev —
// плавающая белая пилюля с тенью: слева имя, по центру ссылки, справа чёрная
// кнопка. Тень на витрине есть только здесь. Канон блоков —
// docs/landing/README.md. Файл клиентский из-за выпадающего списка на мобиле.

const LINKS = [
  { label: "Как работает", href: "#how" },
  { label: "Примеры", href: "#examples" },
  { label: "Цена", href: "#price" },
  { label: "Вопросы", href: "#faq" },
];

const CTA_HREF = "#cta";
const CTA_LABEL = "Сделать ролик";

export function SiteNavbar({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className={cn("fixed inset-x-0 top-4 z-50", BAND_CLASS, className)}>
      <nav
        className={cn(
          NAVBAR_BAND_CLASS,
          "border border-foreground/10 bg-background/90 px-4 py-2 shadow-lg backdrop-blur",
          // пилюля круглая, пока список закрыт: с раскрытым списком края спрямляются
          open ? "rounded-3xl" : "rounded-full",
        )}
      >
        <div className="flex items-center justify-between gap-4 md:grid md:grid-cols-3">
          <a href="#" aria-label="zavod, наверх">
            <Logo em={18} />
          </a>

          <div className="hidden items-center justify-center gap-6 md:flex lg:gap-8">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-widest whitespace-nowrap text-foreground/60 transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <a
              href={CTA_HREF}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              {CTA_LABEL}
            </a>
            <button
              type="button"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-9 place-items-center rounded-full border border-foreground/15 text-foreground/70 transition-colors hover:text-foreground md:hidden"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="mt-2 flex flex-col gap-1 border-t border-foreground/10 pt-2 md:hidden">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-2 py-2 text-sm font-medium tracking-widest text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
