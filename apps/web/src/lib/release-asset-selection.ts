/**
 * The one rule for which APK of a release is served. The runtime config advertises this asset's size
 * and SHA-256 and the download routes serve it, so both must pick it the same way. Selection is
 * independent of the input order (config and download read the assets with different queries).
 */
export type SelectableReleaseAsset = {
  id?: string | null;
  abi?: string | null;
  is_primary?: boolean | null;
  created_at?: string | null;
};

function createdAtMs(asset: SelectableReleaseAsset) {
  const value = asset.created_at ? Date.parse(asset.created_at) : Number.NaN;
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

/**
 * Order: exact requested ABI, then the universal APK (installs on every device, and the TV apps never
 * send an ABI), then the primary flag, then the newest upload, then the id as a stable tie-break.
 */
export function selectReleaseAsset<T extends SelectableReleaseAsset>(
  assets: readonly T[] | null | undefined,
  preferredAbi?: string | null,
): T | null {
  if (!assets?.length) return null;
  const wantedAbi = preferredAbi?.trim().toLowerCase() || null;
  const score = (asset: T) => {
    const abi = asset.abi?.trim().toLowerCase() ?? "";
    return [wantedAbi !== null && abi === wantedAbi ? 1 : 0, abi === "universal" ? 1 : 0, asset.is_primary ? 1 : 0];
  };

  return [...assets].sort((left, right) => {
    const leftScore = score(left);
    const rightScore = score(right);
    for (let index = 0; index < leftScore.length; index += 1) {
      if (leftScore[index] !== rightScore[index]) return rightScore[index] - leftScore[index];
    }
    const leftCreatedAt = createdAtMs(left);
    const rightCreatedAt = createdAtMs(right);
    if (leftCreatedAt !== rightCreatedAt) return rightCreatedAt > leftCreatedAt ? 1 : -1;
    const leftId = String(left.id ?? "");
    const rightId = String(right.id ?? "");
    return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
  })[0];
}

/** Download URL pinned to the exact asset whose checksum the config advertises. */
export function releaseAssetDownloadUrl(product: string, assetId?: string | null) {
  const params = new URLSearchParams({ product });
  if (assetId) params.set("asset", assetId);
  return `/api/app/download/latest?${params.toString()}`;
}
