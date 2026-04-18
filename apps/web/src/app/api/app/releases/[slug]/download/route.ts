import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { resolveDownloadBySlug } from "@/lib/app-ecosystem";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const resolved = await resolveDownloadBySlug(slug);

  if (!resolved) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }

  let redirectUrl = resolved.redirectUrl;

  if (!redirectUrl.startsWith("http")) {
    const requestHeaders = await headers();
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const fallbackOrigin = new URL(request.url).origin;
    const origin = forwardedHost
      ? `${forwardedProto ?? new URL(request.url).protocol.replace(":", "")}://${forwardedHost}`
      : fallbackOrigin;

    redirectUrl = new URL(redirectUrl, origin).toString();
  }

  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
