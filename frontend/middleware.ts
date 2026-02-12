import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIES = ["__session", "firebaseAuthToken", "firebase:authUser"];

function hasAuthCookie(request: NextRequest) {
  return AUTH_COOKIES.some((name) => request.cookies.get(name));
}

export function middleware(request: NextRequest) {
  if (!hasAuthCookie(request)) {
    const signinUrl = new URL("/signin", request.url);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/quizmode/:path*"],
};
