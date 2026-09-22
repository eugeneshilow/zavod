import { NextResponse, type NextRequest } from "next/server";
import { cabinetRewrite, isAppHost } from "@/lib/cabinet";

// Две работы на входе: хост `app.` переписывается на кабинет (канон —
// docs/cabinet/README.md), а /admin закрыт паролем (канон — docs/admin.md).

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isAppHost(request.headers.get("host"))) {
    const target = cabinetRewrite(pathname);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.next();
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (password === expected) return NextResponse.next();
  }
  return new NextResponse("401 Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/((?!_next|api|brand|build|.*\\..*).*)"],
};
