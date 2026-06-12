import { readFile } from "node:fs/promises";
import path from "node:path";

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

export async function readLatestWindowsRelease(): Promise<WindowsRelease | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "moplayer", "windows", "latest-windows.json");
    const raw = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    const version = asString(raw.version);
    const file = asString(raw.file);
    const productSlug = asString(raw.productSlug);
    if (!version || !file || productSlug !== "moplayer2") return null;

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
      productSlug: "moplayer2",
    };
  } catch {
    return null;
  }
}
