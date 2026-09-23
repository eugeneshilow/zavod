import { NextResponse, type NextRequest } from "next/server";
import { cookieOptions, SESSION_COOKIE } from "@/lib/admin-session";

// Выход: кука входа стирается на том же домене, где ставилась.

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const response = NextResponse.redirect(url);
  response.cookies.set(SESSION_COOKIE, "", {
    ...cookieOptions(request.headers.get("host")),
    maxAge: 0,
  });
  return response;
}
