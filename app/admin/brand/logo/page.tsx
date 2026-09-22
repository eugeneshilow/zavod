import { readFile } from "node:fs/promises";
import path from "node:path";
import { Logo, Mark } from "@/components/brand/logo";
import { CLEAR_SPACE, INK, LOCKUP, MARK, MIN_SIZE, PAPER, WORD, YELLOW, markSvg } from "@/lib/brand";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../../_components/shell";

export const dynamic = "force-dynamic";

// Стекло логотипа: знак и слово во всех формах и размерах прямо из
// переносчика, сверка favicon с ним, числа канона. Внизу — сам канон
// docs/brand/logo.md по правилу зеркала.

const SIZES = [16, 24, 32, 48, 64, 128] as const;

async function faviconState(): Promise<{ ok: boolean; note: string }> {
  try {
    const file = await readFile(path.join(process.cwd(), "app", "icon.svg"), "utf8");
    return file === markSvg()
      ? { ok: true, note: "app/icon.svg совпадает с переносчиком" }
      : { ok: false, note: "app/icon.svg отличается от переносчика — перегенерировать" };
  } catch {
    return { ok: false, note: "app/icon.svg нет" };
  }
}

function Swatch({ bg, dark, label }: { bg: string; dark?: boolean; label: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-md border border-zinc-200 p-4 ${dark ? "text-white" : "text-zinc-900"}`}
      style={{ background: bg }}
    >
      <Logo em={24} variant={bg === YELLOW ? "mono" : "color"} />
      <Logo em={16} variant={bg === YELLOW ? "mono" : "color"} />
      <span className={`text-[10px] tracking-wide ${dark ? "text-zinc-300" : "text-zinc-500"}`}>
        {label}
      </span>
    </div>
  );
}

export default async function BrandLogoPage() {
  const [canon, favicon] = await Promise.all([resolveDoc(["brand", "logo"]), faviconState()]);
  return (
    <>
      <SectionLabel>ЗНАК И СЛОВО — как логотип стоит на фонах</SectionLabel>
      <div className="grid gap-3 md:grid-cols-3">
        <Swatch bg={PAPER} label="на светлом: цветной знак, чёрное слово" />
        <Swatch bg={INK} dark label="на тёмном: цветной знак, белое слово" />
        <Swatch bg={YELLOW} label="на жёлтом: одноцветный знак" />
      </div>

      <SectionLabel>РАЗМЕРЫ — знак от закладки браузера до обложки</SectionLabel>
      <Box title="Знак по размерам" aside={`минимум ${MIN_SIZE.mark} px`}>
        <div className="flex flex-wrap items-end gap-6">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Mark size={size} />
              <span className="text-[10px] text-zinc-500">{size} px</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2">
            <Mark size={48} variant="mono" />
            <span className="text-[10px] text-zinc-500">одноцветный</span>
          </div>
        </div>
      </Box>

      <SectionLabel>ПОВЕРХНОСТИ — где логотип стоит и чем</SectionLabel>
      <Box title="Поверхности" aside={favicon.ok ? "favicon ✓" : "favicon ✗"}>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-zinc-100">
            <tr>
              <td className="py-1.5 pr-3">Шапка витрины /</td>
              <td className="py-1.5 pr-3 text-zinc-500">знак и слово, кегль 18</td>
              <td className="py-1.5 text-right">
                <a className="text-[#ff7a45]" href="/" target="_blank" rel="noreferrer">
                  открыть
                </a>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Футер витрины</td>
              <td className="py-1.5 pr-3 text-zinc-500">знак и слово, кегль 18</td>
              <td className="py-1.5 text-right">
                <a className="text-[#ff7a45]" href="/#footer" target="_blank" rel="noreferrer">
                  открыть
                </a>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Хедер админки</td>
              <td className="py-1.5 pr-3 text-zinc-500">знак и слово, кегль 14, на чёрной полосе</td>
              <td className="py-1.5 text-right text-zinc-400">эта страница</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Закладка браузера</td>
              <td className="py-1.5 pr-3 text-zinc-500">{favicon.note}</td>
              <td className="py-1.5 text-right">{favicon.ok ? "✓" : "✗"}</td>
            </tr>
          </tbody>
        </table>
      </Box>

      <SectionLabel>ЧИСЛА — из переносчика lib/brand.ts, канон ниже</SectionLabel>
      <Box title="Числа знака и написания" aside={`слово «${WORD}»`}>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-zinc-100">
            {(
              [
                ["Квадрат знака, юниты", MARK.size],
                ["Буква: края слева / справа", `${MARK.left} / ${MARK.right}`],
                ["Буква: верх / низ", `${MARK.top} / ${MARK.bottom}`],
                ["Толщина штриха", MARK.stroke],
                ["Сдвиг кромок диагонали", MARK.diagonal],
                ["Диаметр знака, кеглей слова", LOCKUP.markPerEm],
                ["Зазор знак — слово, кеглей", LOCKUP.gapPerEm],
                ["Разрядка слова, em", LOCKUP.tracking],
                ["Вес Inter", LOCKUP.weight],
                ["Охранное поле, диаметров знака", CLEAR_SPACE],
                ["Минимум знака / слова, px", `${MIN_SIZE.mark} / ${MIN_SIZE.word}`],
                ["Круг / буква / буква на чёрном", `${YELLOW} / ${INK} / ${PAPER}`],
              ] as const
            ).map(([label, value]) => (
              <tr key={label}>
                <td className="py-1.5 pr-3">{label}</td>
                <td className="py-1.5 text-right tabular-nums">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {canon ? (
        <>
          <SectionLabel>КАНОН — как логотип устроен прямо сейчас</SectionLabel>
          <Box title="Канон логотипа" aside={canon.doc}>
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
