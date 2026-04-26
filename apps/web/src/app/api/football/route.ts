import { NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_FOOTBALL_KEY;
const API_HOST = "api-football-v1.p.rapidapi.com";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  if (!RAPIDAPI_KEY) {
    return NextResponse.json({
      date: today,
      matches: [],
      source: "not_configured",
      error: "not_configured",
    });
  }

  try {
    const res = await fetch(
      `https://${API_HOST}/v3/fixtures?date=${today}&timezone=Europe/Berlin`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": API_HOST,
        },
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return NextResponse.json({
        date: today,
        matches: [],
        source: "provider_error",
        error: "football_api_error",
      });
    }

    const data = await res.json();
    const fixtures = (data.response || []).slice(0, 15).map(
      (f: {
        fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
        league: { name: string; country: string; logo: string };
        teams: {
          home: { name: string; logo: string };
          away: { name: string; logo: string };
        };
        goals: { home: number | null; away: number | null };
      }) => ({
        id: f.fixture.id,
        date: f.fixture.date,
        status: f.fixture.status.short,
        elapsed: f.fixture.status.elapsed,
        league: f.league.name,
        leagueLogo: f.league.logo,
        homeTeam: f.teams.home.name,
        homeLogo: f.teams.home.logo,
        awayTeam: f.teams.away.name,
        awayLogo: f.teams.away.logo,
        homeGoals: f.goals.home,
        awayGoals: f.goals.away,
      }),
    );

    return NextResponse.json({ date: today, matches: fixtures, source: "api-football" });
  } catch {
    return NextResponse.json({
      date: today,
      matches: [],
      source: "network_error",
      error: "football_api_unavailable",
    });
  }
}
