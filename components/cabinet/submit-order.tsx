"use client";

import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";

/** Кнопка заказа: пока форма уходит — «Запускаю…» со спиннером, повторно не нажать. */
export function SubmitOrder() {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileTap={{ scale: 0.96 }}
      className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-90"
    >
      {pending ? (
        <motion.span
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ["-100%", "250%"] }}
          transition={{ duration: 1, repeat: Infinity }}
          aria-hidden
        />
      ) : null}
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
      {pending ? "Запускаю…" : "Сделать ролик"}
    </motion.button>
  );
}
