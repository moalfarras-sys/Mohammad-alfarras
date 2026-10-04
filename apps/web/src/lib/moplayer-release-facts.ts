import { readAppEcosystem } from "@/lib/app-ecosystem";
import { selectReleaseAsset } from "@/lib/release-asset-selection";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { ManagedAppSlug } from "@moalfarras/shared/app-products";
import { androidVersionForApi, appTvInstall, currentAppReleases } from "@moalfarras/shared/app-releases";

export type Lang = "en" | "ar";

/**
 * Everything a MoPlayer page needs to say about the downloadable release,
 * taken from the live release data (database) with the verified shared
 * release constant as the offline fallback. Pages never hardcode versions,
 * sizes, codes or links.
 */
export type ReleaseFacts = {
  product: ManagedAppSlug;
  version: string;
  versionCode: number | null;
  sizeBytes: number | null;
  minSdk: number;
  minAndroid: string;
  publishedAt: string | null;
  sha256: string | null;
  /** Where the APK file is actually hosted (GitHub Releases for current builds). */
  fileUrl: string | null;
  hostedOnGithub: boolean;
  /** False while the owner has downloads in maintenance or disabled. */
  available: boolean;
  unavailableMessage: string;
  /** Permanent short link that always serves the latest APK, e.g. "/mp". */
  downloadHref: string;
  shortUrl: string;
  downloaderCode: string;
  activateHref: (locale: Lang) => string;
};

export function releaseFactsFrom(product: ManagedAppSlug, ecosystem: AppEcosystemData | null): ReleaseFacts {
  const fallback = currentAppReleases[product];
  const install = appTvInstall[product];
  const latest = ecosystem?.releases[0] ?? null;
  const asset = latest ? selectReleaseAsset(latest.assets) : null;
  const runtime = ecosystem?.runtimeConfig;
  const minSdk = ecosystem?.product.android_min_sdk || fallback.minSdk;
  const fileUrl = asset?.external_url ?? (latest ? null : fallback.asset.url);

  return {
    product,
    version: latest?.version_name || fallback.versionName,
    versionCode: latest?.version_code ?? fallback.versionCode,
    sizeBytes: asset?.file_size_bytes ?? (latest ? null : fallback.asset.fileSizeBytes),
    minSdk,
    minAndroid: androidVersionForApi(minSdk) ?? String(minSdk),
    publishedAt: latest?.published_at ?? fallback.publishedAt,
    sha256: asset?.checksum_sha256 ?? (latest ? null : fallback.asset.checksumSha256),
    fileUrl,
    hostedOnGithub: Boolean(fileUrl && /^https:\/\/github\.com\//.test(fileUrl)),
    available: runtime?.enabled !== false && runtime?.maintenanceMode !== true,
    unavailableMessage: runtime?.message?.trim() ?? "",
    downloadHref: install.shortPath,
    shortUrl: install.shortUrl,
    downloaderCode: install.downloaderCode,
    activateHref: (locale) => `/${locale}/activate?product=${product}`,
  };
}

export async function readReleaseFacts(product: ManagedAppSlug): Promise<ReleaseFacts> {
  try {
    return releaseFactsFrom(product, await readAppEcosystem(product));
  } catch {
    return releaseFactsFrom(product, null);
  }
}

export function formatFileSize(bytes: number | null | undefined, locale: Lang) {
  if (!bytes) return null;
  const value = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / (1024 * 1024));
  return locale === "ar" ? `${value} ميغابايت` : `${value} MB`;
}

export function formatReleaseDate(iso: string | null | undefined, locale: Lang) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
