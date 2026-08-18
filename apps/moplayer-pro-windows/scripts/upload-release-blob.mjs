// Upload the freshly packaged Windows binaries to the public Vercel Blob store
// (store: moplayer-downloads, linked to the mohammad-alfarras Vercel project).
//
// Publish flow for a new MoPlayer PC version:
//   1. bump `version` in package.json
//   2. npm run dist            (build + package + write release meta)
//   3. npm run release:upload  (this script: upload binaries, refresh meta)
//   4. commit apps/web/public/downloads/moplayer/windows/{latest-windows.json,latest.yml}
//   5. deploy the website
//
// Requires a logged-in Vercel CLI (`npx vercel whoami`) on this machine.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import pkg from "../package.json" with { type: "json" };

const repoRoot = path.resolve("..", "..");
const releaseDir = path.resolve("release");
const prefix = `moplayer/windows/${pkg.version}`;

const uploads = [
  { name: "MoPlayer-PC-Setup.exe", required: true },
  { name: "MoPlayer-PC-Portable.exe", required: true },
  // Enables differential (delta) auto-updates in electron-updater.
  { name: "MoPlayer-PC-Setup.exe.blockmap", required: false },
];

for (const upload of uploads) {
  const filePath = path.join(releaseDir, upload.name);
  if (!existsSync(filePath)) {
    if (upload.required) {
      console.error(`ERROR: ${upload.name} not found in ${releaseDir}. Run \`npm run dist\` first.`);
      process.exit(1);
    }
    console.warn(`skipping optional ${upload.name} (not found)`);
    continue;
  }
  console.log(`uploading ${prefix}/${upload.name} ...`);
  const result = spawnSync(
    "npx",
    [
      "--yes",
      "vercel",
      "blob",
      "put",
      filePath,
      "--access",
      "public",
      "--pathname",
      `${prefix}/${upload.name}`,
      "--allow-overwrite",
      "true",
      "--cache-control-max-age",
      "31536000",
      "--cwd",
      repoRoot,
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0) {
    console.error(`ERROR: upload failed for ${upload.name}`);
    process.exit(result.status ?? 1);
  }
}

// Refresh latest-windows.json + latest.yml so they point at the uploaded files.
const meta = spawnSync("node", ["scripts/write-release-meta.mjs"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(meta.status ?? 0);
