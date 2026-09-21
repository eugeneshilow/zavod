import { renderDoc, resolveDoc, stripTitle } from "@/lib/docs";
import { loadReelsBoard } from "@/lib/reels";
import { Box, SectionLabel } from "../_components/shell";
import ReelsBoard from "./reels-board";

export const dynamic = "force-dynamic";

// /admin/publish — стекло зоны публикации: очередь, двери, эфир — и под ним
// канон docs/publish.md. Зеркало правила «адрес экрана = адрес канона» с
// живыми цифрами сверху.

export default async function PublishPage() {
  const [board, canon] = await Promise.all([loadReelsBoard(), resolveDoc(["publish"])]);
  return (
    <>
      <SectionLabel id="glass">СТЕКЛО — очередь, двери, эфир</SectionLabel>
      <ReelsBoard board={board} />
      {canon ? (
        <>
          <SectionLabel id="canon">КАНОН — как зона устроена прямо сейчас</SectionLabel>
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
