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
  const { pathname, hostname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (hostname === "admin.moalfarras.space") {
    const url = request.nextUrl.clone();
    url.hostname = "moalfarras.space";
    url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

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
