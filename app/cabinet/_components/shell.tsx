import Link from "next/link";
import { Avatar, Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
  BarChart3,
  Bell,
  CircleHelp,
  Clapperboard,
  Home,
  ListChecks,
  LogOut,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { Mark } from "@/components/brand/logo";
import { CABINET_NAV, DEMO_CUSTOMER, ORDER_PATH } from "@/lib/cabinet";

const ICON = {
  home: Home,
  film: Clapperboard,
  list: ListChecks,
  chart: BarChart3,
  settings: Settings,
} as const;

/** Меню слева — блок 1 канона. */
export function Sidebar({ queued }: { queued?: number }) {
  return (
    <aside className="flex w-[232px] shrink-0 flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-3">
        <Avatar size="md" color="accent" variant="soft">
          <Avatar.Fallback>{DEMO_CUSTOMER.initials}</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{DEMO_CUSTOMER.name}</p>
          <p className="text-xs text-muted">Тариф «{DEMO_CUSTOMER.plan}»</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Кабинет">
        {CABINET_NAV.map((item) => {
          const Icon = ICON[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-surface-secondary"
            >
              <Icon className="size-4 text-muted" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.icon === "list" && queued ? (
                <span className="rounded-md bg-accent-soft px-1.5 text-xs text-accent-soft-foreground">
                  {queued}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1" />
      <a
        href="https://t.me/ruvibecoding"
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-secondary"
      >
        <CircleHelp className="size-4" aria-hidden />
        Помощь
      </a>
      <span className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted">
        <LogOut className="size-4" aria-hidden />
        Выйти
      </span>
      <div className="mt-3 flex items-center gap-2 px-3 text-xs text-muted">
        <Mark size={16} />
        zavod.today
      </div>
    </aside>
  );
}

/** Шапка — блок 2 канона: приветствие, поиск, звонок, одна кнопка на экран заказа. */
export function Header({
  title,
  subtitle,
  order = true,
  ring = false,
}: {
  title: string;
  subtitle?: string;
  order?: boolean;
  /** Заказ готов за последние сутки — точка на колокольчике. */
  ring?: boolean;
}) {
  return (
    <header className="flex items-center gap-3">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      <Button variant="ghost" isIconOnly aria-label="Поиск">
        <Search className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        isIconOnly
        aria-label={ring ? "Уведомления: ролик готов" : "Уведомления"}
        className="relative"
      >
        <Bell className="size-4" aria-hidden />
        {ring ? (
          <span className="absolute right-2 top-2 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
        ) : null}
      </Button>
      {order ? (
        <Link href={ORDER_PATH} className={buttonVariants({ variant: "primary", size: "md" })}>
          <Plus className="size-4" aria-hidden />
          Сделать ролик
        </Link>
      ) : null}
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-zone="cabinet" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1440px] gap-4 p-4">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
