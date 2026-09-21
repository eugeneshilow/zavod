import Link from "next/link";

// Карточка — только как дверь: заголовок, две-три строки пульса, подпись
// источника серым. Клик — внутрь зоны. Акцентная рамка — когда есть тревога.

export function Card({
  title,
  href,
  lines,
  code,
  accent,
}: {
  title: string;
  href?: string;
  lines: string[];
  code?: string;
  accent?: boolean;
}) {
  const body = (
    <div
      className={`h-full rounded-md border bg-white p-3 transition-colors ${
        accent ? "border-[#ff7a45] bg-[#fff1e6]" : "border-zinc-200"
      } ${href ? "hover:border-zinc-400" : ""}`}
    >
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      {lines.map((line, i) => (
        <p key={i} className="mt-1 text-xs leading-5 text-zinc-600">
          {line}
        </p>
      ))}
      {code ? <p className="mt-1.5 text-[10px] text-zinc-400">{code}</p> : null}
    </div>
  );
  return href ? (
    <Link prefetch={false} href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
