import { NextResponse } from "next/server";

import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

const fallbackConfigs = {
  moplayer: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 9,
    latestVersionName: "2.2.3",
    latestVersionCode: 9,
    downloaderCode: "2418397",
    message: "",
    accentColor: "#00e5ff",
    logoUrl: "/images/moplayer-brand-logo-final.png",
    backgroundUrl: "/images/moplayer-tv-banner-final.png",
    widgets: { weather: true, football: true },
    update: {
      latestVersionName: "2.2.3",
      latestVersionCode: 9,
      downloadUrl: "/api/app/download/latest?product=moplayer",
      apkSizeBytes: 52344371,
      checksumSha256: "f5810e2c9cb08e8cc6a01e1459e5d6ed224f759475fd05294b3f7772e48ec86a",
      releaseNotes:
        "MoPlayer Classic 2.2.3 publishes the latest universal Android TV APK with the current admin-controlled update flow and stable Classic download channel.",
    },
    supportUrl: "https://moalfarras.space/en/contact",
    privacyUrl: "https://moalfarras.space/privacy",
  },
  moplayer2: {
    enabled: true,
    maintenanceMode: false,
    forceUpdate: false,
    minimumVersionCode: 10,
    latestVersionName: "2.2.7",
    latestVersionCode: 15,
    downloaderCode: "4608937",
    appName: "MoPlayer Pro",
    packageName: "com.moalfarras.moplayerpro",
    message: "",
    accentColor: "#f5c66b",
    logoUrl: "/images/moplayer-icon-512.png",
    backgroundUrl: "/images/moplayer-pro-hero.webp",
    syncIntervalMinutes: 120,
    sourceProtocolFallback: true,
    footballProviderMode: "auto",
    footballLeagueIds: [39, 140, 135, 78, 61, 2, 3, 848, 1, 15],
    footballLeagueKeywords: ["world cup", "fifa", "champions league", "europa", "premier", "la liga", "serie a", "bundesliga", "ligue 1"],
    footballNewsMessage: "",
    allowFootballFallback: false,
    allowWeatherFallback: false,
    widgets: { weather: true, football: true, weatherCity: "Berlin", footballMaxMatches: 8 },
    update: {
      latestVersionName: "2.2.7",
      latestVersionCode: 15,
      downloadUrl: "https://ckefrnalgnbuaxsuufyx.supabase.co/storage/v1/object/public/app-releases/moplayer2/2.2.7/moplayer2-2.2.7-universal.apk",
      apkSizeBytes: 49175687,
      checksumSha256: "20615c00e1a9ad907329fb9c20147f6248d5b9bf60a356a20cd4d9f598ee12f1",
      releaseNotes: "MoPlayer Pro 2.2.7 strengthens Live playback with smarter Media3/VLC auto-routing, starts MPEG-TS/TS live streams on the more compatible internal VLC engine, and lets Stable mode switch live playback to the VLC path without reinstalling.",
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
  minimumVersionCode: 9,
  latestVersionName: "2.2.3",
  latestVersionCode: 9,
  downloaderCode: "2418397",
  message: "",
  accentColor: "#00e5ff",
  logoUrl: "/images/moplayer-brand-logo-final.png",
  backgroundUrl: "/images/moplayer-tv-banner-final.png",
  widgets: { weather: true, football: true },
  update: {
    latestVersionName: "2.2.3",
    latestVersionCode: 9,
    downloadUrl: "/api/app/download/latest?product=moplayer",
    apkSizeBytes: 52344371,
    checksumSha256: "f5810e2c9cb08e8cc6a01e1459e5d6ed224f759475fd05294b3f7772e48ec86a",
    releaseNotes:
      "MoPlayer Classic 2.2.3 publishes the latest universal Android TV APK with the current admin-controlled update flow and stable Classic download channel.",
  },
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
