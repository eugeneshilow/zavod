import { LogoMode } from "../_modes/logo-mode";

export const dynamic = "force-dynamic";

// /admin/brand/logo — вид «лого» бренд-атласа, без рамы админки: атлас показывает
// его в своей раме (канон — docs/brand/logo.md).

export default function BrandLogoPage() {
  return (
    <>
      <LogoMode />
    </>
  );
}
