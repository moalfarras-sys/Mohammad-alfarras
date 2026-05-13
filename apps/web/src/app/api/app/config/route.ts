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
    minimumVersionCode: 4,
    latestVersionName: "2.1.0",
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
              minimumVersionCode: Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
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
          minimumVersionCode: Math.max(
            Number(settingsValue.minimumVersionCode ?? 0) || 0,
            Number(latestRelease.version_code) || fallbackConfig.minimumVersionCode,
          ),
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
