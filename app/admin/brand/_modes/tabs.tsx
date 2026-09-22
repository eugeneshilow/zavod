import Link from "next/link";

// Переключатель режимов бренд-атласа: один на все экраны зоны brand.
// Режим — канон docs/brand/<режим>.md и его стекло по правилу зеркала;
// новый режим — строка в списке ниже и файл канона.

export const ATLAS_MODES = [
  { slug: "layout", label: "лендинг", note: "сетка витрины" },
  { slug: "logo", label: "лого", note: "знак и слово" },
  { slug: "lab", label: "полигон", note: "варианты знака" },
] as const;

export type AtlasMode = (typeof ATLAS_MODES)[number]["slug"];

export function AtlasTabs({ active }: { active: AtlasMode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="atlas-tabs">
      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">бренд-атлас</span>
      {ATLAS_MODES.map((mode) => {
        const isActive = mode.slug === active;
        return (
          <Link
            key={mode.slug}
            prefetch={false}
            href={`/admin/brand/${mode.slug}`}
            className={`rounded border px-3 py-1 text-xs ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
            }`}
          >
            {mode.label}
            <span className={`ml-2 text-[10px] ${isActive ? "text-zinc-300" : "text-zinc-400"}`}>
              {mode.note}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
