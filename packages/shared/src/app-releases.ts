import type { ManagedAppSlug } from "./app-products";

/**
 * The verified current Android release of each managed app.
 *
 * This is the single offline fallback used by the public site (config API,
 * product pages, download routes) and the admin control center whenever the
 * database has no release rows. Keep it in sync with the GitHub Release that
 * actually hosts the APK: version, size and SHA-256 must match the file, and
 * `publishedAt` is the GitHub Release publish time (never "now").
 */
export type CurrentAppRelease = {
  productSlug: ManagedAppSlug;
  releaseId: string;
  releaseSlug: string;
  versionName: string;
  versionCode: number;
  /** ISO-8601 publish time of the GitHub Release. */
  publishedAt: string;
  minSdk: number;
  targetSdk: number;
  releaseNotes: string;
  /** One-paragraph notes shown in the in-app update prompt. */
  updateNotes: string;
  compatibilityNotes: string;
  asset: {
    id: string;
    label: string;
    abi: "universal";
    url: string;
    fileSizeBytes: number;
    checksumSha256: string;
  };
};

export const currentAppReleases: Record<ManagedAppSlug, CurrentAppRelease> = {
  moplayer: {
    productSlug: "moplayer",
    releaseId: "release-moplayer-2-5-0",
    releaseSlug: "moplayer-2.5.0",
    versionName: "2.5.0",
    versionCode: 25,
    publishedAt: "2026-10-04T14:30:34.000Z",
    minSdk: 24,
    targetSdk: 35,
    releaseNotes:
      "MoPlayer Classic 2.5.0 draws the interface at the same size on every TV and box, with an Interface size option (Compact, Standard, Large), and adds phones and tablets in landscape. It ships the real DM Sans and Outfit fonts, a working language switch (device, English, Arabic with right-to-left layout) and a full Arabic translation. Live TV keeps the channel browser open while you choose, shows a 16:9 preview that never opens a second stream on one-connection accounts, and explains a failing channel within seconds (password changed, subscription expired, or the line in use elsewhere). Movies, Series, Search and Favorites use 2:3 posters in a grid that fits the space. Home starts on the first title, adds a Live TV row, shows real source names and 10-point ratings, and no longer flickers. Website activation never shows an unregistered code, retries and renews expired codes, and the EPG link from activation or the playlist fills the guide for M3U sources.",
    updateNotes:
      "MoPlayer Classic 2.5.0: the same interface size on every TV with an Interface size option, real fonts, a working Arabic/English switch, a smoother Live TV browser with clear error messages, cleaner poster grids, and more reliable website activation with EPG for M3U playlists.",
    compatibilityNotes: "Recommended universal TV APK for Android 7.0+ with arm64-v8a and armeabi-v7a native code included.",
    asset: {
      id: "asset-moplayer-2-5-0-universal",
      label: "Recommended TV APK",
      abi: "universal",
      url: "https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-android-2.5.0/app-sideload-universal-release.apk",
      fileSizeBytes: 53238825,
      checksumSha256: "48cdbda25ae91f99cb599a6c71177c4e821e31360dfce44ca5cbc6218480f2eb",
    },
  },
  moplayer2: {
    productSlug: "moplayer2",
    releaseId: "release-moplayer2-v2-7-2",
    releaseSlug: "moplayer2-2.7.2",
    versionName: "2.7.2",
    versionCode: 71,
    publishedAt: "2026-09-30T21:04:05.000Z",
    minSdk: 23,
    targetSdk: 36,
    releaseNotes:
      "MoPlayer Pro 2.7.2 makes the TV interface the same size on every TV: TVs and boxes that report a different screen density or use a larger system font no longer get an oversized interface with cut-off names. Group lists are wider and show full names, long channel names scroll when focused, and Settings > Look & Home has a new Interface size option (Compact, Standard, Large). Includes everything from 2.7.1.",
    updateNotes:
      "MoPlayer Pro 2.7.2 draws the interface at the same size on every TV, shows full group and channel names, and adds an Interface size option (Compact, Standard, Large) in Settings.",
    compatibilityNotes: "Recommended universal MoPlayer Pro APK for Android 6.0+ and Android TV devices with ARM 32-bit or 64-bit processors.",
    asset: {
      id: "asset-moplayer2-v2-7-2-universal",
      label: "MoPlayer Pro Universal Android TV APK",
      abi: "universal",
      url: "https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.2/app-universal-release.apk",
      fileSizeBytes: 56178347,
      checksumSha256: "8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a",
    },
  },
};

const androidVersionByApi: Record<number, string> = {
  21: "5.0",
  22: "5.1",
  23: "6.0",
  24: "7.0",
  25: "7.1",
  26: "8.0",
  27: "8.1",
  28: "9",
  29: "10",
  30: "11",
  31: "12",
  32: "12L",
  33: "13",
  34: "14",
  35: "15",
  36: "16",
};

/** Marketing Android version for an API level, e.g. 24 -> "7.0". */
export function androidVersionForApi(apiLevel: number): string | null {
  return androidVersionByApi[apiLevel] ?? null;
}

/** Human-readable minimum requirement, e.g. "Android 7.0+ (API 24)". */
export function androidRequirementLabel(minSdk: number): string {
  const version = androidVersionForApi(minSdk);
  return version ? `Android ${version}+ (API ${minSdk})` : `Android API ${minSdk}+`;
}
