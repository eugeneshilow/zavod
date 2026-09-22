import { AtlasTabs } from "../_modes/tabs";
import { LayoutMode } from "../_modes/layout-mode";

export const dynamic = "force-dynamic";

// /admin/brand/layout — режим «лендинг» бренд-атласа: сетка витрины
// (канон — docs/brand/layout.md).

export default function BrandLayoutPage() {
  return (
    <>
      <AtlasTabs active="layout" />
      <LayoutMode />
    </>
  );
}
