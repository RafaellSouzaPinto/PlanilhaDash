import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name must match what Lucia is configured with in src/lib/auth/lucia.ts
const SESSION_COOKIE = "auth_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? null;

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/reports");

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Protect app routes: redirect to login if no session cookie
  if (isAppRoute && !sessionId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login/signup
  if (isAuthRoute && sessionId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/reports/:path*",
    "/login",
    "/signup",
  ],
};
