import { NextResponse } from "next/server";

const API_KEY = process.env.WEATHER_API_KEY;
const DEFAULT_CITY = "Berlin";

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || DEFAULT_CITY;

  try {
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=no`,
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
      icon: current.condition.icon,
      humidity: current.humidity,
      wind_kph: current.wind_kph,
      feelslike_c: current.feelslike_c,
      is_day: current.is_day,
      uv: current.uv,
      localtime: location.localtime,
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
