import Link from "next/link";
import { CABINET_TABS } from "@/lib/cabinet";

/** Вкладки-пилюли — блок 3 канона. */
export function Tabs({ active }: { active: string }) {
  return (
    <div className="flex items-center gap-2">
      <nav
        className="flex items-center gap-1 rounded-full bg-surface-secondary p-1"
        aria-label="Разделы"
      >
        {CABINET_TABS.map((tab) => {
          const on = tab.href === active;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={on ? "page" : undefined}
              className={
                on
                  ? "rounded-full bg-surface px-4 py-1.5 text-sm font-medium shadow-sm"
                  : "rounded-full px-4 py-1.5 text-sm text-muted hover:text-foreground"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
