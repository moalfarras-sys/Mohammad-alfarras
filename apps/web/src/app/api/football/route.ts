import { NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_FOOTBALL_KEY;
const API_HOST = "api-football-v1.p.rapidapi.com";

type ProviderFixture = {
  fixture: {
    id: number;
    date: string;
    timestamp?: number;
    status: { short: string; elapsed: number | null };
  };
  league: { name: string; country: string; logo: string };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

type Match = {
  id: number;
  date: string;
  status: string;
  elapsed: number | null;
  league: string;
  leagueLogo: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  priority: number;
};

const liveStatuses = new Set(["1H", "2H", "ET", "P", "LIVE", "HT", "BT"]);
const finishedStatuses = new Set(["FT", "AET", "PEN"]);

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function shiftedDate(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(base.getUTCDate() + days);
  return next;
}

function competitionPriority(leagueName: string, country: string) {
  const value = `${leagueName} ${country}`.toLowerCase();

  if (value.includes("world cup") || value.includes("fifa")) return 100;
  if (value.includes("champions league")) return 92;
  if (value.includes("europa league")) return 84;
  if (value.includes("euro")) return 80;
  if (value.includes("premier league")) return 78;
  if (value.includes("la liga")) return 76;
  if (value.includes("bundesliga")) return 74;
  if (value.includes("serie a")) return 72;
  if (value.includes("ligue 1")) return 70;
  if (value.includes("saudi")) return 58;

  return 10;
}

function statusPriority(match: Match) {
  if (liveStatuses.has(match.status)) return 1000;
  if (finishedStatuses.has(match.status)) return 700;
  if (match.status === "NS" || match.status === "TBD") return 500;
  return 100;
}

function mapFixture(f: ProviderFixture): Match {
  return {
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
    priority: competitionPriority(f.league.name, f.league.country),
  };
}

async function fetchFixtures(date: string) {
  const res = await fetch(
    `https://${API_HOST}/v3/fixtures?date=${date}&timezone=Europe/Berlin`,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY ?? "",
        "x-rapidapi-host": API_HOST,
      },
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) {
    throw new Error(`football_provider_${res.status}`);
  }

  const data = await res.json();
  return ((data.response || []) as ProviderFixture[]).map(mapFixture);
}

export async function GET() {
  const today = new Date();
  const todayLabel = formatDate(today);

  if (!RAPIDAPI_KEY) {
    return NextResponse.json({
      date: todayLabel,
      matches: [],
      source: "not_configured",
      error: "not_configured",
    });
  }

  try {
    const dates = [-2, -1, 0, 1, 2].map((offset) => formatDate(shiftedDate(today, offset)));
    const settled = await Promise.allSettled(dates.map(fetchFixtures));
    const matches = settled.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    if (matches.length === 0 && settled.every((result) => result.status === "rejected")) {
      return NextResponse.json({
        date: todayLabel,
        matches: [],
        source: "provider_error",
        error: "football_api_error",
      });
    }

    const sorted = matches
      .sort((a, b) => {
        const statusDiff = statusPriority(b) - statusPriority(a);
        if (statusDiff !== 0) return statusDiff;

        const competitionDiff = b.priority - a.priority;
        if (competitionDiff !== 0) return competitionDiff;

        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 20)
      .map((match) => ({
        id: match.id,
        date: match.date,
        status: match.status,
        elapsed: match.elapsed,
        league: match.league,
        leagueLogo: match.leagueLogo,
        homeTeam: match.homeTeam,
        homeLogo: match.homeLogo,
        awayTeam: match.awayTeam,
        awayLogo: match.awayLogo,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
      }));

    return NextResponse.json({
      date: todayLabel,
      range: { from: dates[0], to: dates[dates.length - 1] },
      matches: sorted,
      source: "api-football",
    });
  } catch {
    return NextResponse.json({
      date: todayLabel,
      matches: [],
      source: "network_error",
      error: "football_api_unavailable",
    });
  }
}
