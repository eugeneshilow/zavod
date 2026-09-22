import { Suspense } from "react";
import { deployInfo } from "@/lib/docs";
import { Atlas } from "./atlas";

export const dynamic = "force-dynamic";

// /admin/brand — бренд-атлас во весь экран: живая страница в раме и пульт
// справа снизу (вид · разрез · экран). Рама админки здесь выключена
// (app/admin/_components/frame.tsx). Канон зоны — docs/brand/README.md.

export default function BrandAtlasPage() {
  const deploy = deployInfo();
  return (
    <Suspense fallback={null}>
      <Atlas commit={deploy.commit} />
    </Suspense>
  );
}
