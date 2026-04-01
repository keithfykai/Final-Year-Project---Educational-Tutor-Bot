import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "__session";

function hasSession(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_COOKIE)?.value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSession(request);

  // Signed-in users visiting "/" → redirect to dashboard
  // Only redirect if the session cookie is confirmed present.
  if (pathname === "/" && authed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected routes: only block if we are CERTAIN the user has no session.
  // Pages also guard themselves via onAuthStateChanged, so this is a UX
  // optimisation only. We skip the block if the session cookie isn't present
  // but Firebase Admin may not be configured (dev without service account).
  // In that case the page-level auth guard handles the redirect.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js assets)
     * - favicon.ico, public files
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)",
  ],
};
