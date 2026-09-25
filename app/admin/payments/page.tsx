import { headers } from "next/headers";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import {
  loadAllPayments,
  paidThisMonthRub,
  paymentsAccess,
  productTitle,
  requestOrigin,
  rub,
  STATUS_WORD,
} from "@/lib/payments";
import { Box, SectionLabel } from "../_components/shell";

export const dynamic = "force-dynamic";

// /admin/payments — касса глазами владельца: четыре числа, все платежи,
// состояние кассы (ключи — только факт наличия, значения не печатаются),
// канон. Канон — docs/payments/README.md.

const DATE = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_TONE: Record<string, string> = {
  succeeded: "text-emerald-700",
  pending: "text-amber-700",
  canceled: "text-zinc-400",
};

export default async function PaymentsPage() {
  const [payments, canon, h] = await Promise.all([
    loadAllPayments(),
    resolveDoc(["payments"]),
    headers(),
  ]);
  const keys = paymentsAccess();
  const webhook = `${requestOrigin(h)}/api/yookassa`;
  const rows = "reason" in payments ? [] : payments;
  const mode = rows.length === 0 ? "платежей ещё не было" : rows[0].test ? "тест" : "бой";
  return (
    <>
      <SectionLabel id="payments">
        КАССА — платежи ЮKassa, статус пишет только уведомление
      </SectionLabel>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Оплачено за месяц" value={rub(paidThisMonthRub(rows))} />
        <Kpi label="Платежей" value={String(rows.length)} />
        <Kpi label="Ждут" value={String(rows.filter((p) => p.status === "pending").length)} />
        <Kpi label="Отменено" value={String(rows.filter((p) => p.status === "canceled").length)} />
      </div>
      <p className="text-[12px] text-zinc-500">
        Ключи ЮKassa: {"reason" in keys ? "не заданы" : "заданы"} · режим: {mode} · вебхук:{" "}
        <code className="text-zinc-800">{webhook}</code>
      </p>
      <Box title="Платежи" aside="новые сверху, до 500">
        {"reason" in payments ? (
          <p className="text-sm text-zinc-500">Данные не пришли: {payments.reason}.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-400">Платежей пока нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] text-zinc-400">
                  <th className="py-1 pr-3 font-normal">Когда, МСК</th>
                  <th className="py-1 pr-3 font-normal">Покупатель</th>
                  <th className="py-1 pr-3 font-normal">Товар</th>
                  <th className="py-1 pr-3 text-right font-normal">Сумма</th>
                  <th className="py-1 pr-3 font-normal">Статус</th>
                  <th className="py-1 pr-3 font-normal">Номер ЮKassa</th>
                  <th className="py-1 font-normal">Тест</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-100">
                    <td className="py-1.5 pr-3 text-zinc-500 tabular-nums">
                      {DATE.format(new Date(p.paidAt ?? p.createdAt))}
                    </td>
                    <td className="py-1.5 pr-3">{p.account}</td>
                    <td className="py-1.5 pr-3">{productTitle(p.product)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{rub(p.amountRub)}</td>
                    <td className={`py-1.5 pr-3 ${STATUS_TONE[p.status] ?? "text-zinc-600"}`}>
                      {STATUS_WORD[p.status] ?? p.status}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[12px] text-zinc-500">
                      {p.yookassaId ? p.yookassaId.slice(0, 8) : "—"}
                    </td>
                    <td className="py-1.5 text-zinc-500">{p.test ? "тест" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-zinc-950 tabular-nums">{value}</p>
    </div>
  );
}
