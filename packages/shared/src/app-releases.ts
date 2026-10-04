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
    releaseId: "release-moplayer-2-5-1",
    releaseSlug: "moplayer-2.5.1",
    versionName: "2.5.1",
    versionCode: 26,
    publishedAt: "2026-10-04T16:32:21.000Z",
    minSdk: 24,
    targetSdk: 35,
    releaseNotes:
      "MoPlayer Classic 2.5.1 builds on 2.5.0 (the same interface size on every TV with an Interface size option, real fonts, a working Arabic/English switch, a smoother Live TV browser with clear error messages, 2:3 poster grids, reliable website activation and EPG for M3U playlists). It adds a working parental lock for adult groups in Live TV, Movies and Series, shows the real channel count of each category, hides the guide card for channels without guide data, fixes the preview channel number, shows a connection message instead of invented weather when offline, and removes a duplicate settings store that could crash the app.",
    updateNotes:
      "MoPlayer Classic 2.5.1: working adult-content lock, correct channel counts, a cleaner guide card, no invented offline weather and a stability fix, on top of the 2.5.0 TV redesign.",
    compatibilityNotes: "Recommended universal TV APK for Android 7.0+ with arm64-v8a and armeabi-v7a native code included.",
    asset: {
      id: "asset-moplayer-2-5-1-universal",
      label: "Recommended TV APK",
      abi: "universal",
      url: "https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-android-2.5.1/app-sideload-universal-release.apk",
      fileSizeBytes: 53237761,
      checksumSha256: "210aba349a743437c6610bb6712ba78b719bd0bfc43389c2cbf966c909f3ea1c",
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

/**
 * How a TV owner installs each Android app without a browser: the numeric
 * code typed into the AFTVnews "Downloader" app and the short, remote-typeable
 * link that always redirects to the latest APK of that product.
 *
 * Downloader codes (go.aftvnews.com) are numeric, permanent and cannot be
 * edited after creation. When the owner registers new codes that point at the
 * short links, change ONLY `downloaderCode` here; every product page, the /tv
 * page and the install sections read it from this record.
 *
 * Current codes (2026-10): 2418397 opens /en/apps/moplayer, 4608937 opens
 * /en/apps/moplayer2.
 */
export type AppTvInstall = {
  productSlug: ManagedAppSlug;
  /** Numeric Downloader (AFTVnews) code. */
  downloaderCode: string;
  /** Short path served by the public site, e.g. "/mp". Always lowercase. */
  shortPath: string;
  /** Short link without scheme, for typing with a remote: "moalfarras.space/mp". */
  shortUrl: string;
};

export const tvInstallHost = "moalfarras.space";

/** The TV-first download page (no locale prefix). */
export const tvInstallPagePath = "/tv";

export const appTvInstall: Record<ManagedAppSlug, AppTvInstall> = {
  moplayer: {
    productSlug: "moplayer",
    downloaderCode: "2418397",
    shortPath: "/mp",
    shortUrl: `${tvInstallHost}/mp`,
  },
  moplayer2: {
    productSlug: "moplayer2",
    downloaderCode: "4608937",
    shortPath: "/mp2",
    shortUrl: `${tvInstallHost}/mp2`,
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
