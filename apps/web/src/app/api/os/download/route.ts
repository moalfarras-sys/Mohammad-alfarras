import { after, NextResponse } from "next/server";

import { downloadEventFromRequest, recordDownload, shouldCountDownload } from "@/lib/download-counter";
import { readLatestMoosRelease } from "@/lib/moos-release";

// MoOS download endpoint.
//
// MoOS is distributed image-first: the real, always-available install target is
// the signed container image on GHCR (see the editions on /apps/moos). The one
// thing that is an actual downloadable *file* is the bootable USB ISO, which is
// hosted only once a build is published. This route redirects to that ISO when
// it exists and returns a clear "not ready yet" JSON otherwise — never a broken
// link. When the ISO is later hosted (Blob / R2), set iso.available + iso.url in
// the bundled manifest or the `moos_release` site setting and this starts 307ing.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "iso").toLowerCase();

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
            "The MoOS bootable ISO is not hosted yet. Install MoOS today from the signed container image shown on the MoOS page.",
          status: "pending",
          installPage: "/apps/moos",
          notes: release?.iso.notes ?? null,
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const target = release.iso.url;
    if (shouldCountDownload(request)) {
      after(() =>
        recordDownload(
          "moos",
          "iso",
          downloadEventFromRequest(request, {
            fileName: "MoOS.iso",
            targetUrl: target,
          }),
        ),
      );
    }
    return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { error: "Unknown download type. Use ?type=iso.", status: "bad_request" },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}
