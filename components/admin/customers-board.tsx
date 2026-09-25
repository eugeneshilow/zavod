"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { matches, STAGES, type Customer, type CustomersView, type StageId } from "@/lib/customers";

// Таблица клиентов: фильтр по стадии и поиск на месте, карточка человека
// раскрывается под его строкой без перехода на другую страницу.
// Канон — docs/customers/README.md.

const STAGE_TONE: Record<StageId, string> = {
  lead: "bg-amber-50 text-amber-800",
  trial: "bg-sky-50 text-sky-800",
  client: "bg-emerald-50 text-emerald-800",
  gone: "bg-zinc-100 text-zinc-500",
};

const DATE = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const RUB = (n: number) => (n ? `${new Intl.NumberFormat("ru-RU").format(n)} ₽` : "—");

function stageLabel(id: StageId): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

export function CustomersBoard({ view }: { view: CustomersView }) {
  const [stage, setStage] = useState<StageId | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(
    () => view.customers.filter((c) => (stage === "all" || c.stage === stage) && matches(c, q)),
    [view.customers, stage, q],
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Всего в базе" value={String(view.totals.all)} />
        <Kpi label="Платят" value={String(view.totals.paying)} />
        <Kpi label="Оплачено за месяц" value={RUB(view.totals.paidMonthRub)} />
        <Kpi
          label="Ждут ответа"
          value={String(view.totals.waiting)}
          warn={view.totals.waiting > 0}
        />
      </div>
      <section className="rounded-md border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-3 py-2">
          <Chip
            on={stage === "all"}
            onClick={() => setStage("all")}
            label="Все"
            n={view.totals.all}
          />
          {STAGES.map((s) => (
            <Chip
              key={s.id}
              on={stage === s.id}
              onClick={() => setStage(s.id)}
              label={s.label}
              n={view.byStage[s.id]}
            />
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="имя, почта, @ник"
            aria-label="Поиск клиента"
            className="ml-auto w-56 rounded-md border border-zinc-200 px-2.5 py-1 text-sm outline-none focus:border-zinc-400"
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1.8fr)_0.8fr_0.8fr_0.5fr_0.7fr_minmax(0,1.6fr)_20px] gap-3 px-3 py-2 text-[11px] text-zinc-400">
          <span>Клиент</span>
          <span>Стадия</span>
          <span>Откуда</span>
          <span>Роликов</span>
          <span>Оплачено</span>
          <span>Что дальше</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <p className="border-t border-zinc-100 px-3 py-6 text-center text-sm text-zinc-400">
            {view.customers.length === 0
              ? "Клиентов пока нет. Добавьте первого формой ниже."
              : "Под фильтр никто не подошёл."}
          </p>
        ) : (
          rows.map((c) => (
            <Row
              key={c.id}
              c={c}
              open={open === c.id}
              onToggle={() => setOpen(open === c.id ? null : c.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p
        className={`mt-0.5 text-xl font-semibold tabular-nums ${warn ? "text-amber-700" : "text-zinc-950"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Chip({
  on,
  onClick,
  label,
  n,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  n: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-2.5 py-0.5 text-xs ${on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
    >
      {label} <span className="tabular-nums opacity-60">{n}</span>
    </button>
  );
}

function Row({ c, open, onToggle }: { c: Customer; open: boolean; onToggle: () => void }) {
  const contact =
    [c.email, c.telegram ? `@${c.telegram}` : null].filter(Boolean).join(" · ") || c.source;
  return (
    <div className="border-t border-zinc-100">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`grid w-full grid-cols-[minmax(0,1.8fr)_0.8fr_0.8fr_0.5fr_0.7fr_minmax(0,1.6fr)_20px] items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-zinc-50 ${open ? "bg-zinc-50" : ""}`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
            {c.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-zinc-950">{c.name}</span>
            <span className="block truncate text-[11px] text-zinc-500">
              {contact} · {DATE.format(new Date(c.lastTouchAt))}
            </span>
          </span>
        </span>
        <span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${STAGE_TONE[c.stage]}`}>
            {stageLabel(c.stage)}
          </span>
        </span>
        <span className="text-zinc-600">{c.source}</span>
        <span className="tabular-nums">{c.orders}</span>
        <span className="tabular-nums">{RUB(c.paidRub)}</span>
        <span
          className={`truncate text-[12px] ${c.stage === "lead" ? "text-amber-700" : "text-zinc-500"}`}
        >
          {c.next}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-zinc-400">
          <ChevronDown className="size-4" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="card"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <Card c={c} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Карточка человека: шапка, три этажа, лента касаний, что дальше. */
function Card({ c }: { c: Customer }) {
  return (
    <div className="mx-3 mb-3 rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
          {c.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-950">
            {c.name}{" "}
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-normal ${STAGE_TONE[c.stage]}`}
            >
              {stageLabel(c.stage)}
            </span>
          </p>
          <p className="text-[12px] text-zinc-500">
            {[
              c.email,
              c.telegram ? `@${c.telegram}` : null,
              `с нами с ${DATE.format(new Date(c.createdAt)).slice(0, 5)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {c.telegram ? (
          <a
            href={`https://t.me/${c.telegram}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:border-zinc-400"
          >
            написать в Telegram
          </a>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Floor
          n={1}
          title="Откуда пришёл"
          main={c.source}
          sub={c.note ?? `первое касание ${DATE.format(new Date(c.createdAt))}`}
        />
        <Floor
          n={2}
          title="Деньги"
          main={c.payments ? `${c.payments} оплат · ${RUB(c.paidRub)}` : "оплат нет"}
          sub={
            c.tariffUntil === null
              ? "тарифа нет"
              : c.tariffAlive
                ? `тариф «Старт» до ${DATE.format(new Date(c.tariffUntil)).slice(0, 5)}`
                : `тариф кончился ${DATE.format(new Date(c.tariffUntil)).slice(0, 5)}`
          }
        />
        <Floor
          n={3}
          title="Ролики"
          main={`${c.orders} заказано · ${c.live} в эфире`}
          sub={c.cancelled ? `${c.cancelled} отменено` : "отмен нет"}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <p className="mb-1 text-[11px] text-zinc-400">Лента касаний</p>
          <ol className="flex flex-col divide-y divide-zinc-100">
            {c.touches.slice(0, 12).map((t, i) => (
              <li
                key={`${t.at}-${i}`}
                className="grid grid-cols-[92px_1fr] gap-2 py-1.5 text-[13px]"
              >
                <span className="text-zinc-400 tabular-nums">{DATE.format(new Date(t.at))}</span>
                {t.href ? (
                  <Link href={t.href} className="text-zinc-800 hover:underline">
                    {t.what}
                  </Link>
                ) : (
                  <span className="text-zinc-800">{t.what}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="self-start rounded-md bg-zinc-50 p-3">
          <p className="text-[11px] text-zinc-400">Что дальше</p>
          <p className="mt-1 text-sm text-zinc-900">{c.next}</p>
          <p className="mt-2 text-[11px] text-zinc-400">подсказка по фактам карточки</p>
        </div>
      </div>
    </div>
  );
}

function Floor({ n, title, main, sub }: { n: number; title: string; main: string; sub: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <p className="text-[11px] text-zinc-400">
        {n} · {title}
      </p>
      <p className="mt-0.5 text-sm text-zinc-900">{main}</p>
      <p className="text-[11px] text-zinc-500">{sub}</p>
    </div>
  );
}
