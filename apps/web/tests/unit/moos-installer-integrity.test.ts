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
      iso: { available: boolean; url: string; sizeBytes: number; sha256: string };
    };

    expect(manifest.iso).toEqual({
      available: false,
      url: "",
      sizeBytes: 0,
      sha256: "",
      notes: expect.any(String),
    });
  });
});
