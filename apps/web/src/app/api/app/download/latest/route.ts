import { after, NextResponse } from "next/server";

import { readAppEcosystem, resolveDownloadBySlug } from "@/lib/app-ecosystem";
import { downloadEventFromRequest, recordDownload } from "@/lib/download-counter";
import { readLatestWindowsRelease } from "@/lib/windows-release";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

function unavailableResponse(productName: string, mode: "maintenance" | "disabled", message?: string) {
  return NextResponse.json(
    {
      error:
        message ||
        (mode === "maintenance"
          ? `${productName} is under maintenance. Please try again shortly.`
          : `${productName} downloads are currently disabled.`),
      status: mode,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = resolveManagedAppSlug(url.searchParams.get("product"));
  const platform = url.searchParams.get("platform")?.toLowerCase();
  const abi = url.searchParams.get("abi");

  if (product === "moplayer2" && platform === "windows") {
    const portable = url.searchParams.get("portable") === "1";
    const release = await readLatestWindowsRelease();
    if (release?.maintenance) {
      return NextResponse.json(
        { error: "MoPlayer PC is under maintenance. Please try again shortly." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    // Binaries are >100 MB, so production hosts them on GitHub Releases;
    // the local static copy is only a dev fallback.
    const external = portable ? release?.portableDownloadUrl : release?.downloadUrl;
    const fileName = (portable ? release?.portableFile : release?.file) || "MoPlayer-PC-Setup.exe";
    const target = external ?? new URL(`/downloads/moplayer/windows/${fileName}`, request.url);
    after(() =>
      recordDownload(
        product,
        "windows",
        downloadEventFromRequest(request, {
          fileName,
          targetUrl: String(target),
          metadata: { portable },
        }),
      ),
    );
    return NextResponse.redirect(target, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const ecosystem = await readAppEcosystem(product);
  const runtime = ecosystem.runtimeConfig;
  if (runtime?.enabled === false) {
    return unavailableResponse(ecosystem.product.product_name, "disabled", runtime.message);
  }
  if (runtime?.maintenanceMode === true) {
    return unavailableResponse(ecosystem.product.product_name, "maintenance", runtime.message);
  }

  const latest = ecosystem.releases[0] ?? null;

  if (!latest) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }

  const resolved = await resolveDownloadBySlug(latest.slug, abi);
  if (!resolved) {
    return NextResponse.json({ error: "Release asset not found" }, { status: 404 });
  }

  const target = new URL(resolved.redirectUrl, request.url);

  after(() =>
    recordDownload(
      product,
      platform,
      downloadEventFromRequest(request, {
        releaseSlug: latest.slug,
        assetId: resolved.asset.id,
        fileName: resolved.filename,
        targetUrl: resolved.redirectUrl,
      }),
    ),
  );
  return NextResponse.redirect(target, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
