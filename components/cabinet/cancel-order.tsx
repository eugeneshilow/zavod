"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cancelOrder } from "@/app/cabinet/orders/actions";

// Отмена в два нажатия: первое раскрывает «Точно отменить?», второе
// отправляет. Случайный клик ничего не ломает, «Нет» сворачивает обратно.

export function CancelOrder({
  id,
  back = "order",
  compact = false,
}: {
  id: string;
  back?: "order" | "home";
  compact?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  return (
    <form action={cancelOrder} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
      <AnimatePresence mode="wait" initial={false}>
        {asking ? (
          <motion.span
            key="ask"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="flex items-center gap-2"
          >
            {!compact ? <span className="text-sm text-muted">Точно отменить?</span> : null}
            <Confirm />
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
            >
              Нет
            </button>
          </motion.span>
        ) : (
          <motion.button
            key="cancel"
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={() => setAsking(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:border-danger hover:text-danger"
          >
            <X className="size-3.5" aria-hidden />
            {compact ? "Отменить" : "Отменить заказ"}
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  );
}

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-danger px-3 py-1.5 text-sm font-medium text-white"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {pending ? "Отменяю…" : "Да, отменить"}
    </button>
  );
}
