import { readFile } from "node:fs/promises";
import path from "node:path";
import { Logo, Mark } from "@/components/brand/logo";
import { DOWNLOADS, LOGO_FILES, PALETTE, RULES, WORD, logoFile } from "@/lib/brand";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../../_components/shell";

// Вид «лого» бренд-атласа: логотип на светлом и тёмном, знак по размерам,
// кнопки скачивания по площадкам, палитра, реестр файлов; сверка закладки
// браузера с файлом набора. Внизу — канон docs/brand/logo.md. Пути и числа —
// из переносчика lib/brand.ts.

const SIZES = [16, 24, 32, 48, 64, 128] as const;

async function faviconState(): Promise<{ ok: boolean; note: string }> {
  try {
    const [icon, pack] = await Promise.all([
      readFile(path.join(process.cwd(), "app", "icon.svg"), "utf8"),
      readFile(path.join(process.cwd(), "public", logoFile("favicon-svg").path), "utf8"),
    ]);
    return icon === pack
      ? { ok: true, note: "app/icon.svg совпадает с favicon.svg набора" }
      : { ok: false, note: "app/icon.svg отличается от favicon.svg набора — перекопировать" };
  } catch {
    return { ok: false, note: "app/icon.svg нет" };
  }
}

function DownloadButton({ fileId }: { fileId: string }) {
  const file = logoFile(fileId);
  const name = file.path.split("/").pop();
  return (
    <a
      href={file.path}
      download={name}
      className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-zinc-700"
    >
      скачать {file.format.toUpperCase()}
      <span className="text-zinc-400">{file.size}</span>
    </a>
  );
}

export async function LogoMode() {
  const [canon, favicon] = await Promise.all([resolveDoc(["brand", "logo"]), faviconState()]);
  return (
    <>
      <SectionLabel>ЛОГОТИП — как стоит на светлом и тёмном</SectionLabel>
      <div className="grid gap-3 md:grid-cols-2">
        <div
          className="flex flex-col items-start gap-6 rounded-md border border-zinc-200 p-6"
          style={{ background: PALETTE.paper }}
        >
          <Logo height={64} variant="primary" />
          <Logo height={28} variant="primary" />
          <div className="flex items-end gap-4">
            <Logo height={28} variant="black" />
          </div>
          <span className="text-[10px] tracking-wide text-zinc-500">
            на светлом: primary · black · слово «{WORD}»
          </span>
        </div>
        <div
          className="flex flex-col items-start gap-6 rounded-md border border-zinc-200 p-6"
          style={{ background: PALETTE.ink }}
        >
          <Logo height={64} variant="inverse" />
          <Logo height={28} variant="inverse" />
          <Logo height={28} variant="white" />
          <span className="text-[10px] tracking-wide text-zinc-300">
            на тёмном: inverse · white
          </span>
        </div>
      </div>

      <SectionLabel>СКАЧАТЬ — версии под площадки</SectionLabel>
      <Box title="Файлы под площадки" aside="кнопка отдаёт файл набора как есть">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-zinc-100">
            {DOWNLOADS.map((d) => (
              <tr key={d.label + d.fileId}>
                <td className="py-2 pr-3 font-medium">{d.label}</td>
                <td className="py-2 pr-3 text-zinc-500">{d.note}</td>
                <td className="py-2 text-right">
                  <DownloadButton fileId={d.fileId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <SectionLabel>ЗНАК — от закладки браузера до обложки</SectionLabel>
      <Box title="Знак по размерам" aside={`минимум ${RULES.minMark} px`}>
        <div className="flex flex-wrap items-end gap-6">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Mark size={size} />
              <span className="text-[10px] text-zinc-500">{size} px</span>
            </div>
          ))}
          <div
            className="flex flex-col items-center gap-2 rounded-md p-3"
            style={{ background: PALETTE.ink }}
          >
            <Mark size={48} variant="inverse" />
            <span className="text-[10px] text-zinc-300">на тёмном</span>
          </div>
        </div>
      </Box>

      <SectionLabel>ПОВЕРХНОСТИ — где логотип стоит и чем</SectionLabel>
      <Box title="Поверхности" aside={favicon.ok ? "favicon ✓" : "favicon ✗"}>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-zinc-100">
            <tr>
              <td className="py-1.5 pr-3">Шапка витрины /</td>
              <td className="py-1.5 pr-3 text-zinc-500">полный логотип primary, высота 54</td>
              <td className="py-1.5 text-right">
                <a className="text-[#ff7a45]" href="/" target="_blank" rel="noreferrer">
                  открыть
                </a>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Футер витрины</td>
              <td className="py-1.5 pr-3 text-zinc-500">полный логотип primary, высота 54</td>
              <td className="py-1.5 text-right">
                <a className="text-[#ff7a45]" href="/#footer" target="_blank" rel="noreferrer">
                  открыть
                </a>
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Хедер админки</td>
              <td className="py-1.5 pr-3 text-zinc-500">
                полный логотип inverse, высота 24, служебное исключение
              </td>
              <td className="py-1.5 text-right text-zinc-400">чёрная полоса</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3">Закладка браузера</td>
              <td className="py-1.5 pr-3 text-zinc-500">{favicon.note}</td>
              <td className="py-1.5 text-right">{favicon.ok ? "✓" : "✗"}</td>
            </tr>
          </tbody>
        </table>
      </Box>

      <SectionLabel>ПАЛИТРА И ПРАВИЛА — из набора, канон ниже</SectionLabel>
      <Box title="Палитра" aside="sRGB">
        <div className="flex flex-wrap gap-3">
          {Object.entries(PALETTE).map(([name, hex]) => (
            <div key={name} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block h-6 w-10 rounded border border-zinc-200"
                style={{ background: hex }}
              />
              <span className="font-mono">{hex}</span>
              <span className="text-zinc-500">{name}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Минимум: полный логотип {RULES.minHorizontal} px, знак {RULES.minMark} px; свободное поле
          вокруг знака — {RULES.clearSpace} его высоты. Теней и обводок нет; на тёмном — inverse или
          white.
        </p>
      </Box>

      <Box title="Реестр файлов" aside={`${LOGO_FILES.length} файлов`}>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-zinc-100">
            {LOGO_FILES.map((f) => (
              <tr key={f.id}>
                <td className="py-1.5 pr-3 font-mono text-[11px]">{f.id}</td>
                <td className="py-1.5 pr-3 text-zinc-500">{f.use}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-500">{f.size}</td>
                <td className="py-1.5 text-right">
                  <a className="text-[#ff7a45]" href={f.path} download>
                    {f.format}
                  </a>
                </td>
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
