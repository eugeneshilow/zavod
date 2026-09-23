import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { loadCustomers, SOURCES } from "@/lib/customers";
import { CustomersBoard } from "@/components/admin/customers-board";
import { Box, SectionLabel } from "../_components/shell";
import { addCustomer } from "./actions";

export const dynamic = "force-dynamic";

// /admin/customers — клиентская база завода: таблица, карточка под строкой,
// форма «Добавить клиента», канон. Канон — docs/customers/README.md.

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const [view, canon] = await Promise.all([loadCustomers(), resolveDoc(["customers"])]);
  return (
    <>
      <SectionLabel id="customers">КЛИЕНТЫ — клик по строке раскрывает карточку</SectionLabel>
      {"reason" in view ? (
        <p className="text-sm text-zinc-500">Данные не пришли: {view.reason}.</p>
      ) : (
        <CustomersBoard view={view} />
      )}

      <SectionLabel id="add">ДОБАВИТЬ — человек, который написал или оставил контакт</SectionLabel>
      <Box title="Новый клиент">
        <form
          action={addCustomer}
          className="grid gap-2 md:grid-cols-[1.2fr_1.2fr_1fr_0.9fr_1.4fr_auto]"
        >
          <input
            name="name"
            required
            placeholder="Имя"
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="почта"
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm"
          />
          <input
            name="telegram"
            placeholder="@ник в Telegram"
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm"
          />
          <select
            name="source"
            defaultValue="руками"
            className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            name="note"
            placeholder="что хотел"
            className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white">
            Добавить
          </button>
        </form>
        {typeof params.error === "string" ? (
          <p className="mt-2 text-sm text-red-600">Не добавлен: {params.error}.</p>
        ) : params.added ? (
          <p className="mt-2 text-sm text-emerald-700">Добавлен.</p>
        ) : null}
      </Box>

      {canon ? (
        <>
          <SectionLabel>КАНОН — как зона устроена прямо сейчас</SectionLabel>
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
