import { headers } from "next/headers";

export type LiveWeather = {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  pressure: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
  condition: "Clear" | "Clouds" | "Rain" | "Thunderstorm" | "Snow" | "Drizzle" | "Mist";
  icon: string;
};

type WeatherCondition = LiveWeather["condition"];

type WeatherApiResponse = {
  location?: { name?: string; country?: string; localtime_epoch?: number };
  current?: {
    temp_c?: number;
    feelslike_c?: number;
    humidity?: number;
    wind_kph?: number;
    pressure_mb?: number;
    is_day?: number;
    condition?: { text?: string; code?: number };
  };
  forecast?: {
    forecastday?: Array<{
      astro?: { sunrise?: string; sunset?: string };
    }>;
  };
};

function mapCondition(text: string | undefined, code: number | undefined): WeatherCondition {
  if (!text && !code) return "Clear";
  const t = (text ?? "").toLowerCase();
  if (code === 1000 || t.includes("sunny") || t.includes("clear")) return "Clear";
  if (t.includes("thunder") || t.includes("storm")) return "Thunderstorm";
  if (t.includes("snow") || t.includes("blizzard") || t.includes("sleet") || t.includes("ice")) return "Snow";
  if (t.includes("drizzle")) return "Drizzle";
  if (t.includes("rain") || t.includes("shower")) return "Rain";
  if (t.includes("fog") || t.includes("mist") || t.includes("haze")) return "Mist";
  if (t.includes("cloud") || t.includes("overcast") || t.includes("partly")) return "Clouds";
  return "Clear";
}

export async function getLiveWeather(): Promise<LiveWeather | null> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return getMockWeather();

  try {
    const headerBag = await headers();

    const vercelCity = headerBag.get("x-vercel-ip-city") || "";
    const vercelCountry = headerBag.get("x-vercel-ip-country") || "";
    const vercelLat = headerBag.get("x-vercel-ip-latitude") || "";
    const vercelLon = headerBag.get("x-vercel-ip-longitude") || "";
    const forwardedIp = headerBag.get("x-forwarded-for")?.split(",")[0].trim() || "";
    const realIp = headerBag.get("x-real-ip") || "";

    let query = "Bremen";
    if (vercelLat && vercelLon) {
      query = `${vercelLat},${vercelLon}`;
    } else if (vercelCity) {
      query = vercelCity;
    } else if (forwardedIp && forwardedIp !== "127.0.0.1" && forwardedIp !== "::1") {
      query = forwardedIp;
    } else if (realIp && realIp !== "127.0.0.1" && realIp !== "::1") {
      query = realIp;
    }

    const url = new URL("https://api.weatherapi.com/v1/forecast.json");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("days", "1");
    url.searchParams.set("aqi", "no");

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      console.warn(`WeatherAPI returned ${res.status}`);
      return getMockWeather();
    }

    const data = (await res.json()) as WeatherApiResponse;
    if (!data.location || !data.current) return getMockWeather();

    const condition = mapCondition(data.current.condition?.text, data.current.condition?.code);
    const astro = data.forecast?.forecastday?.[0]?.astro;

    return {
      city: data.location.name || vercelCity || "Bremen",
      country: data.location.country || vercelCountry || "Germany",
      temp: Math.round(data.current.temp_c ?? 0),
      feelsLike: Math.round(data.current.feelslike_c ?? 0),
      humidity: Math.round(data.current.humidity ?? 0),
      wind: Number(((data.current.wind_kph ?? 0) / 3.6).toFixed(1)),
      pressure: Math.round(data.current.pressure_mb ?? 0),
      sunrise: astro?.sunrise ?? "06:00",
      sunset: astro?.sunset ?? "20:00",
      isDay: data.current.is_day === 1,
      condition,
      icon: condition === "Clear" ? "01d" : "02d",
    };
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return getMockWeather();
  }
}

function getMockWeather(): LiveWeather {
  const hour = new Date().getHours();
  return {
    city: "Bremen",
    country: "Germany",
    temp: 17,
    feelsLike: 15,
    humidity: 62,
    wind: 3.2,
    pressure: 1016,
    sunrise: "06:28",
    sunset: "20:22",
    isDay: hour >= 6 && hour < 20,
    condition: "Clouds",
    icon: "02d",
  };
}
