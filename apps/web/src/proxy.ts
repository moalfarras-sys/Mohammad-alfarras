// Next.js 16 "proxy" convention (replaces deprecated middleware.ts).
// Handles locale prefixing on public pages. Admin routes are exempt so the
// locale-prefixed Website CMS at /{locale}/admin can keep working while /admin
// (no locale) redirects externally to admin.moalfarras.space.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n";

function localeFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isLocale(segment)) {
    return segment;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Routes that intentionally live outside the [locale] segment.
  // /admin itself (no locale) is a permanent redirect to admin.moalfarras.space,
  // handled by the page component — we just let it through here.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/privacy" ||
    pathname.startsWith("/privacy/") ||
    pathname === "/support" ||
    pathname.startsWith("/support/")
  ) {
    return NextResponse.next();
  }

  const locale = localeFromPathname(pathname);

  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-locale", locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
