import { BAND, BAND_CLASS, COLUMNS, EXCEPTIONS } from "@/lib/layout";

// Накладка сетки на живую витрину: «/?grid» рисует поверх страницы полосу
// контента, двенадцать колонок с зазорами и края двух исключений (шапка и
// герой). Числа — из lib/layout.ts, канон — docs/brand/layout.md. Накладка
// не ловит клики и не попадает в прод без параметра адреса.

/** Бирка оси на линии: короткий id — общий язык владельца и агента в чате. */
function Tag({ id, text, tone, top }: { id: string; text: string; tone: string; top: number }) {
  return (
    <span
      className={`absolute left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
      style={{ top }}
    >
      {id} · {text}
    </span>
  );
}

export function GridOverlay() {
  const columns = Array.from({ length: COLUMNS.count }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {/* полоса героя: пунктир */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-x border-dashed border-sky-500/60"
        style={{ width: EXCEPTIONS.heroWidth }}
      >
        <Tag id="V2" text={`герой ${EXCEPTIONS.heroWidth}`} tone="text-sky-600" top={120} />
      </div>
      {/* полоса шапки: точки */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-x border-dotted border-fuchsia-500/60"
        style={{ width: EXCEPTIONS.navbarWidth }}
      >
        <Tag
          id="V3"
          text={`шапка ${EXCEPTIONS.navbarWidth} · top ${EXCEPTIONS.navbarTop}`}
          tone="text-fuchsia-600"
          top={80}
        />
      </div>
      {/* полоса контента и колонки */}
      <div className={`${BAND_CLASS} relative h-full border-x border-rose-500/70`}>
        <Tag
          id="V1"
          text={`полоса ${BAND.width} · поля ${BAND.edgeDesktop} · ${COLUMNS.count} колонок · зазор ${COLUMNS.gutter}`}
          tone="text-rose-600"
          top={160}
        />
        <div className="grid h-full grid-cols-12 gap-6">
          {columns.map((i) => (
            <div key={i} className="h-full bg-rose-500/10" />
          ))}
        </div>
      </div>
      <div className="absolute right-3 top-3 rounded bg-black/80 px-2 py-1 text-[10px] tracking-wide text-white">
        сетка витрины · канон docs/brand/layout.md · V1 полоса · V2 герой · V3 шапка
      </div>
    </div>
  );
}
