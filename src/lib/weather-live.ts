import { headers } from "next/headers";

export type LiveWeather = {
  city: string;
  temp: number;
  condition: "Clear" | "Clouds" | "Rain" | "Thunderstorm" | "Snow" | "Drizzle" | "Mist";
  icon: string;
};

type WeatherCondition = LiveWeather["condition"];
type GeoIpResponse = {
  lat?: number;
  lon?: number;
  city?: string;
};

type OpenWeatherResponse = {
  name?: string;
  main: { temp: number };
  weather: Array<{ main: string; icon: string }>;
};

function normalizeCondition(value: string): WeatherCondition {
  if (["Clear", "Clouds", "Rain", "Thunderstorm", "Snow", "Drizzle", "Mist"].includes(value)) {
    return value as WeatherCondition;
  }
  return "Clear";
}

export async function getLiveWeather(): Promise<LiveWeather | null> {
  const API_KEY = process.env.WEATHER_API_KEY;
  if (!API_KEY) return getMockWeather();

  try {
    const headersList = await headers();
    // Vercel / Cloudflare standard IP headers
    let ip = headersList.get("x-real-ip") || headersList.get("x-forwarded-for") || "127.0.0.1";
    // Strip port if there is one appended to IP from proxies
    if (ip.includes(",")) {
       ip = ip.split(",")[0].trim();
    }
    
    // Default to Dusseldorf if local dev
    let lat = 51.2277;
    let lon = 6.7735;
    let fallbackCity = "Düsseldorf";

    // Only try to fetch GeoIP if we have a real public IP
    if (ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon,city`, { next: { revalidate: 3600 } });
        if (geoRes.ok) {
          const geo = (await geoRes.json()) as GeoIpResponse;
          if (geo && geo.lat && geo.lon) {
            lat = geo.lat;
            lon = geo.lon;
            fallbackCity = geo.city || fallbackCity;
          }
        }
      } catch (e) {
        console.warn("GeoIP fetch failed.", e);
      }
    }

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
      { next: { revalidate: 300 } } // Cache weather per region lightly
    );
    if (!res.ok) return getMockWeather();
    
    const data = (await res.json()) as OpenWeatherResponse;
    const condition = normalizeCondition(data.weather[0]?.main || "Clear");

    return {
      city: data.name || fallbackCity,
      temp: Math.round(data.main.temp),
      condition,
      icon: data.weather[0]?.icon || "01d",
    };
  } catch (error) {
    console.error("Weather fetch failed, utilizing fallback:", error);
    return getMockWeather(); // Return impressive fallback
  }
}

function getMockWeather(): LiveWeather {
  return {
    city: "Riyadh", // Beautiful mock location
    temp: 34,
    condition: "Clear",
    icon: "01d"
  };
}
