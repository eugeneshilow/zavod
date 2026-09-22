"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// Бренд-атлас: живая страница во весь экран в раме атласа и плавающий пульт
// справа снизу — форма атласа ЦУПа vibecoding.ru. Пульт: вид (главная ·
// полигон лого) × разрез главной (чистый · гриды) × экран. Состояние живёт в
// адресе, чтобы ссылку на нужный вид можно было отправить в чат.
// Канон зоны — docs/brand/README.md; оси гридов — docs/brand/layout.md.

const VIEWS = [
  { id: "home", label: "главная", src: "/" },
  { id: "lab", label: "полигон лого", src: "/admin/brand/lab" },
] as const;

const LENSES = [
  { id: "clean", label: "чистый" },
  { id: "grid", label: "гриды" },
] as const;

const SCREENS = [
  { id: "375", label: "375", width: 375 },
  { id: "768", label: "768", width: 768 },
  { id: "1280", label: "1280", width: 1280 },
  { id: "full", label: "во всю", width: null },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];
type LensId = (typeof LENSES)[number]["id"];
type ScreenId = (typeof SCREENS)[number]["id"];

function pick<T extends { id: string }>(list: readonly T[], id: string | null, fallback: T): T {
  return list.find((x) => x.id === id) ?? fallback;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs transition-colors ${
        active ? "bg-white text-zinc-900" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

export function Atlas({ commit }: { commit: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const view = pick(VIEWS, params.get("view"), VIEWS[0]);
  const lens = pick(LENSES, params.get("lens"), LENSES[0]);
  const screen = pick(SCREENS, params.get("w"), SCREENS[3]);
  const [folded, setFolded] = useState(false);

  const set = (patch: Partial<Record<"view" | "lens" | "w", ViewId | LensId | ScreenId>>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const src = view.id === "home" && lens.id === "grid" ? "/?grid" : view.src;

  return (
    <div className="fixed inset-0 bg-zinc-100">
      <div className="flex h-full w-full items-stretch justify-center">
        <iframe
          key={src + screen.id}
          src={src}
          title={`Атлас: ${view.label}, ${lens.label}`}
          className="h-full border-x border-zinc-200 bg-white"
          style={{ width: screen.width ?? "100%" }}
        />
      </div>

      <div className="fixed bottom-4 right-4 z-[70] w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl bg-zinc-950/95 p-4 text-zinc-100 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-zinc-400">
            ./atlas · весь дизайн на одной странице
          </span>
          <button
            type="button"
            onClick={() => setFolded((f) => !f)}
            className="text-[11px] text-zinc-400 hover:text-white"
          >
            {folded ? "развернуть ▴" : "свернуть ▾"}
          </button>
        </div>
        {folded ? null : (
          <div className="mt-3 space-y-3">
            <Row label="Вид">
              {VIEWS.map((v) => (
                <Chip key={v.id} active={v.id === view.id} onClick={() => set({ view: v.id })}>
                  {v.label}
                </Chip>
              ))}
            </Row>
            <Row label="Разрез" muted={view.id !== "home"}>
              {LENSES.map((l) => (
                <Chip
                  key={l.id}
                  active={view.id === "home" && l.id === lens.id}
                  onClick={() => set({ view: "home", lens: l.id })}
                >
                  {l.label}
                </Chip>
              ))}
            </Row>
            <Row label="Экран">
              {SCREENS.map((s) => (
                <Chip key={s.id} active={s.id === screen.id} onClick={() => set({ w: s.id })}>
                  {s.label}
                </Chip>
              ))}
            </Row>
            <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-zinc-500">
              <span>
                гриды: V1 · V2 края полосы, H1 низ шапки ·{" "}
                <Link className="underline hover:text-zinc-300" href="/admin/brand/layout">
                  числа
                </Link>
              </span>
              <span>{commit}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  muted,
  children,
}: {
  label: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 ${muted ? "opacity-50" : ""}`}>
      <span className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
