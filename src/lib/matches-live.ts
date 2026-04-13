export type LiveMatch = {
  id: number;
  league: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string; // e.g. "FT", "HT", "45'", "LIVE"
  time: string;
};

type ApiSportsFixture = {
  fixture: {
    id: number;
    status: { short: string; elapsed: number | null };
  };
  league: { id: number; name: string };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  if (!API_KEY) return getMockMatches();

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch live or today's matches
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
      },
      next: { revalidate: 300 } // Custom cache (5 minutes) for heavy live APIs
    });

    if (!res.ok) return getMockMatches();
    
    const data = (await res.json()) as { response?: ApiSportsFixture[] };
    if (!data.response || data.response.length === 0) return getMockMatches();

    // Filter Top Leagues to avoid spam (e.g., Champions League: 2, World Cup: 1, Premier League: 39, La Liga: 140, Bundesliga: 78)
    const topLeagues = [2, 1, 39, 140, 78, 135]; 
    const filteredMatches = data.response.filter((match) => topLeagues.includes(match.league.id));

    // If no top games today, just show a premium mock. Better than 3rd devision matches in a high-end portfolio!
    if (filteredMatches.length === 0) return getMockMatches();

    return filteredMatches.slice(0, 4).map((match) => ({
      id: match.fixture.id,
      league: match.league.name,
      homeTeam: match.teams.home.name,
      homeLogo: match.teams.home.logo,
      awayTeam: match.teams.away.name,
      awayLogo: match.teams.away.logo,
      homeScore: match.goals.home,
      awayScore: match.goals.away,
      status: match.fixture.status.short,
      time: match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : "Upcoming",
    }));

  } catch (error) {
    console.error("Football fetch failed, utilizing fallback:", error);
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
      awayTeam: "Man City",
      awayLogo: "https://media.api-sports.io/football/teams/50.png",
      homeScore: 2,
      awayScore: 3,
      status: "LIVE",
      time: "82'"
    },
    {
      id: 2,
      league: "Bundesliga",
      homeTeam: "Bayern Munich",
      homeLogo: "https://media.api-sports.io/football/teams/157.png",
      awayTeam: "B. Dortmund",
      awayLogo: "https://media.api-sports.io/football/teams/165.png",
      homeScore: 1,
      awayScore: 1,
      status: "HT",
      time: "HT"
    }
  ];
}
