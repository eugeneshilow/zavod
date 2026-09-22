"use client";

import { motion } from "framer-motion";
import { Clapperboard, Send, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Блок 2 витрины: герой. Форма снята с блока minimalist-hero маркетплейса
// блоков shadcn: три колонки (текст · картинка на круге · большой заголовок) и
// подпись снизу. Шапка у донора жила здесь же, но у нас она отдельный блок
// (components/ui/site-navbar.tsx) — герой оставляет ей место отступом сверху.
// Канон блоков — docs/landing/README.md. Анимация — framer-motion, поэтому
// файл клиентский.

/**
 * Значок подвала задаётся ключом, а не компонентом: страница серверная, а
 * функцию через границу к клиенту не передать. Список ключей — здесь, рядом с
 * иконками. Брендовых значков в lucide больше нет: площадка коротких видео —
 * хлопушка, Telegram — самолётик.
 */
export type SocialIconName = "reels" | "telegram";

const SOCIAL_ICONS: Record<SocialIconName, LucideIcon> = {
  reels: Clapperboard,
  telegram: Send,
};

interface MinimalistHeroProps {
  mainText: string;
  readMoreLabel: string;
  readMoreLink: string;
  imageSrc: string;
  imageAlt: string;
  /** Заголовок по строке на часть; третья строка необязательна. */
  overlayText: { part1: string; part2: string; part3?: string };
  socialLinks: { icon: SocialIconName; href: string; label: string }[];
  /** Подпись внизу: что машина говорит о себе цифрами. */
  locationText: string;
  className?: string;
}

const SocialIcon = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: SocialIconName;
  label: string;
}) => {
  const Icon = SOCIAL_ICONS[icon];
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="text-foreground/60 transition-colors hover:text-foreground"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
};

export const MinimalistHero = ({
  mainText,
  readMoreLabel,
  readMoreLink,
  imageSrc,
  imageAlt,
  overlayText,
  socialLinks,
  locationText,
  className,
}: MinimalistHeroProps) => {
  return (
    <div
      className={cn(
        "relative flex h-screen min-h-[640px] w-full flex-col items-center justify-between overflow-hidden bg-background p-8 pt-24 font-sans md:p-12 md:pt-24",
        className,
      )}
    >
      <div className="relative grid w-full max-w-7xl flex-grow grid-cols-1 items-center gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="z-20 order-2 text-center md:order-1 md:text-left"
        >
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-foreground/80 md:mx-0">
            {mainText}
          </p>
          <a
            href={readMoreLink}
            className="mt-4 inline-block text-sm font-medium text-foreground underline decoration-from-font"
          >
            {readMoreLabel}
          </a>
        </motion.div>

        <div className="relative order-1 flex h-full items-center justify-center md:order-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute z-0 h-[260px] w-[260px] rounded-full bg-[#F5B700]/90 md:h-[360px] md:w-[360px] lg:h-[440px] lg:w-[440px]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={imageSrc}
            alt={imageAlt}
            className="relative z-10 h-auto w-40 rounded-2xl object-cover shadow-xl ring-1 ring-foreground/10 md:w-48 lg:w-56"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="z-20 order-3 flex items-center justify-center text-center md:justify-start md:text-left"
        >
          <h1 className="text-5xl leading-[0.95] font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {overlayText.part1}
            <br />
            {overlayText.part2}
            {overlayText.part3 ? (
              <>
                <br />
                {overlayText.part3}
              </>
            ) : null}
          </h1>
        </motion.div>
      </div>

      <footer className="z-30 flex w-full max-w-7xl items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="flex items-center space-x-4"
        >
          {socialLinks.map((link) => (
            <SocialIcon key={link.href} href={link.href} icon={link.icon} label={link.label} />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="max-w-[70%] text-right text-xs font-medium text-foreground/80 md:max-w-none md:text-sm"
        >
          {locationText}
        </motion.div>
      </footer>
    </div>
  );
};
