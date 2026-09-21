import Link from "next/link";
import {
  assembleHead,
  BRAINS_ROUTE,
  listBrains,
  listRuns,
  loadBrain,
  type Brain,
  type Head,
  type Run,
} from "@/lib/brains";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { hrefOf } from "@/lib/nav-tree";
import { Box, SectionLabel } from "../../_components/shell";

export const dynamic = "force-dynamic";

// /admin/brains/<id> — профиль мозга по словарю зоны (docs/brains/README.md):
// селектор мозгов → паспорт → рецепт (что читает) → голова (живой промпт
// целиком, собран из файлов рецепта на этом запросе) → приёмка → след
// прогонов → канон мозга. Форма снята с профиля мозга ЦУПа vibecoding.ru.

const orange =
  "text-[#C2410C] underline decoration-orange-200 underline-offset-2 hover:decoration-orange-500";

function last(p: string): string {
  return p.split("/").pop() ?? p;
}

/** Селектор: все мозги реестра чипами, текущий — оранжевым. */
function BrainPicker({ brains, current }: { brains: Brain[]; current: string }) {
  return (
    <nav aria-label="Мозги" className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] tracking-wide text-zinc-400">Мозг</span>
      {brains.map((b) => {
        const active = b.id === current;
        return (
          <Link
            prefetch={false}
            key={b.id}
            href={`${BRAINS_ROUTE}/${b.id}`}
            title={b.name}
            aria-current={active ? "page" : undefined}
            className={`rounded border px-2 py-0.5 text-xs ${
              active
                ? "border-[#ff7a45] bg-[#fff1e6] text-[#C2410C]"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
            }`}
          >
            {b.id}
          </Link>
        );
      })}
      <span className="text-zinc-300">·</span>
      <Link prefetch={false} href={BRAINS_ROUTE} className={`text-xs ${orange}`}>
        ← реестр мозгов
      </Link>
    </nav>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-zinc-500">{label} </span>
      {value ? (
        <span className={`${mono ? "font-mono" : ""} text-zinc-800`} title={value}>
          {mono ? last(value) : value}
        </span>
      ) : (
        <span className="text-zinc-400">—</span>
      )}
    </span>
  );
}

function Passport({ brain }: { brain: Brain }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 className="text-sm font-semibold text-zinc-950">{brain.name}</h2>
        <span className="text-[11px] text-zinc-500">· {brain.family}</span>
        {brain.version ? (
          <span className="font-mono text-[11px] text-zinc-400">{brain.version}</span>
        ) : (
          <span className="font-mono text-[11px] text-amber-700">версии нет</span>
        )}
      </div>
      {brain.input || brain.output ? (
        <p className="mt-1.5 text-xs leading-5 text-zinc-800">
          <span className="text-zinc-400">Вход:</span> {brain.input ?? "—"}{" "}
          <span className="text-zinc-300">→</span> <span className="text-zinc-400">Выход:</span>{" "}
          {brain.output ?? "—"}
        </p>
      ) : null}
      {brain.note ? (
        <p className="mt-0.5 text-[11px] leading-4 text-zinc-400">{brain.note}</p>
      ) : null}
      <p className="mt-1.5 text-[11px] leading-4 text-zinc-400">
        вертикаль мозга: каноны в docs → <span title="что мозг читает">рецепт</span> →{" "}
        <span title="каноны рецепта, склеенные в один текст">голова</span> →{" "}
        <span title="голова + вводные одного запуска">прогон</span> → продукт
      </p>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 pt-2 text-[11px]">
        <MetaItem label="Канал" value={brain.channel} />
        <MetaItem label="Модель" value={brain.model} />
        <MetaItem label="Рецепт" value={brain.recipeDoc} mono />
        <MetaItem label="Канон" value={brain.doc} mono />
      </dl>
    </section>
  );
}

function Recipe({ brain, head }: { brain: Brain; head: Head }) {
  const missing = new Set(head.parts.filter((p) => p.missing).map((p) => p.order));
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-3">
      <h2 className="text-xs font-semibold text-zinc-950">Рецепт — что мозг читает, по порядку</h2>
      {brain.recipe.length === 0 ? (
        <p className="mt-1 text-[11px] text-zinc-400">
          в {brain.recipeDoc} нет таблицы «канон · секция · зачем»
        </p>
      ) : (
        <ol data-testid="recipe" className="mt-2 space-y-1.5">
          {brain.recipe.map((row, i) => (
            <li key={`${row.file}-${row.section}`} className="text-xs leading-5 text-zinc-700">
              <span
                className={`mr-1.5 inline-block rounded px-1 font-mono text-[10px] ${
                  missing.has(i + 1) ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-500"
                }`}
                title={`место в склейке головы: ${i + 1} из ${brain.recipe.length}`}
              >
                {i + 1}
              </span>
              <span className="font-medium text-zinc-900">{row.label}</span>{" "}
              <Link prefetch={false} href={hrefOf(row.file)} className={orange}>
                <code className="text-[11px]">{row.file}</code>
              </Link>
              <span className="text-zinc-400"> · {row.section ?? "весь файл"}</span>
              <span className="block pl-7 text-[11px] leading-4 text-zinc-500">{row.why}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-2 border-t border-zinc-100 pt-1.5 text-[11px] leading-4 text-zinc-400">
        рецепт правится в docs ({brain.recipeDoc}); голова собирается из живых файлов при каждом
        открытии — протухнуть ей нечему.
      </p>
    </section>
  );
}

function LiveHead({ head }: { head: Head }) {
  const words = (head.words / 1000).toFixed(1).replace(".", ",");
  return (
    <details className="rounded-md border border-zinc-200 bg-white p-3">
      <summary className="cursor-pointer text-xs font-semibold text-zinc-950">
        голова — живой промпт целиком{" "}
        <span className="font-normal text-zinc-400">
          · {head.kb} КБ · ≈{words} тыс. слов · {head.parts.length} канонов
          {head.parts.some((p) => p.missing) ? (
            <span className="text-red-700"> · часть рецепта не найдена</span>
          ) : null}
        </span>
      </summary>
      <p className="mt-2 text-[11px] leading-4 text-zinc-400">
        склейка:{" "}
        {head.parts.map((p, i) => (
          <span key={p.order} className="whitespace-nowrap">
            <span className="mr-0.5 rounded bg-zinc-100 px-1 font-mono text-[10px] text-zinc-500">
              {p.order}
            </span>
            {last(p.file)}
            {p.section ? ` ${p.section.replace(/^#+\s*/, "")}` : ""} ({p.words} сл.)
            {i < head.parts.length - 1 ? <span className="text-zinc-300"> → </span> : null}
          </span>
        ))}
      </p>
      <pre
        data-testid="head"
        className="mt-2 max-h-[480px] overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-3 text-[11px] leading-4 text-zinc-700"
      >
        {head.text}
      </pre>
    </details>
  );
}

function Acceptance({ brain }: { brain: Brain }) {
  if (!brain.acceptance.length) return null;
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-3">
      <h2 className="text-xs font-semibold text-zinc-950">Приёмка — лестница поверки выхода</h2>
      <ul className="mt-2 space-y-1.5">
        {brain.acceptance.map((step) => (
          <li key={step} className="text-xs leading-4 text-zinc-700">
            {step}
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-zinc-100 pt-1.5 text-[11px] leading-4 text-zinc-500">
        писатель сам у себя не принимает: лестница живёт в {brain.doc}, раздел «Приёмка».
      </p>
    </section>
  );
}

function Runs({ brain, runs }: { brain: Brain; runs: Run[] }) {
  const th = "px-2 py-1 text-left text-[10px] font-medium text-zinc-500";
  const td = "px-2 py-[3px] align-top";
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-3">
      <h2 className="text-xs font-semibold text-zinc-950">
        Прогоны{" "}
        {brain.runsDir ? (
          <span className="font-mono text-[11px] font-normal text-zinc-400">
            · {brain.runsDir}/
          </span>
        ) : null}
      </h2>
      {!brain.runsDir ? (
        <p className="mt-1 text-[11px] text-zinc-400">
          в паспорте нет строки «след прогона» — где лежат выходы, не сказано
        </p>
      ) : runs.length === 0 ? (
        <p className="mt-1 text-[11px] text-zinc-400">прогонов ещё не было: папка пуста</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table data-testid="runs" className="w-full text-xs">
            <thead className="bg-zinc-50">
              <tr>
                <th className={th}>Прогон</th>
                <th className={th}>Заголовок</th>
                <th className={`${th} text-right`}>Битов</th>
                <th className={`${th} text-right`}>Слов</th>
                <th className={th}>Голос</th>
                <th className={th}>Файл</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.file} className="border-t border-zinc-100">
                  <td className={`${td} font-mono`}>{run.id}</td>
                  <td className={td}>{run.title}</td>
                  <td className={`${td} text-right tabular-nums`}>{run.beats}</td>
                  <td className={`${td} text-right tabular-nums`}>{run.words}</td>
                  <td className={`${td} font-mono text-zinc-500`}>{run.voice ?? "—"}</td>
                  <td className={`${td} font-mono text-zinc-500`}>{run.file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 border-t border-zinc-100 pt-1.5 text-[11px] leading-4 text-zinc-500">
        канал руками: след прогона — файл истории здесь и строка очереди на{" "}
        <Link prefetch={false} href="/admin/publish" className={orange}>
          /admin/publish
        </Link>
        ; журнала прогонов машина не ведёт.
      </p>
    </section>
  );
}

export default async function BrainProfilePage({ params }: PageProps<"/admin/brains/[brainId]">) {
  const { brainId } = await params;
  const [brains, brain] = await Promise.all([listBrains(), loadBrain(brainId)]);

  if (!brain) {
    const canon = await resolveDoc(["brains", brainId]);
    return (
      <>
        {brains.length ? <BrainPicker brains={brains} current={brainId} /> : null}
        <SectionLabel>МОЗГА НЕТ — нет паспорта или рецепта</SectionLabel>
        <Box title={`Нет docs/brains/${brainId}/README.md или recipe.md`}>
          <p className="text-sm leading-6 text-zinc-600">
            Мозг — папка docs/brains/&lt;id&gt;/ с README.md (паспорт, приёмка) и recipe.md (таблица
            канонов). Заведите оба файла — профиль появится сам.
          </p>
          {canon ? (
            <div
              className="doc mt-3 border-t border-zinc-100 pt-3"
              dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(canon.md), canon.doc) }}
            />
          ) : null}
        </Box>
      </>
    );
  }

  const [head, runs, canon] = await Promise.all([
    assembleHead(brain),
    listRuns(brain),
    resolveDoc(["brains", brain.id]),
  ]);

  return (
    <>
      <BrainPicker brains={brains} current={brain.id} />
      <SectionLabel id="profile">ПРОФИЛЬ — паспорт, рецепт, голова, приёмка, прогоны</SectionLabel>
      <div className="space-y-3">
        <Passport brain={brain} />
        <Recipe brain={brain} head={head} />
        <LiveHead head={head} />
        <Acceptance brain={brain} />
        <Runs brain={brain} runs={runs} />
      </div>
      {canon ? (
        <>
          <SectionLabel id="canon">КАНОН — как мозг устроен прямо сейчас</SectionLabel>
          <Box title="Канон мозга" aside={canon.doc}>
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
