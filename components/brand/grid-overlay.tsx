import { AXES, BAND_CLASS } from "@/lib/layout";

// Накладка сетки на живую витрину: «/?grid» рисует поверх страницы три оси —
// V1 и V2 по внутренним краям полосы контента и H1 по низу шапки. Числа — из
// lib/layout.ts, канон — docs/brand/layout.md. Накладка не ловит клики и не
// попадает в прод без параметра адреса.

/** Бирка оси: короткий id — общий язык владельца и агента в чате. */
function Tag({ id, text, className }: { id: string; text: string; className: string }) {
  return (
    <span
      className={`absolute whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-red-600 ${className}`}
    >
      {id} · {text}
    </span>
  );
}

export function GridOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {/* V1 и V2: внутренние края полосы контента — та же полоса, что у блоков */}
      <div className={`${BAND_CLASS} relative h-full`}>
        <div className="absolute inset-y-0 left-6 border-l-2 border-red-500 md:left-10">
          <Tag id="V1" text={AXES.V1} className="left-1 top-24" />
        </div>
        <div className="absolute inset-y-0 right-6 border-r-2 border-red-500 md:right-10">
          <Tag id="V2" text={AXES.V2} className="right-1 top-24" />
        </div>
      </div>
      {/* H1: низ шапки-пилюли */}
      <div className="absolute inset-x-0 border-t-2 border-red-500" style={{ top: AXES.H1 }}>
        <Tag id="H1" text={`низ шапки ${AXES.H1}`} className="left-2 top-1" />
      </div>
    </div>
  );
}
