import { after, NextResponse } from "next/server";

import { readAppEcosystem, resolveDownloadBySlug } from "@/lib/app-ecosystem";
import { recordDownload } from "@/lib/download-counter";
import { readLatestWindowsRelease } from "@/lib/windows-release";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

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
    after(() => recordDownload(product, "windows"));
    return NextResponse.redirect(target, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const ecosystem = await readAppEcosystem(product);
  const latest = ecosystem.releases[0] ?? null;

  if (!latest) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }

  const resolved = await resolveDownloadBySlug(latest.slug, abi);
  if (!resolved) {
    return NextResponse.json({ error: "Release asset not found" }, { status: 404 });
  }

  const target = new URL(resolved.redirectUrl, request.url);

  after(() => recordDownload(product, platform));
  return NextResponse.redirect(target, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
