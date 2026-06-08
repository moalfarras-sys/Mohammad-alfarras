import { NextResponse } from "next/server";

import { readAppEcosystem } from "@/lib/app-ecosystem";
import { isSmtpConfigured } from "@/lib/mailer";
import { getSupabaseEnv } from "@/lib/supabase/client";
import { readWidgetProviderSettings } from "@/lib/widget-provider-settings";
import { resolveManagedAppSlug } from "@moalfarras/shared/app-products";

type HealthCheck = {
  ok: boolean;
  detail: string;
  [key: string]: unknown;
};

const ESPN_WORLD_CUP_2026_DATES = "20260611-20260719";

function configured(value: unknown, detail = "configured"): HealthCheck {
  return value ? { ok: true, detail } : { ok: false, detail: "missing" };
}

async function checkProduct(product: "moplayer" | "moplayer2"): Promise<HealthCheck> {
  try {
    const ecosystem = await readAppEcosystem(product);
    const latest = ecosystem.releases[0] ?? null;
    const primaryAsset =
      latest?.assets?.find((asset) => asset.is_primary) ??
      latest?.assets?.find((asset) => asset.abi === "universal") ??
      latest?.assets?.[0] ??
      null;

    return {
      ok: Boolean(ecosystem.product.slug && latest?.slug && primaryAsset?.external_url),
      detail: latest?.version_name ? `release ${latest.version_name}` : "missing release",
      product: ecosystem.product.slug,
      release: latest?.slug ?? null,
      asset: primaryAsset?.abi ?? null,
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "failed" };
  }
}

async function checkWeather(): Promise<HealthCheck> {
  const settings = await readWidgetProviderSettings();
  if (!settings.weatherApiKey) return { ok: false, detail: "missing" };

  try {
    const city = settings.defaultWeatherCity || "Berlin";
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(settings.weatherApiKey)}&q=${encodeURIComponent(city)}&aqi=no`,
      { cache: "no-store" },
    );
    const data = (await response.json().catch(() => ({}))) as { current?: { temp_c?: number }; location?: { name?: string }; error?: { message?: string } };
    return {
      ok: response.ok && Boolean(data.current),
      detail: response.ok ? `${response.status}:${data.location?.name ?? city}` : `${response.status}:${data.error?.message ?? "weather_api_error"}`,
      tempC: data.current?.temp_c ?? null,
    };
  } catch {
    return { ok: false, detail: "failed" };
  }
}

async function checkFootball(): Promise<HealthCheck> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${ESPN_WORLD_CUP_2026_DATES}&limit=300`;
    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { events?: unknown[] };
    return {
      ok: response.ok && Array.isArray(data.events) && data.events.length > 0,
      detail: response.ok ? `${response.status}:espn-scoreboard` : `${response.status}:espn-scoreboard`,
      matches: Array.isArray(data.events) ? data.events.length : 0,
    };
  } catch {
    return { ok: false, detail: "failed", matches: 0 };
  }
}

async function checkYoutube(): Promise<HealthCheck> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return { ok: false, detail: "missing" };

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`,
      { cache: "no-store" },
    );
    const data = (await response.json().catch(() => ({}))) as {
      items?: Array<{ snippet?: { title?: string }; statistics?: { subscriberCount?: string; videoCount?: string } }>;
      error?: { message?: string };
    };
    const channel = data.items?.[0];
    return {
      ok: response.ok && Boolean(channel),
      detail: response.ok ? `${response.status}:${channel?.snippet?.title ?? "channel"}` : `${response.status}:${data.error?.message ?? "youtube_api_error"}`,
      subscribers: channel?.statistics?.subscriberCount ?? null,
      videos: channel?.statistics?.videoCount ?? null,
    };
  } catch {
    return { ok: false, detail: "failed" };
  }
}

export async function GET() {
  const supabase = getSupabaseEnv();
  const assistantProviders = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY),
  };

  const [weather, football, youtube, classic, pro] = await Promise.all([
    checkWeather(),
    checkFootball(),
    checkYoutube(),
    checkProduct(resolveManagedAppSlug("moplayer")),
    checkProduct(resolveManagedAppSlug("moplayer2")),
  ]);

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    checks: {
      automation: { ok: true, detail: process.env.N8N_WEBHOOK_URL ? "n8n configured" : "n8n disabled/local" },
      site_home: { ok: true, detail: "route registered" },
      page_moplayer: { ok: true, detail: "route registered" },
      page_moplayer2: { ok: true, detail: "route registered" },
      assistant: { ok: Object.values(assistantProviders).some(Boolean), detail: Object.entries(assistantProviders).filter(([, ok]) => ok).map(([name]) => name).join(",") || "local" },
      app_assistant: { ok: true, detail: "route registered" },
      app_events: configured(supabase.url && supabase.service),
      diagnostics: configured(supabase.url && supabase.service),
      supabase: configured(supabase.url && supabase.service),
      smtp: { ok: isSmtpConfigured(), detail: isSmtpConfigured() ? "configured" : "missing" },
      weather,
      football,
      youtube,
      config_moplayer: classic,
      download_moplayer: classic,
      config_moplayer2: pro,
      download_moplayer2: pro,
    },
  });
}
