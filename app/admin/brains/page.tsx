import Link from "next/link";
import { BRAINS_ROUTE, FAMILIES, listBrains, type Brain } from "@/lib/brains";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../_components/shell";

export const dynamic = "force-dynamic";

// /admin/brains — реестр мозгов завода: сводка, таблица по семьям (строка —
// мозг, клик — в профиль), под ними канон docs/brains/README.md. Мозги
// читаются из папки docs/brains при каждом запросе (lib/brains.ts): реестра
// в коде нет. Форма снята со стекла мозгов ЦУПа vibecoding.ru.

const th = "px-3 py-1 text-left text-[10px] font-medium tracking-wide text-zinc-500";
const td = "px-3 py-[6px] align-top text-[11px]";

function last(p: string): string {
  return p.split("/").pop() ?? p;
}

function BrainRow({ brain }: { brain: Brain }) {
  return (
    <tr className="border-t border-zinc-100">
      <td className={td}>
        <Link
          prefetch={false}
          href={`${BRAINS_ROUTE}/${brain.id}`}
          className="text-xs font-medium text-zinc-900 hover:text-[#C2410C]"
        >
          {brain.name}
        </Link>
        <span className="block font-mono text-[10px] text-zinc-400">{brain.id}</span>
        {brain.output ? (
          <span className="block leading-4 text-zinc-500">{brain.output}</span>
        ) : null}
      </td>
      <td className={`${td} font-mono`}>
        {brain.version ? (
          <span className="text-zinc-800">{brain.version}</span>
        ) : (
          <span className="text-amber-700">—</span>
        )}
      </td>
      <td className={`${td} text-zinc-700`}>{brain.model ?? "—"}</td>
      <td className={`${td} text-zinc-700`}>{brain.channel ?? "—"}</td>
      <td className={`${td} font-mono text-zinc-600`} title={brain.recipeDoc}>
        {last(brain.recipeDoc)}
      </td>
      <td className={td}>
        <Link
          prefetch={false}
          href={`${BRAINS_ROUTE}/${brain.id}`}
          className="font-medium text-[#C2410C] underline decoration-orange-200 underline-offset-2 hover:decoration-orange-500"
        >
          профиль →
        </Link>
      </td>
    </tr>
  );
}

function FamilyTable({ title, note, rows }: { title: string; note: string; rows: Brain[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-x-2 px-3 py-1.5">
        <h2 className="text-xs font-semibold text-zinc-950">{title}</h2>
        <p className="text-[11px] text-zinc-500">· {note}</p>
      </div>
      <div className="overflow-x-auto border-t border-zinc-100">
        <table data-testid={`family-${title}`} className="w-full min-w-[760px] text-xs">
          <thead className="bg-zinc-50">
            <tr>
              <th className={`${th} w-[32%]`}>Мозг</th>
              <th className={`${th} w-28`}>Версия</th>
              <th className={th}>Модель</th>
              <th className={th}>Канал</th>
              <th className={`${th} w-28`}>Рецепт</th>
              <th className={`${th} w-20`}>Стекло</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((brain) => (
              <BrainRow key={brain.id} brain={brain} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function BrainsPage() {
  const [brains, canon] = await Promise.all([listBrains(), resolveDoc(["brains"])]);
  const known = FAMILIES.filter((f) => brains.some((b) => b.family === f.family));
  const stray = brains.filter((b) => !FAMILIES.some((f) => f.family === b.family));
  const withVersion = brains.filter((b) => b.version !== null).length;
  const summary = [
    { label: "Мозгов", value: brains.length },
    { label: "Семейств", value: known.length + (stray.length ? 1 : 0) },
    { label: "С версией", value: withVersion },
    { label: "Без версии", value: brains.length - withVersion, warn: brains.length > withVersion },
  ];

  return (
    <>
      <SectionLabel id="registry">РЕЕСТР — строка = мозг, клик = профиль</SectionLabel>
      <nav
        aria-label="Сводка мозгов"
        className="flex flex-wrap items-baseline gap-x-5 gap-y-1 rounded-md border border-zinc-200 bg-white px-3 py-2"
      >
        {summary.map((item) => (
          <span key={item.label} className="whitespace-nowrap">
            <span className="text-[11px] text-zinc-500">{item.label} </span>
            <span
              className={`text-sm font-medium tabular-nums ${item.warn ? "text-amber-700" : "text-zinc-950"}`}
            >
              {item.value}
            </span>
          </span>
        ))}
        <span className="ml-auto text-[10px] text-zinc-400">
          docs/brains/&lt;id&gt; → /admin/brains/&lt;id&gt;
        </span>
      </nav>

      {brains.length === 0 ? (
        <Box title="Мозгов пока нет">
          <p className="text-sm leading-6 text-zinc-600">
            Мозг — папка docs/brains/&lt;id&gt;/ с README.md (паспорт) и recipe.md (рецепт).
            Заведите её — мозг появится здесь сам.
          </p>
        </Box>
      ) : null}
      {known.map((f) => (
        <FamilyTable
          key={f.family}
          title={f.family}
          note={f.note}
          rows={brains.filter((b) => b.family === f.family)}
        />
      ))}
      {stray.length ? (
        <FamilyTable title="без семьи" note="в паспорте нет строки «семья»" rows={stray} />
      ) : null}

      {canon ? (
        <>
          <SectionLabel id="canon">КАНОН — как зона устроена прямо сейчас</SectionLabel>
          <Box title="Канон зоны" aside={canon.doc}>
            <div
              className="doc"
              dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(canon.md), canon.doc) }}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}
