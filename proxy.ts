import { NextResponse, type NextRequest } from "next/server";
import { cabinetRewrite, isAppHost } from "@/lib/cabinet";

// Две работы на входе: хост `app.` переписывается на кабинет (канон —
// docs/cabinet/README.md), а /admin закрыт паролем (канон — docs/admin.md).

// Кабинет за паролем админки до входа покупателя: кнопка «Сделать ролик»
// ставит ролик в эфир канала завода, открытой её держать нельзя.

function authorized(request: NextRequest, expected: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = atob(encoded);
  return decoded.slice(decoded.indexOf(":") + 1) === expected;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onApp = isAppHost(request.headers.get("host"));
  const closed = onApp || pathname.startsWith("/admin") || pathname.startsWith("/cabinet");
  const expected = process.env.ADMIN_PASSWORD;
  if (closed && expected && !authorized(request, expected)) {
    return new NextResponse("401 Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="admin"' },
    });
  }
  if (onApp) {
    const target = cabinetRewrite(pathname);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      return NextResponse.rewrite(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/((?!_next|api|brand|build|.*\\..*).*)"],
};
