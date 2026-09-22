"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AXES, BAND, EXCEPTIONS, axisX } from "@/lib/layout";

// Накладка сетки на живую витрину: «/?grid» рисует поверх страницы три оси —
// V1 и V2 по внутренним краям полосы контента (оранжевые, оси контента) и H1
// по низу шапки (зелёная, ось рамы). Форма снята с накладки атласа
// vibecoding.ru: тонкие линии, бирка с id прямо на линии, ярлык у курсора при
// наведении на ось, плашка слева внизу с шириной окна и числами. Числа — из
// lib/layout.ts, канон — docs/brand/layout.md. Накладка не ловит клики (кроме
// полос ±5 px вокруг осей) и не попадает в прод без параметра адреса.

type Tip = { label: string; x: number; y: number };
const TipContext = createContext<(t: Tip | null) => void>(() => {});

const CONTENT = "#FF7A1A";
const FRAME = "#00A94F";

/** Ховер-зона вертикальной оси: полоса ±5 px вокруг линии. */
function VHit({ label, side }: { label: string; side: "left" | "right" }) {
  const setTip = useContext(TipContext);
  return (
    <div
      className={`pointer-events-auto absolute inset-y-0 w-[10px] ${
        side === "left" ? "-left-[5px]" : "-right-[5px]"
      }`}
      onMouseMove={(e) => setTip({ label, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setTip(null)}
    />
  );
}

/** Ховер-зона горизонтальной оси. */
function HHit({ label }: { label: string }) {
  const setTip = useContext(TipContext);
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 -top-[5px] h-[10px]"
      onMouseMove={(e) => setTip({ label, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setTip(null)}
    />
  );
}

/** Бирка-паспорт оси: id прямо на линии — этим именем владелец и агент ссылаются на ось в чате. */
function AxisTag({
  id,
  side,
  top,
  tone,
}: {
  id: string;
  side: "left" | "right" | "h";
  top?: number;
  tone: "frame" | "content";
}) {
  const pos =
    side === "h"
      ? "left-[300px] top-0 -translate-y-1/2"
      : side === "left"
        ? "left-0 -translate-x-1/2"
        : "right-0 translate-x-1/2";
  return (
    <span
      className={`pointer-events-none absolute z-10 rounded-[4px] px-1 py-0.5 text-[10px] font-bold leading-none text-white ${pos}`}
      style={{
        background: tone === "frame" ? FRAME : CONTENT,
        ...(side === "h" ? {} : { top: top ?? 100 }),
      }}
    >
      {id}
    </span>
  );
}

export function GridOverlay() {
  const [w, setW] = useState(0);
  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const x = axisX(w || BAND.width);
  return (
    <TipContext.Provider value={setTip}>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
        {/* V1 · V2: внутренние края полосы контента — оранжевые оси контента */}
        <div
          className="absolute inset-y-0 border-x"
          style={{ left: x.V1, width: x.V2 - x.V1, borderColor: `${CONTENT}b3` }}
        >
          <VHit label={`V1 · ${AXES.V1} ${Math.round(x.V1)}`} side="left" />
          <VHit label={`V2 · ${AXES.V2} ${Math.round(x.V2)}`} side="right" />
          <AxisTag id="V1" side="left" top={100} tone="content" />
          <AxisTag id="V2" side="right" top={100} tone="content" />
        </div>
        {/* H1: низ шапки-пилюли — зелёная ось рамы */}
        <div
          className="absolute inset-x-0 border-t-2"
          style={{ top: AXES.H1, borderColor: `${FRAME}b3` }}
        >
          <HHit label={`H1 · низ шапки ${AXES.H1}`} />
          <AxisTag id="H1" side="h" tone="frame" />
        </div>

        {tip ? (
          <div
            className="pointer-events-none fixed z-[70] rounded-[6px] bg-[#111111] px-2 py-1 text-[11px] leading-[16px] text-white"
            style={{ left: tip.x + 12, top: tip.y + 12 }}
          >
            {tip.label}
          </div>
        ) : null}

        <div className="fixed bottom-4 left-4 rounded-[8px] bg-[#111111]/90 px-3 py-2 text-[12px] leading-[18px] text-white">
          {w}px · полоса {BAND.width} · поля {BAND.edgeDesktop}
          <span className="block" style={{ color: CONTENT }}>
            оранж — оси контента: V1 {Math.round(x.V1)} · V2 {Math.round(x.V2)}
          </span>
          <span className="block" style={{ color: "#00E070" }}>
            зелёная — ось рамы: H1 {AXES.H1} (шапка {EXCEPTIONS.navbarTop} +{" "}
            {EXCEPTIONS.navbarHeight})
          </span>
        </div>
      </div>
    </TipContext.Provider>
  );
}
