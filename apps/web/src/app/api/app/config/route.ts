import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";
import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

const fallbackConfigs = {
  moplayer: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 18,
    latestVersionName: "2.2.16",
    latestVersionCode: 22,
    downloaderCode: "2418397",
    message: "",
    accentColor: "#00e5ff",
    logoUrl: "/images/moplayer-brand-logo-final.png",
    backgroundUrl: "/images/moplayer-tv-banner-final.png",
    widgets: { weather: true, football: true },
    update: {
      latestVersionName: "2.2.16",
      latestVersionCode: 22,
      downloadUrl: "/api/app/download/latest?product=moplayer",
      apkSizeBytes: 52790603,
      checksumSha256: "5e51b5e9e6ed7c46d172f3f97a5bf3201b41cefd7e27fdd59f3ef4e3b899f895",
      releaseNotes:
        "MoPlayer Classic 2.2.16 keeps the 2.2.15 speed and football-data fixes, removes the duplicate Home watch-history row, and keeps only the working Continue watching row with resume progress.",
    },
    supportUrl: "https://moalfarras.space/en/contact",
    privacyUrl: "https://moalfarras.space/privacy",
  },
  moplayer2: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 50,
    latestVersionName: "2.5.24",
    latestVersionCode: 62,
    downloaderCode: "4608937",
    appName: "MoPlayer Pro",
    packageName: "com.moalfarras.moplayerpro",
    message: "",
    accentColor: "#ff9248",
    logoUrl: "/images/moplayer-pro-hero.webp",
    backgroundUrl: "/images/moplayer-pro-home.webp",
    syncIntervalMinutes: 60,
    sourceProtocolFallback: true,
    trailerPreviewEnabled: true,
    footballProviderMode: "auto",
    footballLeagueIds: [39, 140, 135, 78, 61, 2, 3, 848, 1, 15],
    footballLeagueKeywords: ["world cup", "fifa", "champions league", "europa", "premier", "la liga", "serie a", "bundesliga", "ligue 1"],
    footballNewsMessage: "",
    allowFootballFallback: false,
    allowWeatherFallback: false,
    homeNotification: {
      mode: "auto",
      type: "world_cup_2026",
      title: "World Cup 2026 is coming",
      message: "MoPlayer Pro is ready for live football nights, match widgets, and cinematic TV browsing.",
      startDate: "2026-06-11",
      ctaLabel: "Open football hub",
      ctaUrl: "/football",
    },
    campaignWidgets: {
      worldCup: true,
      liveSports: true,
      announcement: true,
      promoTitle: "MoPlayer Pro live season",
      promoMessage: "Weather, football, posters, and premium TV surfaces are controlled from Admin.",
      promoUrl: "https://moalfarras.space/en/apps/moplayer2",
    },
    widgets: { weather: true, football: true, weatherCity: "Berlin", footballMaxMatches: 8 },
    update: {
      latestVersionName: "2.5.24",
      latestVersionCode: 62,
      downloadUrl: "/api/app/download/latest?product=moplayer2",
      apkSizeBytes: 49276472,
      checksumSha256: "3f63482fcb021c8fc6c9eb9ff79e02b43b75fe71932e8958eaf1f7a91bf8dd67",
      releaseNotes:
        "MoPlayer Pro 2.5.24 fixes cold-start M3U link imports, Android 6 Xtream JSON sync, and old-TV HTTPS playback. It keeps the 2.5.23 Xtream/M3U/QR source loading, URL normalization, smart first-run loading, and VOD detail refresh improvements.",
    },
    ios: {
      enabled: true,
      status: "coming_soon",
      storeUrl: "/en/apps/moplayer-ios#app-store-coming-soon",
      activationUrl: "/en/activate?product=moplayer2&platform=ios",
      buttonLabel: "App Store soon",
      heroImageUrl: "/images/moplayer-pro-home.webp",
      note: "Temporary public page link until the App Store listing is live.",
    },
    weatherBackgroundMode: "city_daily",
    weatherBackgroundUrl: "",
    supportUrl: "https://moalfarras.space/en/support",
    privacyUrl: "https://moalfarras.space/privacy",
  },
} as const;

const legacyFallbackConfig = {
  enabled: true,
  maintenanceMode: false,
  forceUpdate: false,
  minimumVersionCode: 18,
  latestVersionName: "2.2.16",
  latestVersionCode: 22,
  downloaderCode: "2418397",
  message: "",
  accentColor: "#00e5ff",
  logoUrl: "/images/moplayer-brand-logo-final.png",
  backgroundUrl: "/images/moplayer-tv-banner-final.png",
  widgets: { weather: true, football: true },
  update: {
    latestVersionName: "2.2.16",
    latestVersionCode: 22,
    downloadUrl: "/api/app/download/latest?product=moplayer",
    apkSizeBytes: 52790603,
    checksumSha256: "5e51b5e9e6ed7c46d172f3f97a5bf3201b41cefd7e27fdd59f3ef4e3b899f895",
    releaseNotes:
      "MoPlayer Classic 2.2.16 keeps the 2.2.15 speed and football-data fixes, removes the duplicate Home watch-history row, and keeps only the working Continue watching row with resume progress.",
  },
  supportUrl: "https://moalfarras.space/en/contact",
  privacyUrl: "https://moalfarras.space/privacy",
};

function updateFallback(config: object): Record<string, unknown> {
  return "update" in config && typeof config.update === "object" && config.update
    ? (config.update as Record<string, unknown>)
    : {};
}

type LatestRelease = {
  slug?: string | null;
  version_name?: string | null;
  version_code?: number | string | null;
  release_notes?: string | null;
  assets?: Array<{
    abi?: string | null;
    external_url?: string | null;
    file_size_bytes?: number | string | null;
    checksum_sha256?: string | null;
    is_primary?: boolean | null;
  }> | null;
};

function releaseUpdate(product: string, fallbackConfig: object, latestRelease: LatestRelease | null): Record<string, unknown> {
  if (!latestRelease) return {};
  const versionCode = Number(latestRelease.version_code) || Number((fallbackConfig as { minimumVersionCode?: number }).minimumVersionCode) || 0;
  const primaryAsset =
    latestRelease.assets?.find((asset) => asset.is_primary) ??
    latestRelease.assets?.find((asset) => asset.abi === "universal") ??
    latestRelease.assets?.[0];
  return {
    latestVersionName: String(latestRelease.version_name ?? ""),
    latestVersionCode: versionCode,
    minimumVersionCode: versionCode,
    update: {
      ...updateFallback(fallbackConfig),
      latestVersionName: String(latestRelease.version_name ?? ""),
      latestVersionCode: versionCode,
      downloadUrl: `/api/app/download/latest?product=${product}`,
      apkSizeBytes: primaryAsset?.file_size_bytes ? Number(primaryAsset.file_size_bytes) : undefined,
      checksumSha256: primaryAsset?.checksum_sha256 ?? undefined,
      releaseNotes: latestRelease.release_notes ?? undefined,
    },
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const product = resolveManagedAppSlug(params.get("app") ?? params.get("product"));
  const settingsKey = `${product}_public_config`;
  const fallbackConfig = fallbackConfigs[product] ?? legacyFallbackConfig;

  if (!hasSupabasePublicEnv()) {
    const response = NextResponse.json({ source: "fallback", product, config: fallbackConfig });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const supabase = createSupabaseDataClient();
  const [settingsRes, legacySettingsRes, ecosystem] = await Promise.all([
    supabase.from("app_settings").select("value, updated_at").eq("key", settingsKey).maybeSingle(),
    supabase.from("site_settings").select("value_json").eq("key", settingsKey).maybeSingle(),
    readAppEcosystem(product),
  ]);

  const { data, error } = settingsRes;
  const legacyData = legacySettingsRes.error ? null : legacySettingsRes.data;
  const settingsRecord = data?.value ? { value: data.value, updatedAt: data.updated_at, source: "supabase" } : legacyData?.value_json ? { value: legacyData.value_json, updatedAt: null, source: "legacy-site-settings" } : null;
  const latestRelease = (ecosystem.releases[0] ?? null) as LatestRelease | null;

  if ((error && !legacyData) || !settingsRecord) {
    const response = NextResponse.json({
      product,
      source: latestRelease ? "release" : "fallback",
      config: {
        ...fallbackConfig,
        ...releaseUpdate(product, fallbackConfig, latestRelease),
      },
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const settingsValue =
    typeof settingsRecord.value === "object" && settingsRecord.value ? (settingsRecord.value as Record<string, unknown>) : {};
  const config: Record<string, unknown> = {
    ...fallbackConfig,
    ...settingsValue,
    ...releaseUpdate(product, fallbackConfig, latestRelease),
    ...(latestRelease
      ? {
          latestVersionName: String(latestRelease.version_name ?? ""),
          latestVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          minimumVersionCode: Math.max(
            Number(settingsValue.minimumVersionCode ?? 0) || 0,
            Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          ),
          update: {
            ...updateFallback(fallbackConfig),
            ...(typeof settingsValue.update === "object" && settingsValue.update ? settingsValue.update : {}),
            ...(releaseUpdate(product, fallbackConfig, latestRelease).update as Record<string, unknown>),
            latestVersionName: String(latestRelease.version_name ?? ""),
            latestVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
            downloadUrl: `/api/app/download/latest?product=${product}`,
          },
        }
      : {}),
  };
  if (String(config.backgroundUrl ?? "") === "/images/moplayer-tv-banner.png") {
    config.backgroundUrl = "/images/moplayer-tv-banner-final.png";
  }
  const response = NextResponse.json({ source: settingsRecord.source, product, updatedAt: settingsRecord.updatedAt, config });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
