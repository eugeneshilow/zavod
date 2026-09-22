import { GridOverlay } from "@/components/brand/grid-overlay";
import { CtaSection } from "@/components/ui/cta-section";
import { ExamplesGallery } from "@/components/ui/examples-gallery";
import { Faq } from "@/components/ui/faq";
import { HowItWorks } from "@/components/ui/how-it-works";
import { InsideCards } from "@/components/ui/inside-cards";
import { MinimalistHero } from "@/components/ui/minimalist-hero";
import { PricingCard } from "@/components/ui/pricing-card";
import { ProblemSection } from "@/components/ui/problem-section";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteNavbar } from "@/components/ui/site-navbar";
import { Testimonials, type Testimonial } from "@/components/ui/testimonials";
import { resolveDoc } from "@/lib/docs";
import {
  heroMetric,
  landingBlocks,
  pickShowcase,
  HERO_METRIC_FALLBACK,
  type LandingBlock,
} from "@/lib/landing";
import { loadSocial, type Reel } from "@/lib/social";

export const dynamic = "force-dynamic";

// Витрина завода. Порядок блоков читается из канона зоны
// (docs/landing/README.md, раздел «Блоки») — правило зеркала, как хедер
// админки. Собраны все одиннадцать; серая полоса осталась только для имени
// блока, которого карта слагов не знает.

const SOCIAL = [
  {
    icon: "reels" as const,
    href: "https://www.instagram.com/ruvibecoding/",
    label: "Ролики завода",
  },
  { icon: "telegram" as const, href: "https://t.me/+edS99a5ufdpkODFi", label: "Канал в Telegram" },
];

/** Отзывов ещё нет: блок сам не покажется, пока список пуст. */
const REVIEWS: Testimonial[] = [];

/**
 * Данные витрины одним походом в машину: строка метрики внизу героя и ролики в
 * галерею примеров. Двери нет — честный фолбэк и пустая галерея, никогда не
 * выдуманные цифры.
 */
async function loadShowcase(): Promise<{ metric: string; reels: Reel[] }> {
  const social = await loadSocial();
  if ("reason" in social) return { metric: HERO_METRIC_FALLBACK, reels: [] };
  const ig = social.networks.find((n) => n.id === "instagram");
  if (!ig) return { metric: HERO_METRIC_FALLBACK, reels: [] };
  return { metric: heroMetric(ig.reels.length, ig.views7d), reels: pickShowcase(ig.reels, 6) };
}

function Placeholder({ block }: { block: LandingBlock }) {
  return (
    <section className="border-t border-foreground/10 px-8 py-5 text-sm text-foreground/40 md:px-12">
      блок {block.n} · {block.title} — ещё не собран
    </section>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const [canon, showcase, params] = await Promise.all([
    resolveDoc(["landing"]),
    loadShowcase(),
    searchParams,
  ]);
  const blocks = landingBlocks(canon?.md ?? "");
  // «/?grid» — накладка сетки поверх живой витрины (канон — docs/brand/layout.md).
  const grid = params.grid !== undefined;
  return (
    <main className="flex w-full flex-1 flex-col">
      {grid ? <GridOverlay /> : null}
      {blocks.map((block) => {
        switch (block.slug) {
          case "header":
            return <SiteNavbar key={block.slug} />;
          case "hero":
            return (
              <MinimalistHero
                key={block.slug}
                mainText="Вставьте ссылку на новость. Через шесть минут у вас вертикальный ролик с голосом, карточками и субтитрами, готовый к эфиру."
                readMoreLabel="Как это работает"
                readMoreLink="#how"
                imageSrc="/landing/hero-frame.webp"
                imageAlt="Кадр ролика завода: карточка с цифрой"
                overlayText={{ part1: "новость", part2: "в ролик", part3: "за 6 минут." }}
                socialLinks={SOCIAL}
                locationText={showcase.metric}
              />
            );
          case "problem":
            return <ProblemSection key={block.slug} />;
          case "how":
            return <HowItWorks key={block.slug} />;
          case "examples":
            return <ExamplesGallery key={block.slug} reels={showcase.reels} />;
          case "inside":
            return <InsideCards key={block.slug} />;
          case "price":
            return <PricingCard key={block.slug} />;
          case "reviews":
            return <Testimonials key={block.slug} items={REVIEWS} />;
          case "faq":
            return <Faq key={block.slug} />;
          case "cta":
            return <CtaSection key={block.slug} />;
          case "footer":
            return <SiteFooter key={block.slug} />;
          default:
            return <Placeholder key={`block-${block.n}`} block={block} />;
        }
      })}
    </main>
  );
}
