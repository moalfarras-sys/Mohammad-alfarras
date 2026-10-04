import { after, NextResponse } from "next/server";

import { readAppEcosystem, resolveDownloadBySlug } from "@/lib/app-ecosystem";
import { downloadEventFromRequest, recordDownload, shouldCountDownload } from "@/lib/download-counter";
import { mirrorFor, resolveDownloadTarget } from "@/lib/download-mirror";
import type { ManagedAppSlug } from "@moalfarras/shared/app-products";
import { currentAppReleases } from "@moalfarras/shared/app-releases";

/**
 * The one implementation behind "send this visitor the latest Android APK".
 *
 * Used by `/api/app/download/latest` (Android branch) and by the permanent
 * short links `/mp` and `/mp2` that TV owners type into the Downloader app, so
 * every entry point picks the same asset, prefers the same host and records
 * the download in the same counters.
 */

const noStore = { "Cache-Control": "no-store" } as const;

export type LatestApkOptions = {
  /** Explicit ABI requested by the caller (`?abi=`). */
  abi?: string | null;
  /** Pins the exact asset whose SHA-256 the config advertised (`?asset=`). */
  assetId?: string | null;
  /** Platform recorded with the download event (undefined = android). */
  platform?: string;
  /**
   * When the release lookup cannot produce a URL, redirect to the verified
   * release constant in @moalfarras/shared/app-releases instead of answering
   * 404. The short links use this: a Downloader code must never dead-end.
   */
  fallbackToCurrentRelease?: boolean;
  /** Where to send the visitor when downloads are paused (maintenance / disabled). */
  unavailableRedirect?: string;
  /** Extra metadata stored with the download event, e.g. `{ shortLink: "/mp" }`. */
  eventMetadata?: Record<string, unknown>;
};

type Resolved = {
  url: string;
  releaseSlug: string;
  assetId: string;
  fileName: string;
};

function currentReleaseTarget(product: ManagedAppSlug): Resolved {
  const release = currentAppReleases[product];
  return {
    url: release.asset.url,
    releaseSlug: release.releaseSlug,
    assetId: release.asset.id,
    fileName: `${release.releaseSlug}.apk`,
  };
}

function unavailableJson(productName: string, mode: "maintenance" | "disabled", message?: string) {
  return NextResponse.json(
    {
      error:
        message ||
        (mode === "maintenance"
          ? `${productName} is under maintenance. Please try again shortly.`
          : `${productName} downloads are currently disabled.`),
      status: mode,
    },
    { status: 503, headers: noStore },
  );
}

export async function latestApkResponse(
  request: Request,
  product: ManagedAppSlug,
  options: LatestApkOptions = {},
): Promise<Response> {
  const { abi = null, assetId = null, platform, fallbackToCurrentRelease = false } = options;

  let resolved: Resolved | null = null;
  try {
    const ecosystem = await readAppEcosystem(product);
    const runtime = ecosystem.runtimeConfig;
    const paused = runtime?.enabled === false ? "disabled" : runtime?.maintenanceMode === true ? "maintenance" : null;
    if (paused) {
      if (options.unavailableRedirect) {
        return NextResponse.redirect(new URL(options.unavailableRedirect, request.url), { status: 307, headers: noStore });
      }
      return unavailableJson(ecosystem.product.product_name, paused, runtime?.message);
    }

    const latest = ecosystem.releases[0] ?? null;
    if (!latest && !fallbackToCurrentRelease) {
      return NextResponse.json({ error: "Release not found" }, { status: 404 });
    }
    if (latest) {
      const found = await resolveDownloadBySlug(latest.slug, abi, assetId);
      if (!found && !fallbackToCurrentRelease) {
        return NextResponse.json({ error: "Release asset not found" }, { status: 404 });
      }
      if (found) {
        resolved = {
          url: found.redirectUrl,
          releaseSlug: latest.slug,
          assetId: found.asset.id,
          fileName: found.filename,
        };
      }
    }
  } catch (error) {
    if (!fallbackToCurrentRelease) throw error;
  }

  if (!resolved) resolved = currentReleaseTarget(product);

  // Prefer the free host, but never hand a visitor a dead link: if GitHub is
  // unreachable (the repo has been private before) the Blob mirror takes over.
  const resolvedUrl = await resolveDownloadTarget(resolved.url, mirrorFor(resolved.url));
  const target = new URL(resolvedUrl, request.url);

  if (shouldCountDownload(request)) {
    const event = resolved;
    after(() =>
      recordDownload(
        product,
        platform,
        downloadEventFromRequest(request, {
          releaseSlug: event.releaseSlug,
          assetId: event.assetId,
          fileName: event.fileName,
          targetUrl: event.url,
          ...(options.eventMetadata ? { metadata: options.eventMetadata } : {}),
        }),
      ),
    );
  }

  return NextResponse.redirect(target, { status: 307, headers: noStore });
}

/**
 * Route handler for a permanent short link (`/mp`, `/mp2`). GET and HEAD both
 * answer with a 307 to the latest APK; only real GETs are counted. When the
 * owner pauses downloads the visitor lands on the /tv page, which explains it.
 */
export function shortLinkHandler(product: ManagedAppSlug, shortPath: string) {
  return async function handler(request: Request) {
    return latestApkResponse(request, product, {
      fallbackToCurrentRelease: true,
      unavailableRedirect: "/tv",
      eventMetadata: { shortLink: shortPath },
    });
  };
}
