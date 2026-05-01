import { NextResponse } from "next/server";

import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

const fallbackConfig = {
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

export async function GET() {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ source: "fallback", config: fallbackConfig });
  }

  const supabase = createSupabaseDataClient();
  const [settingsRes, releaseRes] = await Promise.all([
    supabase.from("app_settings").select("value, updated_at").eq("key", "moplayer_public_config").maybeSingle(),
    supabase
      .from("app_releases")
      .select("version_name, version_code")
      .eq("product_slug", "moplayer")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data, error } = settingsRes;
  const latestRelease = releaseRes.data;

  if (error || !data) {
    return NextResponse.json({
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
  }

  const settingsValue =
    typeof data.value === "object" && data.value ? (data.value as Record<string, unknown>) : {};
  const config = {
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
  if (config.backgroundUrl === "/images/moplayer-tv-banner.png") {
    config.backgroundUrl = "/images/moplayer-tv-banner-final.png";
  }
  return NextResponse.json({ source: "supabase", updatedAt: data.updated_at, config });
}
