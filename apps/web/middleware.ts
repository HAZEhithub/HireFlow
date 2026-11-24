import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // Cookie presence is not proof of a live session. Public auth pages must
  // remain reachable so a stale cookie after logout or account deletion
  // cannot bounce /sign-in → / → /sign-in.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
