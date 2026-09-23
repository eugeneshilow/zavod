import { NextResponse, type NextRequest } from "next/server";
import { cabinetRewrite, isAppHost } from "@/lib/cabinet";
import { checkSession, cookieOptions, makeSession, SESSION_COOKIE } from "@/lib/admin-session";

// Две работы на входе: хост `app.` переписывается на кабинет (канон —
// docs/cabinet/README.md), а /admin и кабинет закрыты входом (канон —
// docs/admin.md «Доступ»). Вход — кука на 90 дней со страницы /login;
// заголовок Basic принимается тоже, для скриптов и тестов.

const OPEN = ["/login", "/logout"];

function basicOk(request: NextRequest, expected: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = atob(encoded);
  return decoded.slice(decoded.indexOf(":") + 1) === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");
  const onApp = isAppHost(host);
  const open = OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const closed =
    !open && (onApp || pathname.startsWith("/admin") || pathname.startsWith("/cabinet"));
  const expected = process.env.ADMIN_PASSWORD;

  let renew = false;
  if (closed && expected) {
    const session = await checkSession(request.cookies.get(SESSION_COOKIE)?.value, expected);
    if (!session.ok && !basicOk(request, expected)) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new NextResponse("401 Unauthorized", { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    renew = session.renew;
  }

  let response = NextResponse.next();
  if (onApp && !open) {
    const target = cabinetRewrite(pathname);
    if (target) {
      const url = request.nextUrl.clone();
      url.pathname = target;
      response = NextResponse.rewrite(url);
    }
  }
  if (renew && expected) {
    response.cookies.set(SESSION_COOKIE, await makeSession(expected), cookieOptions(host));
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/((?!_next|api|brand|build|.*\\..*).*)"],
};
