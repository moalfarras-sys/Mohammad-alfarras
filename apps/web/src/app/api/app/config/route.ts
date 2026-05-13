import { NextResponse } from "next/server";

import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

const fallbackConfigs = {
  moplayer: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 6,
    latestVersionName: "2.2.0",
    message: "",
    accentColor: "#00e5ff",
    logoUrl: "/images/moplayer-brand-logo-final.png",
    backgroundUrl: "/images/moplayer-tv-banner-final.png",
    widgets: { weather: true, football: true },
    supportUrl: "https://moalfarras.space/en/contact",
    privacyUrl: "https://moalfarras.space/privacy",
  },
  moplayer2: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 7,
    latestVersionName: "2.1.3",
    latestVersionCode: 7,
    appName: "MoPlayer Pro",
    packageName: "com.moalfarras.moplayerpro",
    message: "",
    accentColor: "#f5c66b",
    logoUrl: "/images/moplayer-icon-512.png",
    backgroundUrl: "/images/moplayer-pro-hero.webp",
    syncIntervalMinutes: 120,
    sourceProtocolFallback: true,
    footballProviderMode: "auto",
    widgets: { weather: true, football: true, weatherCity: "Berlin", footballMaxMatches: 8 },
    update: {
      latestVersionName: "2.1.3",
      latestVersionCode: 7,
      downloadUrl: "/api/app/download/latest?product=moplayer2",
      apkSizeBytes: 49131072,
      checksumSha256: "ca10226eb6265c69fb51593584f75b42c1e30dde9843f65e0d2fa2fae12ad73c",
      releaseNotes: "Improved player stability, TV remote navigation, weather, matches, and in-app updating.",
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
  minimumVersionCode: 6,
  latestVersionName: "2.2.0",
  message: "",
  accentColor: "#00e5ff",
  logoUrl: "/images/moplayer-brand-logo-final.png",
  backgroundUrl: "/images/moplayer-tv-banner-final.png",
  widgets: { weather: true, football: true },
  supportUrl: "https://moalfarras.space/en/contact",
  privacyUrl: "https://moalfarras.space/privacy",
};

function updateFallback(config: object): Record<string, unknown> {
  return "update" in config && typeof config.update === "object" && config.update
    ? (config.update as Record<string, unknown>)
    : {};
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
  const [settingsRes, releaseRes] = await Promise.all([
    supabase.from("app_settings").select("value, updated_at").eq("key", settingsKey).maybeSingle(),
    supabase
      .from("app_releases")
      .select("version_name, version_code")
      .eq("product_slug", product)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data, error } = settingsRes;
  const latestRelease = releaseRes.data;

  if (error || !data) {
    const response = NextResponse.json({
      product,
      source: latestRelease ? "release" : "fallback",
      config: {
        ...fallbackConfig,
        ...(latestRelease
          ? {
          latestVersionName: String(latestRelease.version_name),
          latestVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          minimumVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          update: {
            ...updateFallback(fallbackConfig),
            latestVersionName: String(latestRelease.version_name),
            latestVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
            downloadUrl: `/api/app/download/latest?product=${product}`,
          },
        }
      : {}),
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
    ...(latestRelease
      ? {
          latestVersionName: String(latestRelease.version_name),
          latestVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          minimumVersionCode: Math.max(
            Number(settingsValue.minimumVersionCode ?? 0) || 0,
            Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          ),
          update: {
            ...updateFallback(fallbackConfig),
            ...(typeof settingsValue.update === "object" && settingsValue.update ? settingsValue.update : {}),
            latestVersionName: String(latestRelease.version_name),
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
