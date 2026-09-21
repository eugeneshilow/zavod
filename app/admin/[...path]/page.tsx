import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../_components/shell";

export const dynamic = "force-dynamic";

// Экран зоны по правилу зеркала: /admin/<путь> показывает docs/<путь>.md или
// docs/<путь>/README.md. Своего кода у такого экрана нет — появился файл в
// docs, появился экран. Зона со своим живым стеклом (publish) лежит рядом
// статическим раутом и перекрывает этот. Канон — docs/admin.md.

export default async function ZonePage({ params }: PageProps<"/admin/[...path]">) {
  const { path } = await params;
  const found = await resolveDoc(path);
  const expected = `docs/${path.join("/")}.md`;
  if (!found) {
    return (
      <>
        <SectionLabel>ЭКРАНА НЕТ — нет файла канона</SectionLabel>
        <Box title={`Нет ${expected}`}>
          <p className="text-sm leading-6 text-zinc-600">
            Адрес экрана — зеркало адреса канона. Заведите файл {expected} или папку с README.md —
            экран появится сам, вместе с кнопкой в хедере.
          </p>
        </Box>
      </>
    );
  }
  return (
    <>
      <SectionLabel>КАНОН — как зона устроена прямо сейчас</SectionLabel>
      <Box title="Канон зоны" aside={found.doc}>
        <div
          className="doc"
          dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(found.md), found.doc) }}
        />
      </Box>
    </>
  );
}
