import type { Metadata } from "next";
import { Shell } from "./_components/shell";

export const metadata: Metadata = {
  title: "Кабинет — zavod.today",
  robots: { index: false, follow: false },
};

// Кабинет покупателя: своя рама (меню слева, шапка), свой набор компонентов
// HeroUI и свои переменные темы под data-zone="cabinet". Канон —
// docs/cabinet/README.md.

export default function CabinetLayout({ children }: LayoutProps<"/cabinet">) {
  return <Shell>{children}</Shell>;
}
