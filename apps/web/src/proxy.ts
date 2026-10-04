// Handles locale prefixing on public pages. The unified admin lives on
// admin.moalfarras.space; locale-prefixed admin entrypoints are bridged there
// so visitors do not land on the old editor login surface.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/lib/i18n";
import { appTvInstall, tvInstallPagePath } from "@moalfarras/shared/app-releases";

function localeFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isLocale(segment)) {
    return segment;
  }
  return null;
}

const tvShortLinkPaths = new Set([...Object.values(appTvInstall).map((item) => item.shortPath), tvInstallPagePath]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.toLowerCase();

  if (host === "www.moalfarras.space") {
    const url = request.nextUrl.clone();
    url.hostname = "moalfarras.space";
    if (pathname === "/index.html") {
      url.pathname = `/${defaultLocale}`;
    } else {
      const localizedIndex = pathname.match(/^\/(en|ar)\/index\.html$/);
      if (localizedIndex) url.pathname = `/${localizedIndex[1]}`;
    }
    return NextResponse.redirect(url, 308);
  }

  // TV install short links (/mp, /mp2, /tv) live outside the locale segment.
  // People type them with a remote, so /MP or /Tv/ are folded onto the
  // canonical lowercase path instead of 404ing.
  const tvShortLink = pathname.replace(/\/+$/, "").toLowerCase();
  if (tvShortLinkPaths.has(tvShortLink)) {
    if (pathname !== tvShortLink) {
      const url = request.nextUrl.clone();
      url.pathname = tvShortLink;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  const locale = localeFromPathname(pathname);

  const legacyPortfolioRoute = pathname.match(/^\/(en|ar)\/(?:projects|blog)(\/.*)?$/);
  if (legacyPortfolioRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${legacyPortfolioRoute[1]}/work${legacyPortfolioRoute[2] ?? ""}`;
    return NextResponse.redirect(url, 301);
  }

  if (locale && (pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`))) {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.moalfarras.space";
    const destination = new URL(
      pathname === `/${locale}/admin` || pathname === `/${locale}/admin/` ? "/" : "/website",
      adminUrl,
    );
    return NextResponse.redirect(destination, 308);
  }

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
    pathname === "/cv-print" ||
    pathname.startsWith("/cv-print/") ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/activate" ||
    pathname.startsWith("/activate/") ||
    pathname === "/privacy" ||
    pathname.startsWith("/privacy/") ||
    pathname === "/support" ||
    pathname.startsWith("/support/")
  ) {
    return NextResponse.next();
  }

  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, pathname === "/" ? 301 : 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
