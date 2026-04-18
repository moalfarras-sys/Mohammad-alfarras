export type LiveMatch = {
  id: number;
  league: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  time: string;
};

type ApiSportsFixture = {
  fixture: {
    id: number;
    status: { short: string; elapsed: number | null };
    date: string;
  };
  league: { id: number; name: string };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

const PRIORITY_LEAGUES = new Map<number, number>([
  [2, 100],
  [3, 90],
  [39, 85],
  [140, 80],
  [78, 80],
  [135, 78],
  [61, 76],
  [94, 75],
]);

function statusWeight(status: string) {
  if (["1H", "2H", "HT", "ET", "P", "LIVE"].includes(status)) return 100;
  if (["NS", "TBD"].includes(status)) return 50;
  if (["FT", "AET", "PEN"].includes(status)) return 10;
  return 30;
}

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return getMockMatches();

  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return getMockMatches();

    const data = (await res.json()) as { response?: ApiSportsFixture[] };
    if (!data.response?.length) return getMockMatches();

    const ranked = data.response
      .filter((match) => PRIORITY_LEAGUES.has(match.league.id))
      .sort((a, b) => {
        const aScore = (PRIORITY_LEAGUES.get(a.league.id) ?? 0) + statusWeight(a.fixture.status.short);
        const bScore = (PRIORITY_LEAGUES.get(b.league.id) ?? 0) + statusWeight(b.fixture.status.short);
        return bScore - aScore;
      });

    if (!ranked.length) return getMockMatches();

    return ranked.slice(0, 4).map((match) => ({
      id: match.fixture.id,
      league: match.league.name,
      homeTeam: match.teams.home.name,
      homeLogo: match.teams.home.logo,
      awayTeam: match.teams.away.name,
      awayLogo: match.teams.away.logo,
      homeScore: match.goals.home,
      awayScore: match.goals.away,
      status: match.fixture.status.short,
      time: match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : new Date(match.fixture.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    }));
  } catch (error) {
    console.error("Football fetch failed, using fallback:", error);
    return getMockMatches();
  }
}

function getMockMatches(): LiveMatch[] {
  return [
    {
      id: 1,
      league: "UEFA Champions League",
      homeTeam: "Real Madrid",
      homeLogo: "https://media.api-sports.io/football/teams/541.png",
      awayTeam: "Manchester City",
      awayLogo: "https://media.api-sports.io/football/teams/50.png",
      homeScore: 2,
      awayScore: 3,
      status: "LIVE",
      time: "82'",
    },
    {
      id: 2,
      league: "Bundesliga",
      homeTeam: "Bayern Munich",
      homeLogo: "https://media.api-sports.io/football/teams/157.png",
      awayTeam: "Borussia Dortmund",
      awayLogo: "https://media.api-sports.io/football/teams/165.png",
      homeScore: 1,
      awayScore: 1,
      status: "HT",
      time: "HT",
    },
    {
      id: 3,
      league: "Premier League",
      homeTeam: "Arsenal",
      homeLogo: "https://media.api-sports.io/football/teams/42.png",
      awayTeam: "Liverpool",
      awayLogo: "https://media.api-sports.io/football/teams/40.png",
      homeScore: null,
      awayScore: null,
      status: "NS",
      time: "21:00",
    },
  ];
}
