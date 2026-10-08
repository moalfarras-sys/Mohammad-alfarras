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

  it("does not publish an ISO until its download host is verified", async () => {
    const manifest = JSON.parse(await readFile(releaseManifestPath, "utf8")) as {
      iso: { available: boolean; url: string; signatureUrl?: string; checksumUrl?: string; sizeBytes: number; sha256: string; deliveryVerifiedAt?: string };
    };

    if (!manifest.iso.available) {
      expect(manifest.iso.url).toBe("");
      return;
    }
    const proof = JSON.parse(await readFile(path.join(process.cwd(), "public/downloads/moos/delivery-proof.json"), "utf8"));
    expect(proof).toMatchObject({
      url: manifest.iso.url, sizeBytes: manifest.iso.sizeBytes, sha256: manifest.iso.sha256,
      checkedAt: manifest.iso.deliveryVerifiedAt, http: 200, rangeHttp: 206,
      anonymous: true, fullHashVerified: true, signatureVerified: true,
    });
    expect(manifest.iso.url).toMatch(/^https:\/\//);
    expect(manifest.iso.signatureUrl).toBe(`${manifest.iso.url}.sig`);
    expect(manifest.iso.checksumUrl).toBe(`${manifest.iso.url}.sha256`);
    expect(manifest.iso.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.iso.sizeBytes).toBeGreaterThan(0);
  });
});
