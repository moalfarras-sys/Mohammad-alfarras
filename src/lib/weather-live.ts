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

type GeoIpResponse = {
  latitude?: number;
  longitude?: number;
  city?: string;
  country_name?: string;
};

type OpenWeatherResponse = {
  name?: string;
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  weather: Array<{ main: string; icon: string }>;
  wind?: { speed?: number };
  sys?: { country?: string; sunrise?: number; sunset?: number };
  dt?: number;
};

function normalizeCondition(value: string): WeatherCondition {
  if (["Clear", "Clouds", "Rain", "Thunderstorm", "Snow", "Drizzle", "Mist"].includes(value)) {
    return value as WeatherCondition;
  }
  return "Clear";
}

function formatClock(unixSeconds: number | undefined, locale: string) {
  if (!unixSeconds) return "--:--";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(unixSeconds * 1000));
}

export async function getLiveWeather(): Promise<LiveWeather | null> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return getMockWeather();

  try {
    const headerBag = await headers();
    const forwardedIp = headerBag.get("x-forwarded-for");
    const realIp = headerBag.get("x-real-ip");
    const ip = (forwardedIp?.split(",")[0].trim() || realIp || "").trim();

    const vercelLat = Number(headerBag.get("x-vercel-ip-latitude") || "");
    const vercelLon = Number(headerBag.get("x-vercel-ip-longitude") || "");
    const vercelCity = headerBag.get("x-vercel-ip-city") || "";
    const vercelCountry = headerBag.get("x-vercel-ip-country") || "";

    let lat = Number.isFinite(vercelLat) ? vercelLat : 51.2277;
    let lon = Number.isFinite(vercelLon) ? vercelLon : 6.7735;
    let fallbackCity = vercelCity || "Düsseldorf";
    let fallbackCountry = vercelCountry || "DE";

    if ((!Number.isFinite(vercelLat) || !Number.isFinite(vercelLon)) && ip && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { next: { revalidate: 3600 } });
        if (geoRes.ok) {
          const geo = (await geoRes.json()) as GeoIpResponse;
          if (typeof geo.latitude === "number" && typeof geo.longitude === "number") {
            lat = geo.latitude;
            lon = geo.longitude;
            fallbackCity = geo.city || fallbackCity;
            fallbackCountry = geo.country_name || fallbackCountry;
          }
        }
      } catch (error) {
        console.warn("GeoIP lookup failed.", error);
      }
    }

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 300 } },
    );
    if (!weatherRes.ok) return getMockWeather();

    const data = (await weatherRes.json()) as OpenWeatherResponse;
    const condition = normalizeCondition(data.weather[0]?.main || "Clear");
    const locale = "en-GB";
    const sunrise = formatClock(data.sys?.sunrise, locale);
    const sunset = formatClock(data.sys?.sunset, locale);
    const now = data.dt ?? Math.floor(Date.now() / 1000);
    const isDay = typeof data.sys?.sunrise === "number" && typeof data.sys?.sunset === "number"
      ? now >= data.sys.sunrise && now < data.sys.sunset
      : true;

    return {
      city: data.name || fallbackCity,
      country: data.sys?.country || fallbackCountry,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: Math.round(data.main.humidity),
      wind: Number((data.wind?.speed ?? 0).toFixed(1)),
      pressure: Math.round(data.main.pressure),
      sunrise,
      sunset,
      isDay,
      condition,
      icon: data.weather[0]?.icon || "01d",
    };
  } catch (error) {
    console.error("Weather fetch failed, using fallback:", error);
    return getMockWeather();
  }
}

function getMockWeather(): LiveWeather {
  return {
    city: "Düsseldorf",
    country: "DE",
    temp: 19,
    feelsLike: 18,
    humidity: 54,
    wind: 3.8,
    pressure: 1014,
    sunrise: "06:34",
    sunset: "20:16",
    isDay: true,
    condition: "Clear",
    icon: "01d",
  };
}
