import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "moalfarras.space",
  "www.moalfarras.space",
  "alhasakah.net",
  "www.alhasakah.net",
  "qamishli.net",
  "www.qamishli.net",
  "ckefrnalgnbuaxsuufyx.supabase.co",
  "xubrjnbolomqrgeutcfw.supabase.co",
]);
const PUBLIC_SITE_PREFIXES = ["/images/", "/icons/", "/downloads/"];
const SUPABASE_STORAGE_PREFIX = "/storage/v1/object/public/";

function isAllowedAssetUrl(url: URL) {
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) return false;
  if (url.hostname.endsWith(".supabase.co")) return url.pathname.startsWith(SUPABASE_STORAGE_PREFIX);
  if (url.hostname === "moalfarras.space" || url.hostname === "www.moalfarras.space") {
    return PUBLIC_SITE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  }
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname);
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src") || "";
  let url: URL;

  try {
    url = new URL(src);
  } catch {
    return new NextResponse("Invalid asset URL", { status: 400 });
  }

  if (!isAllowedAssetUrl(url)) {
    return new NextResponse("Asset URL is not allowed", { status: 403 });
  }

  const upstream = await fetch(url, {
    headers: {
      accept: request.headers.get("accept") || "image/*",
      "user-agent": "MoalfarrasAdminImageProxy/1.0",
    },
    next: { revalidate: 3600 },
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Asset not found", { status: upstream.status || 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
