"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { breadcrumbFor, type NavNode } from "@/lib/nav-tree";

// Хедер админки: один на все экраны, строится из дерева docs/ (lib/docs.ts,
// navTree). Слева имя проекта — дверь на /admin; дальше по кнопке на зону;
// у зоны с подпапками ▾ открывает панель её поддерева. Справа — крошки пути.
// Дизайн снят с ЦУПа vibecoding.ru: чёрная полоса, один оранжевый акцент.

function Branch({ node, depth }: { node: NavNode; depth: number }) {
  const kids = node.children ?? [];
  return (
    <div>
      <Link
        prefetch={false}
        href={node.href}
        className={`block whitespace-nowrap rounded px-2 py-1 text-xs hover:bg-zinc-800 hover:text-white ${
          depth === 0 ? "font-semibold text-zinc-100" : "text-zinc-300"
        }`}
        style={depth > 0 ? { marginLeft: depth * 12 } : undefined}
        title={node.note}
      >
        {node.label}
        {node.note && depth === 0 ? (
          <span className="ml-2 text-[10px] font-normal text-zinc-500">{node.note}</span>
        ) : null}
      </Link>
      {kids.map((child) => (
        <Branch key={child.href} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function TopNav({ tree }: { tree: NavNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => setOpen(null), [pathname]);

  const chain = breadcrumbFor(tree, pathname);
  const zones = tree.children ?? [];
  const opened = zones.find((zone) => zone.href === open);

  return (
    <nav className="relative rounded-md bg-zinc-950 px-4 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
        <Link
          prefetch={false}
          href={tree.href}
          title={tree.note}
          className={`whitespace-nowrap font-medium ${
            chain.length === 1 ? "text-[#ff7a45]" : "text-white hover:text-zinc-300"
          }`}
        >
          {tree.label}
        </Link>
        {zones.map((zone) => {
          const isActive = chain.includes(zone);
          const hasPanel = (zone.children ?? []).length > 0;
          return (
            <div
              key={zone.href}
              className="relative z-50 flex items-center gap-1 whitespace-nowrap rounded border border-zinc-800 px-1 py-1"
            >
              <Link
                prefetch={false}
                href={zone.href}
                title={zone.note}
                className={`rounded px-1.5 py-0.5 font-medium ${
                  isActive ? "text-[#ff7a45]" : "text-white hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {zone.label}
              </Link>
              {hasPanel ? (
                <button
                  type="button"
                  aria-label={`Открыть раздел ${zone.label}`}
                  onClick={() => setOpen(open === zone.href ? null : zone.href)}
                  className={`rounded border px-1 py-0.5 text-[10px] leading-none ${
                    open === zone.href
                      ? "border-[#ff7a45] bg-zinc-900 text-[#ff7a45]"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  ▾
                </button>
              ) : null}
            </div>
          );
        })}
        <span className="ml-auto hidden items-baseline gap-1 truncate text-[11px] xl:flex">
          {chain.map((node, i) =>
            i === chain.length - 1 ? (
              <span key={node.href} className="text-zinc-200">
                {node.label}
              </span>
            ) : (
              <span key={node.href} className="flex items-baseline gap-1 text-zinc-500">
                <Link prefetch={false} href={node.href} className="hover:text-zinc-300">
                  {node.label}
                </Link>
                <span>›</span>
              </span>
            ),
          )}
        </span>
      </div>
      {opened ? (
        <>
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-0 top-full z-50 pt-2">
            <div className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <Branch node={opened} depth={0} />
            </div>
          </div>
        </>
      ) : null}
    </nav>
  );
}
