import { NextResponse } from "next/server";

import { readWidgetProviderSettings } from "@/lib/widget-provider-settings";

const DEFAULT_CITY = "Berlin";

export async function GET(request: Request) {
  const settings = await readWidgetProviderSettings();
  const apiKey = settings.weatherApiKey;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || settings.defaultWeatherCity || DEFAULT_CITY;

  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`,
      { next: { revalidate: 600 } },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "weather_api_error" }, { status: 502 });
    }

    const data = await res.json();
    const current = data.current;
    const location = data.location;

    return NextResponse.json({
      city: location.name,
      country: location.country,
      temp_c: current.temp_c,
      temp_f: current.temp_f,
      condition: current.condition.text,
      condition_code: current.condition.code,
      icon: current.condition.icon,
      humidity: current.humidity,
      wind_kph: current.wind_kph,
      wind_degree: current.wind_degree,
      gust_kph: current.gust_kph,
      precip_mm: current.precip_mm,
      cloud: current.cloud,
      feelslike_c: current.feelslike_c,
      is_day: current.is_day,
      uv: current.uv,
      localtime: location.localtime,
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
