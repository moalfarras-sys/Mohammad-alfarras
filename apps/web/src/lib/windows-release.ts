import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSiteSetting, readSnapshot } from "@/lib/content/store";

export type WindowsRelease = {
  version: string;
  platform: "windows";
  file: string;
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

function mapWindowsRelease(raw: Record<string, unknown>, allowMaintenance: boolean): WindowsRelease | null {
  const version = asString(raw.version);
  const file = asString(raw.file);
  if (!version || !file) return null;

  return {
    version,
    platform: "windows",
    file,
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
    productSlug: "moplayer2",
  };
}

export async function readLatestWindowsRelease(): Promise<WindowsRelease | null> {
  // 1) Admin-managed (CMS site setting) wins, so the owner can change the
  //    version, download links and maintenance from the dashboard — no redeploy.
  try {
    const snapshot = await readSnapshot();
    const cms = getSiteSetting<Record<string, unknown>>(snapshot, "windows_release", {});
    const mapped = mapWindowsRelease(cms, true);
    if (mapped) return mapped;
  } catch {
    // fall through to the bundled file
  }

  // 2) Bundled static file (repo fallback / local dev).
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "moplayer", "windows", "latest-windows.json");
    const raw = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    if (asString(raw.productSlug) !== "moplayer2") return null;
    return mapWindowsRelease(raw, false);
  } catch {
    return null;
  }
}
