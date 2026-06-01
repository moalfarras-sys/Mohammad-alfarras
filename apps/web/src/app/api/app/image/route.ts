import { NextResponse } from "next/server";

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

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!isAllowedImageUrl(target)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const upstream = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
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
