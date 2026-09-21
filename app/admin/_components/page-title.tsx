"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbFor, childrenFor, type NavNode } from "@/lib/nav-tree";

// Шапка экрана: H1 — путь узла по дереву docs (родители серым и кликабельны,
// текущий чёрным), под ним подпись из заголовка канона. Руками заголовки не
// пишутся: правится первая строка файла в docs — меняется везде разом.

export function PageTitle({ tree }: { tree: NavNode }) {
  const pathname = usePathname();
  const chain = breadcrumbFor(tree, pathname).slice(1);
  const current = chain[chain.length - 1];
  if (!current) return null;
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="min-w-0 max-w-full text-xl font-semibold text-zinc-950">
        {chain.map((node, i) =>
          i === chain.length - 1 ? (
            <span key={node.href} className="inline-block">
              {node.label}
            </span>
          ) : (
            <span key={node.href} className="inline-block font-medium text-zinc-400">
              <Link prefetch={false} href={node.href} className="hover:text-zinc-600">
                {node.label}
              </Link>
              <span className="mx-1.5">»</span>
            </span>
          ),
        )}
      </h1>
      {current.note ? <p className="text-sm text-zinc-500">{current.note}</p> : null}
    </div>
  );
}

// Полоса «вверх · вниз»: двери к родителю и к прямым детям узла — не к внукам.
// У листа полоса несёт только «вверх», у корня — только «вниз».

export function NavChildren({ tree }: { tree: NavNode }) {
  const pathname = usePathname();
  const chain = breadcrumbFor(tree, pathname);
  const parent = chain.length >= 2 ? chain[chain.length - 2] : undefined;
  const kids = childrenFor(tree, pathname);
  if (!parent && !kids.length) return null;
  const door =
    "rounded border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 hover:border-zinc-400 hover:text-zinc-950";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {parent ? (
        <>
          <span className="text-[10px] tracking-wide text-zinc-400">Вверх</span>
          <Link prefetch={false} href={parent.href} title={parent.note} className={door}>
            {parent.label}
          </Link>
        </>
      ) : null}
      {parent && kids.length > 0 ? <span className="text-zinc-300">·</span> : null}
      {kids.length > 0 ? (
        <>
          <span className="text-[10px] tracking-wide text-zinc-400">Вниз</span>
          {kids.map((kid) => (
            <Link prefetch={false} key={kid.href} href={kid.href} title={kid.note} className={door}>
              {kid.label}
            </Link>
          ))}
        </>
      ) : null}
    </div>
  );
}
