"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, ExternalLink, Loader2, X } from "lucide-react";
import type { OrderStep, OrderView } from "@/lib/cabinet";
import { CancelOrder } from "./cancel-order";
import { Since } from "./since";

// Страница заказа: полоса пути, шесть шагов и ролик, когда готов. Анимации —
// только на смене состояния: шаг, закончившийся на глазах, «щёлкает»
// галочкой, линия к следующему наливается, готовый ролик выезжает снизу.

const TIME = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  hour: "2-digit",
  minute: "2-digit",
});

export function OrderProgress({ view, error }: { view: OrderView; error?: string | null }) {
  // Прошлые состояния шагов держим в состоянии, а не в ссылке: экран сравнивает
  // их с новыми при обновлении и «щёлкает» только шагом, сменившимся на глазах.
  const key = view.steps.map((s) => s.state).join(",");
  const readyDone = view.steps.find((s) => s.key === "ready")?.state === "done";
  const [snap, setSnap] = useState<{ key: string; prev: Record<string, string>; burst: number }>({
    key,
    prev: {},
    burst: 0,
  });
  if (snap.key !== key) {
    const before = snap.key.split(",");
    const prev = Object.fromEntries(view.steps.map((s, i) => [s.key, before[i] ?? ""]));
    setSnap({ key, prev, burst: snap.burst + (readyDone && prev.ready !== "done" ? 1 : 0) });
  }

  const current = view.current;
  const running = !view.final && current?.state === "now";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6">
        <p className="text-xs text-muted">заказ {TIME.format(new Date(view.createdAt))}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{view.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {[view.voiceName ? `голос ${view.voiceName}` : null, view.doors]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {view.wish ? <p className="mt-1 text-sm text-muted">пожелание: {view.wish}</p> : null}

        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-surface-tertiary">
          <motion.div
            className={`relative h-full rounded-full ${
              view.failed ? "bg-danger" : view.cancelled ? "bg-border-tertiary" : "bg-accent"
            }`}
            initial={false}
            animate={{ width: `${Math.round(view.progress * 100)}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 18 }}
          >
            {running ? (
              <motion.span
                className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ["-100%", "400%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={`${current?.key ?? "end"}-${current?.state ?? ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-3 flex items-center gap-2 text-sm font-medium"
          >
            {view.cancelled ? (
              <span className="text-muted">Заказ отменён</span>
            ) : view.failed ? (
              <span className="text-danger">Не вышло: {current?.title.toLowerCase()}</span>
            ) : running && current ? (
              <>
                <span>{current.title}</span>
                {current.at ? <Since at={current.at} className="text-muted" /> : null}
              </>
            ) : view.final ? (
              <span className="text-accent">Готово</span>
            ) : null}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {view.cancellable ? (
            <motion.div key="cancel" exit={{ opacity: 0, height: 0 }} className="mt-4">
              <CancelOrder id={view.id} />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            Не отменилось: {error}.
          </p>
        ) : null}

        <ol className="mt-6 flex flex-col">
          {view.steps.map((step, i) => (
            <StepRow
              key={step.key}
              step={step}
              last={i === view.steps.length - 1}
              fresh={snap.prev[step.key] !== undefined && snap.prev[step.key] !== step.state}
            />
          ))}
        </ol>

        <Burst key={snap.burst} on={snap.burst > 0} />
      </section>

      <ResultCard view={view} />
    </div>
  );
}

function StepRow({ step, last, fresh }: { step: OrderStep; last: boolean; fresh: boolean }) {
  const done = step.state === "done";
  return (
    <li className={`relative flex gap-4 ${step.state === "skip" ? "opacity-45" : ""}`}>
      <div className="flex flex-col items-center">
        <Dot state={step.state} fresh={fresh} />
        {!last ? (
          <div className="relative my-1 w-0.5 flex-1 overflow-hidden rounded bg-surface-tertiary">
            <motion.div
              className="absolute inset-x-0 top-0 bg-accent"
              initial={false}
              animate={{ height: done ? "100%" : "0%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        ) : null}
      </div>
      <div className="pb-5">
        <p
          className={`text-sm ${step.state === "next" ? "text-muted" : "font-medium"} ${step.state === "failed" ? "text-danger" : ""}`}
        >
          {step.title}
        </p>
        <p className="text-xs text-muted">
          {[step.at && step.state === "done" ? TIME.format(new Date(step.at)) : null, step.note]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </li>
  );
}

function Dot({ state, fresh }: { state: OrderStep["state"]; fresh: boolean }) {
  const base = "relative flex size-7 shrink-0 items-center justify-center rounded-full";
  if (state === "done")
    return (
      <motion.span
        className={`${base} bg-accent text-accent-foreground`}
        initial={fresh ? { scale: 0.4 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
      >
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </motion.span>
    );
  if (state === "now")
    return (
      <span className={`${base} bg-warning/20 text-warning`}>
        <span className="absolute inset-0 animate-ping rounded-full bg-warning/30" aria-hidden />
        <Loader2 className="size-4 animate-spin" aria-hidden />
      </span>
    );
  if (state === "failed")
    return (
      <span className={`${base} bg-danger text-white`}>
        <X className="size-4" strokeWidth={3} aria-hidden />
      </span>
    );
  return <span className={`${base} border-2 border-dashed border-border bg-surface`} aria-hidden />;
}

function ResultCard({ view }: { view: OrderView }) {
  const ready = view.steps.find((s) => s.key === "ready")?.state === "done";
  return (
    <section className="rounded-3xl border border-border bg-surface p-6">
      <p className="text-sm font-medium">
        {ready ? "Ваш ролик" : view.cancelled ? "Ролика не будет" : "Здесь появится ролик"}
      </p>
      <div className="mt-4 flex justify-center">
        <AnimatePresence mode="wait">
          {ready && view.videoUrl ? (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="flex flex-col items-center gap-3"
            >
              <video
                src={view.videoUrl}
                controls
                playsInline
                className="aspect-[9/16] w-[240px] rounded-2xl bg-black shadow-lg"
              />
              <div className="flex gap-2">
                <a
                  href={view.videoUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                >
                  <Download className="size-4" aria-hidden /> Скачать
                </a>
                {view.permalink ? (
                  <a
                    href={view.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm"
                  >
                    <ExternalLink className="size-4" aria-hidden /> Пост
                  </a>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="wait"
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative aspect-[9/16] w-[240px] overflow-hidden rounded-2xl bg-surface-secondary"
              aria-hidden
            >
              {!view.failed && !view.cancelled ? (
                <motion.span
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{ x: ["-100%", "250%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : null}
              <div className="absolute inset-x-4 bottom-6 flex flex-col gap-2">
                <span className="h-2 w-4/5 rounded bg-surface-tertiary" />
                <span className="h-2 w-3/5 rounded bg-surface-tertiary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** Россыпь бирюзовых точек, когда ролик стал готов у зрителя на глазах. */
function Burst({ on }: { on: boolean }) {
  if (!on) return null;
  const dots = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {dots.map((i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/3 size-2 rounded-full"
            style={{ background: i % 3 ? "var(--accent)" : "#F5C542" }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * 180,
              y: Math.sin(angle) * 120,
              opacity: 0,
              scale: 0.4,
            }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
