import Link from "next/link";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { moscow, num } from "@/lib/reels";
import { loadSocial, type NetworkGlance } from "@/lib/social";
import { Card } from "../_components/card";
import { Box, SectionLabel } from "../_components/shell";

export const dynamic = "force-dynamic";

// /admin/social — сводка сетей: карточка на сеть, эфир по дням, канон.
// Канон — docs/social/README.md.

function lines(n: NetworkGlance): string[] {
  const door = n.door ? (n.door.on ? "включена" : "на паузе") : "не переключалась";
  const token = n.accounts[0] ? ` · токен до ${moscow(n.accounts[0].expiresAt)}` : "";
  return [
    `подписчиков ${num(n.followers)} · постов за 7 дней ${n.posts7d} · просмотров ${num(n.views7d)}`,
    `дверь ${door}${token}${n.failed ? ` · не уехало ${n.failed}` : ""}`,
  ];
}

export default async function SocialPage() {
  const [social, canon] = await Promise.all([loadSocial(), resolveDoc(["social"])]);
  const live = "reason" in social ? null : social;
  return (
    <>
      <SectionLabel id="networks">СЕТИ — карточка = сеть, клик = внутрь</SectionLabel>
      {live ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {live.networks.map((n) => (
            <Card
              key={n.id}
              title={n.label}
              href={`/admin/social/${n.id}`}
              accent={n.failed > 0 || n.door?.on === false}
              lines={lines(n)}
              code={`docs/social/${n.id}.md`}
            />
          ))}
          <div className="rounded-md border border-dashed border-zinc-300 bg-white p-3 text-zinc-400">
            <p className="text-sm font-semibold">Ещё сеть</p>
            <p className="mt-1 text-xs leading-5">
              появится, когда в docs/social ляжет её файл, а в очереди — её дверь
            </p>
          </div>
        </div>
      ) : (
        <Box title="Сети">
          <p data-testid="social-unavailable" className="text-sm text-zinc-500">
            Цифры недоступны: {(social as { reason: string }).reason}. Переменные окружения —
            docs/publish.md.
          </p>
        </Box>
      )}

      {live ? (
        <>
          <SectionLabel id="days">ЭФИР ПО ДНЯМ — что вышло и что стоит</SectionLabel>
          <Box
            title="Восемь дней"
            aside={
              <>
                очередь целиком —{" "}
                <Link
                  prefetch={false}
                  href="/admin/publish"
                  className="text-[#C2410C] hover:underline"
                >
                  /admin/publish
                </Link>
              </>
            }
          >
            <div className="overflow-x-auto">
              <table data-testid="days" className="w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-zinc-500">
                      сеть
                    </th>
                    {live.days.map((d) => (
                      <th
                        key={d.key}
                        className="px-2 py-1 text-center text-[10px] font-medium text-zinc-500"
                      >
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {live.networks.map((n) => (
                    <tr key={n.id} className="border-t border-zinc-100">
                      <td className="px-2 py-[5px]">
                        <Link
                          prefetch={false}
                          href={`/admin/social/${n.id}`}
                          className="text-[#C2410C] hover:underline"
                        >
                          {n.id}
                        </Link>
                      </td>
                      {n.days.map((d) => (
                        <td key={d.key} className="px-2 py-[5px] text-center tabular-nums">
                          {d.posted ? (
                            <span className="rounded bg-emerald-50 px-1.5 text-emerald-800">
                              {d.posted}
                            </span>
                          ) : null}
                          {d.planned ? (
                            <span className="ml-1 rounded border border-dashed border-zinc-300 px-1.5 text-zinc-500">
                              {d.planned}
                            </span>
                          ) : null}
                          {!d.posted && !d.planned ? (
                            <span className="text-zinc-300">·</span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-zinc-400">
              зелёное — вышло · пунктир — стоит в очереди · дни по Москве
            </p>
          </Box>
        </>
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
