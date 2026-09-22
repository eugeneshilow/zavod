import { LAB_PALETTE, LAB_VARIANTS } from "@/lib/brand-lab";
import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../../_components/shell";
import { AtlasTabs } from "../_modes/tabs";

export const dynamic = "force-dynamic";

const SIZES = [16, 32, 64, 128] as const;

// Только SVG из статического переносчика; пользовательских строк здесь нет.
function Svg({ html, size }: { html: string; size?: number }) {
  return (
    <div
      className={
        size
          ? "shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          : "w-full max-w-80 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      }
      style={size ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function BrandLabPage() {
  const canon = await resolveDoc(["brand", "lab"]);
  const families = new Set(LAB_VARIANTS.map((variant) => variant.family)).size;

  return (
    <>
      <AtlasTabs active="lab" />
      <SectionLabel>ПОЛИГОН — выберите направление по паре</SectionLabel>
      <Box title={`${LAB_VARIANTS.length} вариантов · ${families} семейств`} aside="выбор глазами">
        <p className="max-w-3xl text-sm leading-relaxed">
          Сначала посмотрите на знак вместе со словом, затем на маленькие 16 px и чёрную версию.
          Запомните id понравившейся пары: по нему можно продолжить работу над направлением.
        </p>
      </Box>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        {LAB_VARIANTS.map((variant, index) => (
          <div key={variant.id} id={variant.id} className="min-w-0 scroll-mt-6">
            <Box
              title={`${String(index + 1).padStart(2, "0")} · ${variant.title}`}
              aside={variant.family}
            >
              <div className="space-y-4">
                <div className="min-h-16">
                  <a
                    href={`#${variant.id}`}
                    className="text-[10px] text-zinc-500 underline decoration-zinc-300 underline-offset-2"
                  >
                    {variant.id}
                  </a>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{variant.idea}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {(["light", "dark"] as const).map((surface) => {
                    const dark = surface === "dark";
                    return (
                      <div
                        key={surface}
                        className="flex min-w-0 flex-col gap-3 border border-zinc-200 p-3"
                        style={{
                          background: dark ? LAB_PALETTE.ink : LAB_PALETTE.paper,
                          color: dark ? LAB_PALETTE.paper : LAB_PALETTE.ink,
                        }}
                      >
                        <Svg html={variant.lockup("color")} />
                        <span className="text-[10px]">{dark ? "на чёрном" : "на белом"}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  {SIZES.map((size) => (
                    <div key={size} className="flex flex-col items-center gap-2">
                      <Svg html={variant.mark("color")} size={size} />
                      <span className="text-[10px] text-zinc-500">{size} px</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-zinc-100 pt-3">
                  <p className="text-[10px] text-zinc-500">без жёлтого · чёрное на белом</p>
                  <div className="flex flex-wrap items-center gap-4 text-black">
                    <Svg html={variant.mark("mono")} size={16} />
                    <Svg html={variant.mark("mono")} size={64} />
                    <div className="w-48 max-w-full">
                      <Svg html={variant.lockup("mono")} />
                    </div>
                  </div>
                </div>
              </div>
            </Box>
          </div>
        ))}
      </div>

      {canon ? (
        <>
          <SectionLabel>КАНОН — как сравнивать и выбирать</SectionLabel>
          <Box title="Канон полигона" aside={canon.doc}>
            <div
              className="doc overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(canon.md), canon.doc) }}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}
