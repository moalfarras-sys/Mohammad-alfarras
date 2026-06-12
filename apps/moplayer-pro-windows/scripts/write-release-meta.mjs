import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import pkg from "../package.json" with { type: "json" };

const SETUP_NAME = "MoPlayer-PC-Setup.exe";
const PORTABLE_NAME = "MoPlayer-PC-Portable.exe";
const LEGACY_NAMES = ["MoPlayer-Pro-Setup.exe", "MoPlayer-Pro-Portable.exe"];
const RELEASE_REPO = "moalfarras-sys/Mohammad-alfarras";
const RELEASE_TAG = `moplayer-pc-v${pkg.version}`;

const outDir = path.resolve("..", "..", "apps", "web", "public", "downloads", "moplayer", "windows");
const appRoot = path.resolve(".");

// Find the release directory — prefer `release`, fall back to newest `release-*`
function findReleaseDir() {
  const primary = path.join(appRoot, "release");
  if (existsSync(path.join(primary, SETUP_NAME))) return primary;

  const entries = readdirSync(appRoot, { withFileTypes: true });
  const alts = entries
    .filter((e) => e.isDirectory() && /^release-\d+$/.test(e.name))
    .map((e) => path.join(appRoot, e.name))
    .filter((d) => existsSync(path.join(d, SETUP_NAME)))
    .sort()
    .reverse(); // newest first
  if (alts.length > 0) return alts[0];
  return primary; // fallback even if missing
}

const releaseDir = findReleaseDir();
const setupPath = path.join(releaseDir, SETUP_NAME);
const portablePath = path.join(releaseDir, PORTABLE_NAME);

async function fileInfo(filePath) {
  if (!existsSync(filePath)) return null;
  const [fileStat, bytes] = await Promise.all([stat(filePath), readFile(filePath)]);
  return {
    sizeBytes: fileStat.size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const setup = await fileInfo(setupPath);
const portable = await fileInfo(portablePath);
if (!setup) {
  console.warn(`WARNING: ${SETUP_NAME} not found in ${releaseDir}; metadata will have null size/sha.`);
}
const metadata = {
  version: pkg.version,
  platform: "windows",
  file: SETUP_NAME,
  portableFile: PORTABLE_NAME,
  // Public binary host: GitHub Releases (Vercel cannot serve >100 MB static files).
  downloadUrl: `https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/${SETUP_NAME}`,
  portableDownloadUrl: `https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/${PORTABLE_NAME}`,
  fileSizeBytes: setup?.sizeBytes ?? null,
  portableFileSizeBytes: portable?.sizeBytes ?? null,
  sha256: setup?.sha256 ?? null,
  portableSha256: portable?.sha256 ?? null,
  releaseDate: new Date().toISOString().slice(0, 10),
  systemRequirements: "Windows 10 / Windows 11 x64",
  notes: "MoPlayer PC for Windows. Installer and portable builds are hosted on GitHub Releases; the website download API redirects there.",
  productSlug: "moplayer2",
};

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "latest-windows.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
// Local copies allow `next dev`/local QA to serve the EXE without hitting GitHub.
if (setup) {
  await copyFile(setupPath, path.join(outDir, SETUP_NAME));
}
if (portable) {
  await copyFile(portablePath, path.join(outDir, PORTABLE_NAME));
}
// Drop stale legacy-named copies so nothing links to outdated binaries.
for (const legacy of LEGACY_NAMES) {
  await rm(path.join(outDir, legacy), { force: true });
}
console.log(`Release metadata written for v${pkg.version} (${RELEASE_TAG}).`);
