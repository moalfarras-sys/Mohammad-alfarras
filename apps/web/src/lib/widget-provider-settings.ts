import { createSupabaseAdminClient } from "@/lib/supabase/client";

const WIDGET_PROVIDER_SETTINGS_KEY = "moplayer_widget_provider_settings";

export type WidgetProviderSettings = {
  weatherApiKey?: string;
  sportmonksToken?: string;
  apiFootballKey?: string;
  rapidApiFootballKey?: string;
  defaultWeatherCity: string;
  sportmonksResultsRoundId?: string;
  footballLeagueIds: number[];
  footballMaxMatches: number;
  footballMinPriority: number;
};

const fallbackSettings: WidgetProviderSettings = {
  weatherApiKey: process.env.WEATHER_API_KEY,
  sportmonksToken: process.env.SPORTMONKS_TOKEN,
  apiFootballKey: process.env.API_FOOTBALL_KEY,
  rapidApiFootballKey: process.env.RAPIDAPI_FOOTBALL_KEY,
  defaultWeatherCity: "Berlin",
  sportmonksResultsRoundId: process.env.SPORTMONKS_RESULTS_ROUND_ID,
  footballLeagueIds: [39, 140, 135, 78, 61],
  footballMaxMatches: 8,
  footballMinPriority: 70,
};

function parseLeagueIds(value: unknown): number[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\s]+/) : [];
  const parsed = raw.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
  return parsed.length ? parsed : fallbackSettings.footballLeagueIds;
}

export async function readWidgetProviderSettings(): Promise<WidgetProviderSettings> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", WIDGET_PROVIDER_SETTINGS_KEY)
      .maybeSingle();
    if (error) throw error;
    const value = data?.value && typeof data.value === "object" ? (data.value as Record<string, unknown>) : {};
    return {
      weatherApiKey: String(value.weatherApiKey ?? fallbackSettings.weatherApiKey ?? "").trim() || undefined,
      sportmonksToken: String(value.sportmonksToken ?? fallbackSettings.sportmonksToken ?? "").trim() || undefined,
      apiFootballKey: String(value.apiFootballKey ?? fallbackSettings.apiFootballKey ?? "").trim() || undefined,
      rapidApiFootballKey: String(value.rapidApiFootballKey ?? fallbackSettings.rapidApiFootballKey ?? "").trim() || undefined,
      defaultWeatherCity: String(value.defaultWeatherCity ?? fallbackSettings.defaultWeatherCity).trim() || fallbackSettings.defaultWeatherCity,
      sportmonksResultsRoundId: String(value.sportmonksResultsRoundId ?? fallbackSettings.sportmonksResultsRoundId ?? "").trim() || undefined,
      footballLeagueIds: parseLeagueIds(value.footballLeagueIds),
      footballMaxMatches: Math.min(20, Math.max(1, Number(value.footballMaxMatches ?? fallbackSettings.footballMaxMatches) || fallbackSettings.footballMaxMatches)),
      footballMinPriority: Math.min(100, Math.max(0, Number(value.footballMinPriority ?? fallbackSettings.footballMinPriority) || fallbackSettings.footballMinPriority)),
    };
  } catch {
    return fallbackSettings;
  }
}
