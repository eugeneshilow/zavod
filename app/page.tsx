import { Clapperboard, Send } from "lucide-react";
import { MinimalistHero } from "@/components/ui/minimalist-hero";
import { resolveDoc } from "@/lib/docs";
import { heroMetric, landingBlocks, HERO_METRIC_FALLBACK, type LandingBlock } from "@/lib/landing";
import { loadSocial } from "@/lib/social";

export const dynamic = "force-dynamic";

// Витрина завода. Порядок блоков читается из канона зоны
// (docs/landing/README.md, раздел «Блоки») — правило зеркала, как хедер
// админки. Собран первый блок: шапка и герой одним экраном; остальные стоят
// серой полосой со своим номером, пока их не собрали.

const NAV = [
  { label: "Как работает", href: "#how" },
  { label: "Примеры", href: "#examples" },
  { label: "Цена", href: "#price" },
  { label: "Вопросы", href: "#faq" },
];

const SOCIAL = [
  { icon: Clapperboard, href: "https://www.instagram.com/ruvibecoding/", label: "Ролики завода" },
  { icon: Send, href: "https://t.me/+edS99a5ufdpkODFi", label: "Канал в Telegram" },
];

/** Метрика машины внизу героя: цифры из тех же таблиц, что экран сети. */
async function machineLine(): Promise<string> {
  const social = await loadSocial();
  if ("reason" in social) return HERO_METRIC_FALLBACK;
  const ig = social.networks.find((n) => n.id === "instagram");
  if (!ig) return HERO_METRIC_FALLBACK;
  return heroMetric(ig.reels.length, ig.views7d);
}

function Placeholder({ block }: { block: LandingBlock }) {
  return (
    <section
      id={block.slug ?? undefined}
      className="border-t border-foreground/10 px-8 py-5 text-sm text-foreground/40 md:px-12"
    >
      блок {block.n} · {block.title} — ещё не собран
    </section>
  );
}

export default async function Home() {
  const [canon, locationText] = await Promise.all([resolveDoc(["landing"]), machineLine()]);
  const blocks = landingBlocks(canon?.md ?? "");
  return (
    <main className="flex w-full flex-1 flex-col">
      {blocks.map((block) => {
        // Шапка живёт внутри героя: у донора это один экран, и рисуется он один раз.
        if (block.slug === "header") return null;
        if (block.slug === "hero") {
          return (
            <MinimalistHero
              key={block.slug}
              logoText="zavod"
              navLinks={NAV}
              ctaLabel="Сделать ролик"
              ctaHref="#cta"
              mainText="Вставьте ссылку на новость. Через шесть минут у вас вертикальный ролик с голосом, карточками и субтитрами, готовый к эфиру."
              readMoreLabel="Как это работает"
              readMoreLink="#how"
              imageSrc="/landing/hero-frame.webp"
              imageAlt="Кадр ролика завода: карточка с цифрой"
              overlayText={{ part1: "новость", part2: "в ролик", part3: "за 6 минут." }}
              socialLinks={SOCIAL}
              locationText={locationText}
            />
          );
        }
        return <Placeholder key={block.slug ?? `block-${block.n}`} block={block} />;
      })}
    </main>
  );
}
