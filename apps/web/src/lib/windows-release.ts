import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSiteSetting, readSnapshot } from "@/lib/content/store";

export type WindowsReleaseScreenshot = {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
};

export type WindowsRelease = {
  version?: string;
  platform: "windows";
  file?: string;
  portableFile?: string;
  /** Absolute URL of the public installer binary (e.g. GitHub Releases). */
  downloadUrl?: string;
  /** Absolute URL of the public portable binary. */
  portableDownloadUrl?: string;
  fileSizeBytes?: number;
  portableFileSizeBytes?: number;
  sha256?: string;
  portableSha256?: string;
  releaseDate?: string;
  systemRequirements?: string;
  notes?: string;
  maintenance?: boolean;
  /** PC-specific hero image (managed from the admin PC media library). */
  heroImage?: string;
  heroAlt?: string;
  /** PC-specific card image used by MoPlayer family/listing cards. */
  cardImage?: string;
  cardAlt?: string;
  /** PC-specific gallery screenshots (managed from the admin PC media library). */
  screenshots?: string[];
  screenshotItems?: WindowsReleaseScreenshot[];
  productSlug: "moplayer2";
};

function asHttpsUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  return /^https:\/\//i.test(raw) ? raw : undefined;
}

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asScreenshotItems(raw: unknown): WindowsReleaseScreenshot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index): WindowsReleaseScreenshot | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const url = asString(record.url) || asString(record.image) || asString(record.image_path);
      if (!url) return null;
      const sortOrder = asNumber(record.sortOrder) ?? asNumber(record.sort_order) ?? index + 1;
      return {
        id: asString(record.id) || `pc-shot-${index + 1}`,
        url,
        alt: asString(record.alt) || asString(record.alt_text) || undefined,
        sortOrder,
      };
    })
    .filter((item): item is WindowsReleaseScreenshot => Boolean(item))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function asLegacyScreenshots(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function mapWindowsRelease(raw: Record<string, unknown>, allowMaintenance: boolean): WindowsRelease | null {
  const version = asString(raw.version);
  const file = asString(raw.file);
  const heroImage = asString(raw.heroImage);
  const cardImage = asString(raw.cardImage);
  const screenshotItems = asScreenshotItems(raw.screenshotItems);
  const screenshots = screenshotItems.length ? screenshotItems.map((item) => item.url) : asLegacyScreenshots(raw.screenshots);
  const hasContent = Boolean(
    version ||
      file ||
      asString(raw.downloadUrl) ||
      asString(raw.portableFile) ||
      asString(raw.portableDownloadUrl) ||
      heroImage ||
      cardImage ||
      screenshots.length ||
      (allowMaintenance && raw.maintenance === true),
  );
  if (!hasContent) return null;

  return {
    version: version || undefined,
    platform: "windows",
    file: file || undefined,
    portableFile: asString(raw.portableFile) || undefined,
    downloadUrl: asHttpsUrl(raw.downloadUrl),
    portableDownloadUrl: asHttpsUrl(raw.portableDownloadUrl),
    fileSizeBytes: asNumber(raw.fileSizeBytes),
    portableFileSizeBytes: asNumber(raw.portableFileSizeBytes),
    sha256: asString(raw.sha256) || undefined,
    portableSha256: asString(raw.portableSha256) || undefined,
    releaseDate: asString(raw.releaseDate) || undefined,
    systemRequirements: asString(raw.systemRequirements) || undefined,
    notes: asString(raw.notes) || undefined,
    maintenance: allowMaintenance ? raw.maintenance === true : false,
    heroImage: heroImage || undefined,
    heroAlt: asString(raw.heroAlt) || undefined,
    cardImage: cardImage || undefined,
    cardAlt: asString(raw.cardAlt) || undefined,
    screenshots: screenshots.length ? screenshots : undefined,
    screenshotItems: screenshotItems.length
      ? screenshotItems
      : screenshots.map((url, index) => ({ id: `pc-shot-${index + 1}`, url, sortOrder: index + 1 })),
    productSlug: "moplayer2",
  };
}

async function readBundledWindowsRelease(): Promise<WindowsRelease | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "moplayer", "windows", "latest-windows.json");
    const raw = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    if (asString(raw.productSlug) !== "moplayer2") return null;
    return mapWindowsRelease(raw, false);
  } catch {
    return null;
  }
}

function mergeWindowsReleaseDefaults(base: WindowsRelease | null, override: WindowsRelease): WindowsRelease {
  if (!base) return override;

  const merged: WindowsRelease = { ...base };
  for (const [key, value] of Object.entries(override) as Array<[keyof WindowsRelease, WindowsRelease[keyof WindowsRelease]]>) {
    if (value !== undefined) {
      (merged as Record<keyof WindowsRelease, WindowsRelease[keyof WindowsRelease]>)[key] = value;
    }
  }
  return merged;
}

export async function readLatestWindowsRelease(): Promise<WindowsRelease | null> {
  const bundledRelease = await readBundledWindowsRelease();

  // 1) Dashboard-managed site setting wins, so the owner can change the
  //    version, download links and maintenance from the dashboard — no redeploy.
  try {
    const snapshot = await readSnapshot();
    const cms = getSiteSetting<Record<string, unknown>>(snapshot, "windows_release", {});
    const mapped = mapWindowsRelease(cms, true);
    if (mapped) return mergeWindowsReleaseDefaults(bundledRelease, mapped);
  } catch {
    // fall through to the bundled file
  }

  // 2) Bundled static file (repo fallback / local dev).
  return bundledRelease;
}
