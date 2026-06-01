import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";
import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

const fallbackConfigs = {
  moplayer: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 14,
    latestVersionName: "2.2.8",
    latestVersionCode: 14,
    downloaderCode: "2418397",
    message: "",
    accentColor: "#00e5ff",
    logoUrl: "/images/moplayer-brand-logo-final.png",
    backgroundUrl: "/images/moplayer-tv-banner-final.png",
    widgets: { weather: true, football: true },
    update: {
      latestVersionName: "2.2.8",
      latestVersionCode: 14,
      downloadUrl: "/api/app/download/latest?product=moplayer",
      apkSizeBytes: 52733740,
      checksumSha256: "c661c67a33cda85d524a133da0f8213898602970057b05a9f28a7365230a80ae",
      releaseNotes:
        "MoPlayer Classic 2.2.8 polishes Android TV Live TV visuals, remote navigation, Weather Lab controls, shared city wallpapers, poster fallbacks, and old-device playback stability.",
    },
    supportUrl: "https://moalfarras.space/en/contact",
    privacyUrl: "https://moalfarras.space/privacy",
  },
  moplayer2: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 49,
    latestVersionName: "2.5.11",
    latestVersionCode: 49,
    downloaderCode: "4608937",
    appName: "MoPlayer Pro",
    packageName: "com.moalfarras.moplayerpro",
    message: "",
    accentColor: "#ff9248",
    logoUrl: "/images/moplayer-pro-hero.webp",
    backgroundUrl: "/images/moplayer-pro-home.webp",
    syncIntervalMinutes: 60,
    sourceProtocolFallback: true,
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
      latestVersionName: "2.5.11",
      latestVersionCode: 49,
      downloadUrl: "/api/app/download/latest?product=moplayer2",
      apkSizeBytes: 49252567,
      checksumSha256: "45ca5708f6e7cc6543ff0330bddb05c9ed516d2316241c2d48838ba62fe2e0c1",
      releaseNotes: "MoPlayer Pro 2.5.11 improves TV keyboard sign-in, keeps Series category selection valid during section changes, shortens unstable live-channel fallback, and was QA-tested against a real Xtream server for library sync, VOD, and episodic playback.",
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
  minimumVersionCode: 14,
  latestVersionName: "2.2.8",
  latestVersionCode: 14,
  downloaderCode: "2418397",
  message: "",
  accentColor: "#00e5ff",
  logoUrl: "/images/moplayer-brand-logo-final.png",
  backgroundUrl: "/images/moplayer-tv-banner-final.png",
  widgets: { weather: true, football: true },
  update: {
    latestVersionName: "2.2.8",
    latestVersionCode: 14,
    downloadUrl: "/api/app/download/latest?product=moplayer",
    apkSizeBytes: 52733740,
    checksumSha256: "c661c67a33cda85d524a133da0f8213898602970057b05a9f28a7365230a80ae",
    releaseNotes:
      "MoPlayer Classic 2.2.8 polishes Android TV Live TV visuals, remote navigation, Weather Lab controls, shared city wallpapers, poster fallbacks, and old-device playback stability.",
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
  const [settingsRes, ecosystem] = await Promise.all([
    supabase.from("app_settings").select("value, updated_at").eq("key", settingsKey).maybeSingle(),
    readAppEcosystem(product),
  ]);

  const { data, error } = settingsRes;
  const latestRelease = (ecosystem.releases[0] ?? null) as LatestRelease | null;

  if (error || !data) {
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
    typeof data.value === "object" && data.value ? (data.value as Record<string, unknown>) : {};
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
  const response = NextResponse.json({ source: "supabase", product, updatedAt: data.updated_at, config });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
