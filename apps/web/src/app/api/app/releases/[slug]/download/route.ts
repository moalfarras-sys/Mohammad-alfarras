import { headers } from "next/headers";
import { after, NextResponse } from "next/server";

import { readAppEcosystem, resolveDownloadBySlug } from "@/lib/app-ecosystem";
import { downloadEventFromRequest, productFromReleaseSlug, recordDownload } from "@/lib/download-counter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const abi = new URL(request.url).searchParams.get("abi");
  const product = productFromReleaseSlug(slug);
  const ecosystem = await readAppEcosystem(product);
  const runtime = ecosystem.runtimeConfig;
  if (runtime?.enabled === false || runtime?.maintenanceMode === true) {
    const status = runtime.enabled === false ? "disabled" : "maintenance";
    return NextResponse.json(
      {
        error:
          runtime.message ||
          (status === "maintenance"
            ? `${ecosystem.product.product_name} is under maintenance. Please try again shortly.`
            : `${ecosystem.product.product_name} downloads are currently disabled.`),
        status,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const resolved = await resolveDownloadBySlug(slug, abi);

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

  after(() =>
    recordDownload(
      product,
      null,
      downloadEventFromRequest(request, {
        releaseSlug: slug,
        assetId: resolved.asset.id,
        fileName: resolved.filename,
        targetUrl: redirectUrl,
      }),
    ),
  );
  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
