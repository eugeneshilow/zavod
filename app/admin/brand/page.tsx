import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { Box, SectionLabel } from "../_components/shell";
import { AtlasTabs } from "./_modes/tabs";
import { LayoutMode } from "./_modes/layout-mode";

export const dynamic = "force-dynamic";

// /admin/brand — бренд-атлас: переключатель режимов сверху, первый режим
// «лендинг» открыт по умолчанию, внизу канон зоны (docs/brand/README.md).

export default async function BrandAtlasPage() {
  const canon = await resolveDoc(["brand"]);
  return (
    <>
      <AtlasTabs active="layout" />
      <LayoutMode />
      {canon ? (
        <>
          <SectionLabel>АТЛАС — что в зоне бренда есть и чего пока нет</SectionLabel>
          <Box title="Канон зоны" aside={canon.doc}>
            <div
              className="doc"
              dangerouslySetInnerHTML={{ __html: renderDoc(stripTitle(canon.md), canon.doc) }}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}
