import { describe, expect, it } from "vitest";

import { releaseAssetDownloadUrl, selectReleaseAsset } from "@/lib/release-asset-selection";

const universalOld = { id: "a-universal-old", abi: "universal", is_primary: true, created_at: "2026-09-01T10:00:00.000Z" };
const universalNew = { id: "b-universal-new", abi: "Universal", is_primary: true, created_at: "2026-09-02T10:00:00.000Z" };
const arm64Primary = { id: "c-arm64", abi: "arm64-v8a", is_primary: true, created_at: "2026-08-30T10:00:00.000Z" };
const armv7 = { id: "d-armv7", abi: "armeabi-v7a", is_primary: false, created_at: "2026-09-03T10:00:00.000Z" };

describe("selectReleaseAsset", () => {
  it("returns null when a release has no assets", () => {
    expect(selectReleaseAsset([])).toBeNull();
    expect(selectReleaseAsset(null)).toBeNull();
  });

  it("serves the universal APK before a primary split APK", () => {
    expect(selectReleaseAsset([arm64Primary, universalOld])?.id).toBe("a-universal-old");
  });

  it("prefers the newest universal upload when a release was re-saved", () => {
    expect(selectReleaseAsset([universalOld, universalNew])?.id).toBe("b-universal-new");
  });

  it("honours an explicitly requested ABI case-insensitively", () => {
    expect(selectReleaseAsset([universalNew, armv7], "ARMEABI-V7A")?.id).toBe("d-armv7");
    expect(selectReleaseAsset([universalNew, armv7], "x86")?.id).toBe("b-universal-new");
  });

  it("picks the same asset whatever order the assets were read in", () => {
    // Config reads assets by created_at ascending; the download route reads them by is_primary.
    const configOrder = [arm64Primary, universalOld, universalNew, armv7];
    const downloadOrder = [universalNew, arm64Primary, universalOld, armv7];
    expect(selectReleaseAsset(configOrder)).toBe(selectReleaseAsset(downloadOrder));
    expect(selectReleaseAsset([...configOrder].reverse())?.id).toBe("b-universal-new");
  });

  it("breaks exact ties by id so the choice is stable", () => {
    const first = { id: "asset-1", abi: "universal", is_primary: true, created_at: "2026-09-01T10:00:00.000Z" };
    const second = { ...first, id: "asset-2" };
    expect(selectReleaseAsset([second, first])?.id).toBe("asset-1");
    expect(selectReleaseAsset([first, second])?.id).toBe("asset-1");
  });

  it("ranks an asset with a timestamp above one without", () => {
    const undated = { id: "a", abi: "universal", is_primary: true, created_at: null };
    const dated = { id: "z", abi: "universal", is_primary: true, created_at: "2026-01-01T00:00:00.000Z" };
    expect(selectReleaseAsset([undated, dated])?.id).toBe("z");
  });
});

describe("releaseAssetDownloadUrl", () => {
  it("pins the download to the asset whose checksum is advertised", () => {
    expect(releaseAssetDownloadUrl("moplayer2", "b-universal-new")).toBe(
      "/api/app/download/latest?product=moplayer2&asset=b-universal-new",
    );
  });

  it("falls back to the product route when no asset is known", () => {
    expect(releaseAssetDownloadUrl("moplayer2", null)).toBe("/api/app/download/latest?product=moplayer2");
  });
});
