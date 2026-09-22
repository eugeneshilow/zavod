import { AtlasTabs } from "../_modes/tabs";
import { LogoMode } from "../_modes/logo-mode";

export const dynamic = "force-dynamic";

// /admin/brand/logo — режим «лого» бренд-атласа (канон — docs/brand/logo.md).

export default function BrandLogoPage() {
  return (
    <>
      <AtlasTabs active="logo" />
      <LogoMode />
    </>
  );
}
