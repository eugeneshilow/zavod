import type { ReactNode } from "react";
import { deployInfo, navTree } from "@/lib/docs";
import { NavChildren, PageTitle } from "./page-title";
import { TopNav } from "./top-nav";

// Единственная рама админки: хедер из дерева docs, шапка-путь, полоса
// «вверх · вниз», контент. Светлая, плотная, без теней — как ЦУП vibecoding.ru.
// Рама одна на все экраны, поэтому живёт в app/admin/layout.tsx.

export async function Shell({ children }: { children: ReactNode }) {
  const tree = await navTree();
  const deploy = deployInfo();
  const badge = `${process.env.ADMIN_PASSWORD ? "пароль" : "без пароля"} · ${deploy.commit}`;
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-[1640px] space-y-3 px-5 py-3">
        <TopNav tree={tree} />
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <PageTitle tree={tree} />
          <span className="ml-auto rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] tracking-wide text-zinc-500">
            {badge}
          </span>
        </header>
        <NavChildren tree={tree} />
        <main className="space-y-4 pb-10">{children}</main>
      </div>
    </div>
  );
}

/** Оранжевый мини-заголовок секции — как на /admin ЦУПа. */
export function SectionLabel({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} className="scroll-mt-20 text-[10px] font-semibold tracking-widest text-[#C2410C]">
      {children}
    </p>
  );
}

/** Секция-коробка: волосяная рамка, шапка, контент. Теней нет. */
export function Box({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-baseline gap-3 border-b border-zinc-100 px-3 py-1.5">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
        {aside ? <span className="ml-auto text-[10px] text-zinc-400">{aside}</span> : null}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}
