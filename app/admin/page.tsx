import { listBrains } from "@/lib/brains";
import { navTree, projectSentence, readDoc } from "@/lib/docs";
import { loadSocial } from "@/lib/social";
import { Card } from "./_components/card";
import { SectionLabel } from "./_components/shell";

export const dynamic = "force-dynamic";

// /admin — вход: фраза о проекте и по карточке-двери на зону хедера с одной
// строкой пульса. Цифры живут на экранах зон. Канон — docs/admin.md.

export default async function Admin() {
  if (!process.env.ADMIN_PASSWORD) {
    return (
      <section className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        Закрыто: задай ADMIN_PASSWORD в файле с ключами — docs/deploy.md, «Где живут ключи».
      </section>
    );
  }
  const [readme, tree, brains, social] = await Promise.all([
    readDoc("README.md"),
    navTree(),
    listBrains().catch(() => []),
    loadSocial(),
  ]);
  const pulse: Record<string, string> = {
    brains: brains.length
      ? `мозгов ${brains.length}: ${brains.map((b) => b.name).join(", ")}`
      : "мозгов пока нет",
    social:
      "reason" in social
        ? `цифры недоступны: ${social.reason}`
        : social.networks
            .map((n) => `${n.id} ${n.door?.on ? "включён" : "на паузе"} · за 7 дней ${n.posts7d}`)
            .join(" · "),
  };
  return (
    <section className="space-y-2">
      <SectionLabel id="zones">ЗОНЫ — карточка = дверь, адрес = адрес правил</SectionLabel>
      <p className="max-w-3xl text-sm leading-6 text-zinc-700">{projectSentence(readme)}</p>
      <div data-testid="zones" className="grid gap-3 lg:grid-cols-2">
        {(tree.children ?? []).map((zone) => (
          <Card
            key={zone.href}
            title={zone.label}
            href={zone.href}
            lines={[zone.note ?? "", pulse[zone.label] ?? ""].filter(Boolean)}
            code={zone.doc}
          />
        ))}
      </div>
    </section>
  );
}
