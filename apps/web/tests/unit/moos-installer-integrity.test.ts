import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const installerPaths = [
  path.join(process.cwd(), "public", "downloads", "moos", "moos-install.sh"),
  path.join(process.cwd(), "public", "downloads", "moos", "moos-cloud-install.sh"),
];

const releaseManifestPath = path.join(process.cwd(), "public", "downloads", "moos", "latest-moos.json");

describe("MoOS installer artifacts", () => {
  it.each(installerPaths)("keeps %s executable by Linux bash", async (installerPath) => {
    const script = await readFile(installerPath, "utf8");

    expect(script.startsWith("#!/usr/bin/env bash\n")).toBe(true);
    expect(script).not.toContain("\r");
    expect(script).toContain("set -euo pipefail");
    expect(script).toContain("ghcr.io/moalfarras-sys/moos");
  });

  it("publishes a stable, checksummed bootable ISO", async () => {
    const manifest = JSON.parse(await readFile(releaseManifestPath, "utf8")) as {
      iso: { available: boolean; url: string; sizeBytes: number; sha256: string };
    };

    expect(manifest.iso.available).toBe(true);
    expect(manifest.iso.url).toMatch(
      /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/downloads\/moos\/MoOS-\d{4}-\d{2}-\d{2}-x86_64-[a-f0-9]{8}\.iso$/,
    );
    expect(manifest.iso.sizeBytes).toBe(5_884_149_760);
    expect(manifest.iso.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.iso.url).toContain(manifest.iso.sha256.slice(0, 8));
  });
});
