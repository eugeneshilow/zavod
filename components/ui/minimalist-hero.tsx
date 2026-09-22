"use client";

import React from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Блок 1+2 витрины: шапка и герой одним экраном. Форма снята с блока
// minimalist-hero маркетплейса блоков shadcn: три колонки (текст · картинка на
// круге · большой заголовок), шапка сверху, подпись снизу. Канон блоков —
// docs/landing/README.md. Анимация — framer-motion, поэтому файл клиентский.

interface MinimalistHeroProps {
  logoText: string;
  navLinks: { label: string; href: string }[];
  /** Кнопка шапки: на мобиле она же стоит вместо бургера. */
  ctaLabel: string;
  ctaHref: string;
  mainText: string;
  readMoreLabel: string;
  readMoreLink: string;
  imageSrc: string;
  imageAlt: string;
  /** Заголовок по строке на часть; третья строка необязательна. */
  overlayText: { part1: string; part2: string; part3?: string };
  socialLinks: { icon: LucideIcon; href: string; label: string }[];
  /** Подпись внизу: что машина говорит о себе цифрами. */
  locationText: string;
  className?: string;
}

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="text-sm font-medium tracking-widest text-foreground/60 transition-colors hover:text-foreground"
  >
    {children}
  </a>
);

const CtaButton = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a
    href={href}
    className={cn(
      "rounded-full border border-foreground/20 px-4 py-2 text-sm font-medium",
      "transition-colors hover:border-foreground hover:bg-foreground hover:text-background",
      className,
    )}
  >
    {children}
  </a>
);

const SocialIcon = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) => (
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

export const MinimalistHero = ({
  logoText,
  navLinks,
  ctaLabel,
  ctaHref,
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
        "relative flex h-screen min-h-[640px] w-full flex-col items-center justify-between overflow-hidden bg-background p-8 font-sans md:p-12",
        className,
      )}
    >
      <header className="z-30 flex w-full max-w-7xl items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold tracking-wider"
        >
          {logoText}
        </motion.div>
        <div className="hidden items-center space-x-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.label} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CtaButton href={ctaHref}>{ctaLabel}</CtaButton>
        </motion.div>
      </header>

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
          className="text-right text-sm font-medium text-foreground/80"
        >
          {locationText}
        </motion.div>
      </footer>
    </div>
  );
};
