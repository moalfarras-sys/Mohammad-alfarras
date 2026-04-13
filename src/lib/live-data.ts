type WeatherPulse = {
  city: string;
  tempC: number;
  condition: string;
  feelsLikeC: number;
  windKph: number;
  localTime: string;
};

type MatchPulse = {
  league: string;
  home: string;
  away: string;
  startsAt: string;
  status: string;
  venue: string;
};

function currentBundesligaSeason() {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  return month >= 7 ? year : year - 1;
}

export async function readWeatherPulse(): Promise<WeatherPulse | null> {
  const key = process.env.WEATHER_API_KEY;
  if (!key) return null;

  try {
    const url = new URL("https://api.weatherapi.com/v1/current.json");
    url.searchParams.set("key", key);
    url.searchParams.set("q", "Berlin");
    url.searchParams.set("aqi", "no");

    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      location?: { name?: string; localtime?: string };
      current?: { temp_c?: number; feelslike_c?: number; wind_kph?: number; condition?: { text?: string } };
    };

    if (!json.location || !json.current) return null;

    return {
      city: json.location.name ?? "Berlin",
      tempC: Number(json.current.temp_c ?? 0),
      condition: json.current.condition?.text ?? "Clear",
      feelsLikeC: Number(json.current.feelslike_c ?? 0),
      windKph: Number(json.current.wind_kph ?? 0),
      localTime: json.location.localtime ?? "",
    };
  } catch {
    return null;
  }
}

export async function readSportsPulse(): Promise<MatchPulse[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return [];

  try {
    const url = new URL("https://v3.football.api-sports.io/fixtures");
    url.searchParams.set("league", "78");
    url.searchParams.set("season", String(currentBundesligaSeason()));
    url.searchParams.set("next", "3");
    url.searchParams.set("timezone", "Europe/Berlin");

    const response = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": key,
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) return [];

    const json = (await response.json()) as {
      response?: Array<{
        league?: { name?: string };
        teams?: { home?: { name?: string }; away?: { name?: string } };
        fixture?: { date?: string; venue?: { name?: string }; status?: { short?: string; long?: string } };
      }>;
    };

    return (json.response ?? []).map((item) => ({
      league: item.league?.name ?? "Bundesliga",
      home: item.teams?.home?.name ?? "Home",
      away: item.teams?.away?.name ?? "Away",
      startsAt: item.fixture?.date ?? "",
      status: item.fixture?.status?.long ?? item.fixture?.status?.short ?? "Scheduled",
      venue: item.fixture?.venue?.name ?? "",
    }));
  } catch {
    return [];
  }
}
