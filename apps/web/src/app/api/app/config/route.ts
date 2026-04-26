import { NextResponse } from "next/server";

import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";

const fallbackConfig = {
  enabled: true,
  maintenanceMode: false,
  forceUpdate: false,
  minimumVersionCode: 2,
  latestVersionName: "2.0.0",
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
  const { data, error } = await supabase
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", "moplayer_public_config")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ source: "fallback", config: fallbackConfig });
  }

  const config = { ...fallbackConfig, ...(typeof data.value === "object" && data.value ? data.value : {}) };
  if (config.backgroundUrl === "/images/moplayer-tv-banner.png") {
    config.backgroundUrl = "/images/moplayer-tv-banner-final.png";
  }
  return NextResponse.json({ source: "supabase", updatedAt: data.updated_at, config });
}
