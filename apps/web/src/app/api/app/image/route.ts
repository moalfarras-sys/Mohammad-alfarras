import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/request-guard";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^\[?::1\]?$/i,
];

const MAX_REDIRECTS = 4;

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

// Follow redirects manually so every hop is re-validated. With redirect:"follow"
// a public host could 302 the proxy to an internal address (169.254.169.254, LAN);
// re-checking each Location against isAllowedImageUrl closes that SSRF bypass.
async function fetchImageWithGuardedRedirects(initialUrl: string, init: RequestInit): Promise<Response> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(currentUrl, { ...init, redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return response;
      const nextUrl = new URL(location, currentUrl).toString();
      if (!isAllowedImageUrl(nextUrl)) {
        throw new Error("Blocked redirect to a disallowed host");
      }
      currentUrl = nextUrl;
      continue;
    }
    return response;
  }
  throw new Error("Too many redirects");
}

export async function GET(request: Request) {
  // No host allowlist on purpose: both TV apps proxy user-playlist and Xtream
  // artwork (stream_icon / movie_image / tvg-logo) from arbitrary provider hosts
  // through this route (Pro Cards.kt optimizedPosterUrl, Classic ImageUrlNormalizer),
  // so closing the host set would blank their posters. Abuse is contained instead
  // by the per-IP rate limit plus the SSRF, image-only, size and timeout guards.
  const limited = await rateLimit({ request, bucket: "app-image", limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const target = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!isAllowedImageUrl(target)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const upstream = await fetchImageWithGuardedRedirects(target, {
      signal: controller.signal,
      headers: {
        Accept: "image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        Referer: "https://www.themoviedb.org/",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android TV; MoPlayer Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "URL is not an image" }, { status: 415 });
    }

    const contentLength = Number(upstream.headers.get("content-length") ?? "0");
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    return new NextResponse(bytes, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Image proxy failed" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
