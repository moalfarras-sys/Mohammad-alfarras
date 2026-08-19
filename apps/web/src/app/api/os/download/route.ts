import { after, NextResponse } from "next/server";

import { downloadEventFromRequest, recordDownload, shouldCountDownload } from "@/lib/download-counter";
import { readLatestMoosRelease } from "@/lib/moos-release";

// MoOS download endpoint.
//
//   ?type=desktop | nvidia | cloud  → the official installer script for that
//                                      edition (a real file, always available)
//   ?type=iso                       → the bootable USB image, once it is hosted
//
// MoOS itself is distributed as a signed container image on GHCR; the installer
// scripts are what a visitor actually downloads and runs. The ISO is the one
// piece that depends on hosting, so it returns a clear "not ready" instead of a
// broken link until `iso.available` + `iso.url` are set (manifest or CMS).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "desktop").toLowerCase();

  const release = await readLatestMoosRelease();

  if (release?.maintenance) {
    return NextResponse.json(
      { error: "MoOS downloads are under maintenance. Please try again shortly.", status: "maintenance" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (type === "iso") {
    if (!release?.iso.available || !release.iso.url) {
      return NextResponse.json(
        {
          error:
            "The MoOS bootable ISO is not hosted yet. Download the installer for your edition instead — it installs the same signed system.",
          status: "pending",
          installPage: "/moos",
          notes: release?.iso.notes ?? null,
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const target = release.iso.url;
    if (shouldCountDownload(request)) {
      after(() =>
        recordDownload("moos", "iso", downloadEventFromRequest(request, { fileName: "MoOS.iso", targetUrl: target })),
      );
    }
    return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
  }

  const edition = release?.editions.find((item) => item.id === type);
  if (!edition?.installer) {
    return NextResponse.json(
      { error: "Unknown MoOS edition. Use ?type=desktop, nvidia, cloud or iso.", status: "bad_request" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const target = new URL(edition.installer, request.url);
  const fileName = edition.installer.split("/").pop() || "moos-install.sh";
  if (shouldCountDownload(request)) {
    after(() =>
      recordDownload(
        "moos",
        edition.id,
        downloadEventFromRequest(request, { fileName, targetUrl: String(target) }),
      ),
    );
  }
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}
