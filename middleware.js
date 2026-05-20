// middleware.js
// ─── حماية التطبيق — لو مش مسجل دخول يروح للـ Login ─────────

import { NextResponse } from "next/server";

function decodeToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // تحقق من انتهاء الصلاحية
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    // تحقق من وجود user id
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // المسارات المسموح بيها بدون login
  const publicPaths = ["/login", "/auth/callback", "/api/auth", "/api/logout"];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // تحقق من الـ session cookie
  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (!accessToken || !decodeToken(accessToken)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // حمي كل الصفحات ماعدا الـ static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
