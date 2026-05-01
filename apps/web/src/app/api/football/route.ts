import { NextResponse } from "next/server";

const SPORTMONKS_TOKEN = process.env.SPORTMONKS_TOKEN;
const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";
const SPORTMONKS_RESULTS_ROUND_ID = process.env.SPORTMONKS_RESULTS_ROUND_ID;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_FOOTBALL_KEY;
const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const TOP_LEAGUE_IDS = [39, 140, 135, 78, 61];

type SportMonksParticipant = {
  id: number;
  name: string;
  image_path?: string;
  meta?: { location?: "home" | "away" };
};

type SportMonksScore = {
  participant_id: number;
  description?: string;
  score?: { goals?: number };
};

type SportMonksPeriod = {
  minutes?: number;
  time_added?: number;
  description?: string;
};

type SportMonksFixture = {
  id: number;
  name: string;
  starting_at: string;
  participants?: SportMonksParticipant[];
  league?: { name?: string; image_path?: string; country?: { name?: string } };
  scores?: SportMonksScore[];
  periods?: SportMonksPeriod[];
  result_info?: string | null;
  state_id?: number;
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

type PublicMatch = Omit<Match, "priority">;

function stripPriority(match: Match): PublicMatch {
  const { priority: internalPriority, ...publicMatch } = match;
  void internalPriority;
  return publicMatch;
}

type ApiFootballFixture = {
  fixture?: {
    id?: number;
    date?: string;
    status?: { short?: string; elapsed?: number | null };
  };
  league?: { id?: number; name?: string; logo?: string };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

function competitionPriority(leagueName: string, leagueId?: number) {
  if (leagueId === 1 || leagueId === 15) return 100;
  if (leagueId === 2) return 94;
  if (leagueId === 3) return 86;
  if (leagueId === 848) return 82;
  if (leagueId === 39) return 78;
  if (leagueId === 140) return 76;
  if (leagueId === 78) return 74;
  if (leagueId === 135) return 72;
  if (leagueId === 61) return 70;
  if (leagueId !== undefined) return 10;
  const value = leagueName.toLowerCase();
  if (value.includes("world cup") || value.includes("fifa")) return 100;
  if (value.includes("champions league")) return 92;
  if (value.includes("europa")) return 84;
  if (value.includes("la liga")) return 76;
  if (value.includes("bundesliga")) return 74;
  if (value.includes("serie a")) return 72;
  if (value.includes("ligue 1")) return 70;
  return 10;
}

function getParticipant(participants: SportMonksParticipant[] | undefined, location: "home" | "away") {
  return participants?.find((participant) => participant.meta?.location === location);
}

function getCurrentGoals(scores: SportMonksScore[] | undefined, participantId?: number) {
  if (!participantId) return null;
  return (
    scores?.find(
      (score) => score.participant_id === participantId && score.description?.toUpperCase() === "CURRENT",
    )?.score?.goals ?? null
  );
}

function inferStatus(fixture: SportMonksFixture) {
  if ((fixture.periods?.length ?? 0) > 0) {
    return "LIVE";
  }
  if (fixture.result_info) {
    return "FT";
  }
  return "NS";
}

function inferElapsed(fixture: SportMonksFixture) {
  const latestPeriod = fixture.periods?.[fixture.periods.length - 1];
  if (!latestPeriod) return null;
  const minutes = latestPeriod.minutes ?? 0;
  const added = latestPeriod.time_added ?? 0;
  return minutes + added;
}

function mapFixture(fixture: SportMonksFixture): Match {
  const home = getParticipant(fixture.participants, "home");
  const away = getParticipant(fixture.participants, "away");
  const leagueName = fixture.league?.name ?? "Football";

  return {
    id: fixture.id,
    date: fixture.starting_at,
    status: inferStatus(fixture),
    elapsed: inferElapsed(fixture),
    league: leagueName,
    leagueLogo: fixture.league?.image_path ?? "",
    homeTeam: home?.name ?? "Home",
    homeLogo: home?.image_path ?? "",
    awayTeam: away?.name ?? "Away",
    awayLogo: away?.image_path ?? "",
    homeGoals: getCurrentGoals(fixture.scores, home?.id),
    awayGoals: getCurrentGoals(fixture.scores, away?.id),
    priority: competitionPriority(leagueName),
  };
}

function mapApiFootballFixture(item: ApiFootballFixture): Match {
  const leagueName = item.league?.name ?? "Football";
  return {
    id: item.fixture?.id ?? Math.floor(Math.random() * 1_000_000_000),
    date: item.fixture?.date ?? new Date().toISOString(),
    status: item.fixture?.status?.short ?? "NS",
    elapsed: item.fixture?.status?.elapsed ?? null,
    league: leagueName,
    leagueLogo: item.league?.logo ?? "",
    homeTeam: item.teams?.home?.name ?? "Home",
    homeLogo: item.teams?.home?.logo ?? "",
    awayTeam: item.teams?.away?.name ?? "Away",
    awayLogo: item.teams?.away?.logo ?? "",
    homeGoals: item.goals?.home ?? null,
    awayGoals: item.goals?.away ?? null,
    priority: competitionPriority(leagueName, item.league?.id),
  };
}

function fallbackFeaturedMatches() {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const matches = [
    {
      id: 900001,
      date: yesterday,
      status: "FT",
      elapsed: null,
      league: "La Liga",
      leagueLogo: "https://media.api-sports.io/football/leagues/140.png",
      homeTeam: "Villarreal",
      homeLogo: "https://media.api-sports.io/football/teams/533.png",
      awayTeam: "Celta de Vigo",
      awayLogo: "https://media.api-sports.io/football/teams/538.png",
      homeGoals: 2,
      awayGoals: 1,
    },
    {
      id: 900002,
      date: now,
      status: "FT",
      elapsed: null,
      league: "Premier League",
      leagueLogo: "https://media.api-sports.io/football/leagues/39.png",
      homeTeam: "Arsenal",
      homeLogo: "https://media.api-sports.io/football/teams/42.png",
      awayTeam: "Liverpool",
      awayLogo: "https://media.api-sports.io/football/teams/40.png",
      homeGoals: 1,
      awayGoals: 1,
    },
    {
      id: 900003,
      date: tomorrow,
      status: "NS",
      elapsed: null,
      league: "Bundesliga",
      leagueLogo: "https://media.api-sports.io/football/leagues/78.png",
      homeTeam: "Bayern Munich",
      homeLogo: "https://media.api-sports.io/football/teams/157.png",
      awayTeam: "Borussia Dortmund",
      awayLogo: "https://media.api-sports.io/football/teams/165.png",
      homeGoals: null,
      awayGoals: null,
    },
  ];

  return {
    primaryMatch: matches[0],
    matches,
    previousDay: matches.filter((match) => match.date === yesterday),
    today: matches.filter((match) => match.date === now),
    nextDay: matches.filter((match) => match.date === tomorrow),
    importantMatches: matches,
    recentResults: matches.filter((match) => match.status === "FT"),
    upcomingFixtures: matches.filter((match) => match.status === "NS"),
    source: "curated_fallback",
    mode: "results_upcoming",
    warning: "football_provider_returned_empty",
  };
}

async function fetchSportMonks(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${SPORTMONKS_BASE_URL}${path}${separator}api_token=${SPORTMONKS_TOKEN}`, {
    next: { revalidate: 90 },
  });

  if (!response.ok) {
    throw new Error(`sportmonks_${response.status}`);
  }

  return response.json();
}

async function fetchApiFootball(path: string) {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: { "x-apisports-key": API_FOOTBALL_KEY ?? "" },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`api_football_${response.status}`);
  }

  return response.json();
}

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function apiFootballSeason() {
  const now = new Date();
  const year = now.getUTCFullYear();
  return now.getUTCMonth() >= 6 ? year : year - 1;
}

async function getApiFootballMatches() {
  if (!API_FOOTBALL_KEY) return null;

  const livePayload = await fetchApiFootball("/fixtures?live=all");
  const liveMatches = ((livePayload.response ?? []) as ApiFootballFixture[])
    .map(mapApiFootballFixture)
    .filter((match) => match.priority >= 70);

  const [previousPayload, todayPayload, nextPayload] = await Promise.all([
    fetchApiFootball(`/fixtures?date=${isoDate(-1)}`),
    fetchApiFootball(`/fixtures?date=${isoDate(0)}`),
    fetchApiFootball(`/fixtures?date=${isoDate(1)}`),
  ]);

  const previousDay = ((previousPayload.response ?? []) as ApiFootballFixture[])
    .map(mapApiFootballFixture)
    .filter((match) => match.priority >= 70)
    .sort((a, b) => b.priority - a.priority || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const today = ((todayPayload.response ?? []) as ApiFootballFixture[])
    .map(mapApiFootballFixture)
    .filter((match) => match.priority >= 70)
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 12);

  const nextDay = ((nextPayload.response ?? []) as ApiFootballFixture[])
    .map(mapApiFootballFixture)
    .filter((match) => match.priority >= 70)
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  let recentResults = [...previousDay, ...today]
    .filter((match) => match.homeGoals !== null && match.awayGoals !== null)
    .sort((a, b) => b.priority - a.priority || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  let upcomingFixtures = [...today, ...nextDay]
    .filter((match) => match.homeGoals === null || match.awayGoals === null)
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  if (liveMatches.length === 0 && recentResults.length === 0 && upcomingFixtures.length === 0) {
    const season = apiFootballSeason();
    const leaguePayloads = await Promise.allSettled(
      TOP_LEAGUE_IDS.flatMap((leagueId) => [
        fetchApiFootball(`/fixtures?league=${leagueId}&season=${season}&last=3`),
        fetchApiFootball(`/fixtures?league=${leagueId}&season=${season}&next=3`),
      ]),
    );
    const leagueFixtures = leaguePayloads.flatMap((result) =>
      result.status === "fulfilled" ? ((result.value.response ?? []) as ApiFootballFixture[]) : [],
    );
    const mapped = leagueFixtures.map(mapApiFootballFixture);
    recentResults = mapped
      .filter((match) => match.homeGoals !== null && match.awayGoals !== null)
      .sort((a, b) => b.priority - a.priority || new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
    upcomingFixtures = mapped
      .filter((match) => match.homeGoals === null || match.awayGoals === null)
      .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }

  const matches = (liveMatches.length > 0 ? liveMatches : [...recentResults, ...upcomingFixtures])
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 20)
    .map(stripPriority);

  if (matches.length === 0) {
    return fallbackFeaturedMatches();
  }

  const importantMatches = (liveMatches.length > 0 ? liveMatches : [...previousDay, ...today, ...nextDay, ...recentResults, ...upcomingFixtures])
    .sort((a, b) => b.priority - a.priority || Math.abs(new Date(a.date).getTime() - Date.now()) - Math.abs(new Date(b.date).getTime() - Date.now()))
    .slice(0, 16)
    .map(stripPriority);

  return {
    primaryMatch: matches[0] ?? null,
    matches,
    previousDay: previousDay.map(stripPriority),
    today: today.map(stripPriority),
    nextDay: nextDay.map(stripPriority),
    importantMatches,
    recentResults: recentResults.map(stripPriority),
    upcomingFixtures: upcomingFixtures.map(stripPriority),
    source: "api-football",
    mode: liveMatches.length > 0 ? "live" : "results_upcoming",
  };
}

export async function GET() {
  if (!SPORTMONKS_TOKEN) {
    try {
      const fallback = await getApiFootballMatches();
      if (fallback) return NextResponse.json(fallback);
    } catch {
      // Fall through to a clear empty state below.
    }
    return NextResponse.json({
      primaryMatch: null,
      matches: [],
      recentResults: [],
      upcomingFixtures: [],
      source: "not_configured",
      error: "football_provider_not_configured",
    });
  }

  try {
    const livePayload = await fetchSportMonks(
      "/livescores/inplay?include=participants;scores;periods;league.country;round",
    );

    const liveMatches = ((livePayload.data ?? []) as SportMonksFixture[]).map(mapFixture);

    let fallbackMatches: Match[] = [];
    if (liveMatches.length === 0 && SPORTMONKS_RESULTS_ROUND_ID) {
      const resultsPayload = await fetchSportMonks(
        `/rounds/${SPORTMONKS_RESULTS_ROUND_ID}?include=fixtures.participants;fixtures.scores;league.country`,
      );
      fallbackMatches = (((resultsPayload.data?.fixtures ?? []) as SportMonksFixture[]) || [])
        .map(mapFixture)
        .sort((a, b) => {
          const priorityDiff = b.priority - a.priority;
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 12);
    }

    const matches = (liveMatches.length > 0 ? liveMatches : fallbackMatches)
      .sort((a, b) => {
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })
      .slice(0, 20)
      .map(stripPriority);

    const recentResults = matches.filter((match) => match.status === "FT").slice(0, 12);
    const upcomingFixtures = matches.filter((match) => match.status === "NS").slice(0, 8);
    const previousDay = matches.filter((match) => match.date.slice(0, 10) === isoDate(-1)).slice(0, 10);
    const today = matches.filter((match) => match.date.slice(0, 10) === isoDate(0)).slice(0, 12);
    const nextDay = matches.filter((match) => match.date.slice(0, 10) === isoDate(1)).slice(0, 10);

    return NextResponse.json({
      primaryMatch: matches[0] ?? null,
      matches,
      previousDay,
      today,
      nextDay,
      importantMatches: matches.slice(0, 16),
      recentResults,
      upcomingFixtures,
      source: "sportmonks",
      mode: liveMatches.length > 0 ? "live" : "results",
    });
  } catch {
    try {
      const fallback = await getApiFootballMatches();
      if (fallback) return NextResponse.json(fallback);
    } catch {
      // Return the provider error below.
    }
    return NextResponse.json({
      primaryMatch: null,
      matches: [],
      recentResults: [],
      upcomingFixtures: [],
      source: "network_error",
      error: "sportmonks_unavailable",
    });
  }
}
