import { NextResponse } from "next/server";

import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { readWidgetProviderSettings } from "@/lib/widget-provider-settings";

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";
const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const THE_SPORTS_DB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";
const TOP_LEAGUE_IDS = [39, 140, 135, 78, 61];
const THE_SPORTS_DB_TOP_LEAGUE_IDS = ["4328", "4335", "4332", "4331", "4334", "4480"];

type FootballRuntimeConfig = {
  providerMode: "auto" | "paid" | "free" | "off";
  priorityLeagueIds: number[];
  priorityKeywords: string[];
  newsMessage: string;
  maxMatches: number;
  sportmonksToken?: string;
  sportmonksResultsRoundId?: string;
  apiFootballKey?: string;
  minPriority: number;
};

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

type SportsDbEvent = {
  idEvent?: string;
  strLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strStatus?: string;
  strProgress?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
};

const defaultFootballConfig: FootballRuntimeConfig = {
  providerMode: "auto",
  priorityLeagueIds: [39, 140, 135, 78, 61, 2, 3, 848, 1, 15],
  priorityKeywords: ["world cup", "fifa", "champions league", "europa", "premier", "la liga", "serie a", "bundesliga", "ligue 1"],
  newsMessage: "",
  maxMatches: 20,
  sportmonksToken: process.env.SPORTMONKS_TOKEN,
  sportmonksResultsRoundId: process.env.SPORTMONKS_RESULTS_ROUND_ID,
  apiFootballKey: process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_FOOTBALL_KEY,
  minPriority: 70,
};

function competitionPriority(leagueName: string, leagueId: number | undefined, config: FootballRuntimeConfig) {
  if (leagueId === 1 || leagueId === 15) return 100;
  if (leagueId === 2) return 94;
  if (leagueId === 3) return 86;
  if (leagueId === 848) return 82;
  if (leagueId === 39) return 78;
  if (leagueId === 140) return 76;
  if (leagueId === 78) return 74;
  if (leagueId === 135) return 72;
  if (leagueId === 61) return 70;
  if (leagueId !== undefined && config.priorityLeagueIds.includes(leagueId)) return 80;
  if (leagueId !== undefined) return 10;
  const value = leagueName.toLowerCase();
  if (config.priorityKeywords.some((keyword) => value.includes(keyword.toLowerCase()))) return 88;
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

function isPriorityMatch(match: Match, config: FootballRuntimeConfig) {
  const league = match.league.toLowerCase();
  return match.priority >= config.minPriority || config.priorityKeywords.some((keyword) => league.includes(keyword.toLowerCase()));
}

function mapFixture(fixture: SportMonksFixture, config: FootballRuntimeConfig): Match {
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
    priority: competitionPriority(leagueName, undefined, config),
  };
}

function mapApiFootballFixture(item: ApiFootballFixture, config: FootballRuntimeConfig): Match {
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
    priority: competitionPriority(leagueName, item.league?.id, config),
  };
}

async function readFootballRuntimeConfig(): Promise<FootballRuntimeConfig> {
  const providerSettings = await readWidgetProviderSettings();
  const providerOverlay = {
    sportmonksToken: providerSettings.sportmonksToken,
    sportmonksResultsRoundId: providerSettings.sportmonksResultsRoundId,
    apiFootballKey: providerSettings.apiFootballKey || providerSettings.rapidApiFootballKey,
    minPriority: providerSettings.footballMinPriority,
  };
  if (!hasSupabasePublicEnv()) return { ...defaultFootballConfig, ...providerOverlay };
  try {
    const supabase = createSupabaseDataClient();
    const { data } = await supabase.from("app_settings").select("value").eq("key", "moplayer2_public_config").maybeSingle();
    const value = typeof data?.value === "object" && data.value ? (data.value as Record<string, unknown>) : {};
    const widgets = typeof value.widgets === "object" && value.widgets ? (value.widgets as Record<string, unknown>) : {};
    const rawProviderMode = String(value.footballProviderMode ?? "auto").toLowerCase();
    const providerMode: FootballRuntimeConfig["providerMode"] =
      rawProviderMode === "paid" || rawProviderMode === "free" || rawProviderMode === "off" ? rawProviderMode : "auto";
    const priorityLeagueIds = Array.isArray(value.footballLeagueIds)
      ? value.footballLeagueIds.map(Number).filter((item) => Number.isFinite(item) && item > 0)
      : defaultFootballConfig.priorityLeagueIds;
    const priorityKeywords = Array.isArray(value.footballLeagueKeywords)
      ? value.footballLeagueKeywords.map(String).map((item) => item.trim()).filter(Boolean)
      : defaultFootballConfig.priorityKeywords;
    const maxMatches = Number(widgets.footballMaxMatches ?? defaultFootballConfig.maxMatches);
    return {
      providerMode,
      priorityLeagueIds: priorityLeagueIds.length ? priorityLeagueIds : defaultFootballConfig.priorityLeagueIds,
      priorityKeywords: priorityKeywords.length ? priorityKeywords : defaultFootballConfig.priorityKeywords,
      newsMessage: String(value.footballNewsMessage ?? "").trim(),
      maxMatches: Number.isFinite(maxMatches) ? Math.min(Math.max(maxMatches, 1), 20) : defaultFootballConfig.maxMatches,
      ...providerOverlay,
    };
  } catch {
    return { ...defaultFootballConfig, ...providerOverlay };
  }
}

async function fetchSportMonks(path: string, token: string) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${SPORTMONKS_BASE_URL}${path}${separator}api_token=${token}`, {
    next: { revalidate: 90 },
  });

  if (!response.ok) {
    throw new Error(`sportmonks_${response.status}`);
  }

  return response.json();
}

async function fetchApiFootball(path: string, apiKey: string) {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`api_football_${response.status}`);
  }

  return response.json();
}

async function fetchTheSportsDb(path: string) {
  const response = await fetch(`${THE_SPORTS_DB_BASE_URL}${path}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`thesportsdb_${response.status}`);
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

function parseSportsDbGoals(value: string | null | undefined) {
  if (value == null || value.trim() === "") return null;
  const goals = Number(value);
  return Number.isFinite(goals) ? goals : null;
}

function sportsDbStatusLabel(event: SportsDbEvent) {
  const status = (event.strStatus ?? "").trim();
  const progress = (event.strProgress ?? "").trim();
  if (progress && progress !== "0") return progress.endsWith("'") ? progress : `${progress}'`;
  if (/finished|ft|aet|pen/i.test(status)) return "FT";
  if (/not started|ns|scheduled/i.test(status) || !status) return "NS";
  return status.toUpperCase();
}

function sportsDbIsLive(event: SportsDbEvent) {
  const status = (event.strStatus ?? "").toLowerCase();
  const progress = (event.strProgress ?? "").trim();
  if (/finished|not started|postp|cancel|ft|ns/.test(status)) return false;
  return (progress !== "" && progress !== "0") || /live|1h|2h|ht|half|et/.test(status);
}

function cleanSportsDbText(value: string | undefined) {
  const text = (value ?? "").trim();
  return text.includes("�") ? "" : text;
}

function mapSportsDbEvent(event: SportsDbEvent, config: FootballRuntimeConfig): Match | null {
  const homeTeam = cleanSportsDbText(event.strHomeTeam);
  const awayTeam = cleanSportsDbText(event.strAwayTeam);
  if (!homeTeam || !awayTeam) return null;
  const date = event.strTimestamp || (event.dateEvent ? `${event.dateEvent}T00:00:00Z` : new Date().toISOString());
  const leagueName = cleanSportsDbText(event.strLeague) || "Football";
  const homeGoals = parseSportsDbGoals(event.intHomeScore);
  const awayGoals = parseSportsDbGoals(event.intAwayScore);
  return {
    id: Number(event.idEvent) || Math.floor(Math.random() * 1_000_000_000),
    date,
    status: sportsDbIsLive(event) ? "LIVE" : sportsDbStatusLabel(event),
    elapsed: parseSportsDbGoals(event.strProgress),
    league: leagueName,
    leagueLogo: "",
    homeTeam,
    homeLogo: event.strHomeTeamBadge ?? "",
    awayTeam,
    awayLogo: event.strAwayTeamBadge ?? "",
    homeGoals,
    awayGoals,
    priority: competitionPriority(leagueName, undefined, config),
  };
}

async function getTheSportsDbMatches(config: FootballRuntimeConfig) {
  const [previousPayload, todayPayload, nextPayload] = await Promise.all([
    fetchTheSportsDb(`/eventsday.php?d=${isoDate(-1)}&s=Soccer`),
    fetchTheSportsDb(`/eventsday.php?d=${isoDate(0)}&s=Soccer`),
    fetchTheSportsDb(`/eventsday.php?d=${isoDate(1)}&s=Soccer`),
  ]);

  const previousDay = ((previousPayload.events ?? []) as SportsDbEvent[])
    .map((item) => mapSportsDbEvent(item, config))
    .filter((match): match is Match => Boolean(match))
    .filter((match) => isPriorityMatch(match, config))
    .slice(0, 10);
  const today = ((todayPayload.events ?? []) as SportsDbEvent[])
    .map((item) => mapSportsDbEvent(item, config))
    .filter((match): match is Match => Boolean(match))
    .filter((match) => isPriorityMatch(match, config))
    .slice(0, 12);
  const nextDay = ((nextPayload.events ?? []) as SportsDbEvent[])
    .map((item) => mapSportsDbEvent(item, config))
    .filter((match): match is Match => Boolean(match))
    .filter((match) => isPriorityMatch(match, config))
    .slice(0, 10);

  let matches = [...previousDay, ...today, ...nextDay];

  if (matches.length === 0) {
    const leaguePayloads = await Promise.allSettled(
      THE_SPORTS_DB_TOP_LEAGUE_IDS.map((leagueId) => fetchTheSportsDb(`/eventsnextleague.php?id=${leagueId}`)),
    );
    matches = leaguePayloads
      .flatMap((result) => result.status === "fulfilled" ? ((result.value.events ?? []) as SportsDbEvent[]) : [])
      .map((item) => mapSportsDbEvent(item, config))
      .filter((match): match is Match => Boolean(match))
      .filter((match) => isPriorityMatch(match, config));
  }

  matches = matches
    .sort((a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE") || b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, config.maxMatches);

  if (matches.length === 0) return null;

  const recentResults = [...previousDay, ...today].filter((match) => match.homeGoals !== null && match.awayGoals !== null).slice(0, 12);
  const upcomingFixtures = [...today, ...nextDay, ...matches].filter((match) => match.homeGoals === null || match.awayGoals === null).slice(0, 8);

  return {
    primaryMatch: stripPriority(matches[0]),
    matches: matches.map(stripPriority),
    previousDay: previousDay.map(stripPriority),
    today: today.map(stripPriority),
    nextDay: nextDay.map(stripPriority),
    importantMatches: matches.slice(0, 16).map(stripPriority),
    recentResults: recentResults.map(stripPriority),
    upcomingFixtures: upcomingFixtures.map(stripPriority),
    source: "thesportsdb",
    mode: matches.some((match) => match.status === "LIVE") ? "live" : "results_upcoming",
    newsMessage: config.newsMessage,
  };
}

async function getApiFootballMatches(config: FootballRuntimeConfig) {
  const apiFootballKey = config.apiFootballKey;
  if (!apiFootballKey) return null;

  const livePayload = await fetchApiFootball("/fixtures?live=all", apiFootballKey);
  const liveMatches = ((livePayload.response ?? []) as ApiFootballFixture[])
    .map((item) => mapApiFootballFixture(item, config))
    .filter((match) => isPriorityMatch(match, config));

  const [previousPayload, todayPayload, nextPayload] = await Promise.all([
    fetchApiFootball(`/fixtures?date=${isoDate(-1)}`, apiFootballKey),
    fetchApiFootball(`/fixtures?date=${isoDate(0)}`, apiFootballKey),
    fetchApiFootball(`/fixtures?date=${isoDate(1)}`, apiFootballKey),
  ]);

  const previousDay = ((previousPayload.response ?? []) as ApiFootballFixture[])
    .map((item) => mapApiFootballFixture(item, config))
    .filter((match) => isPriorityMatch(match, config))
    .sort((a, b) => b.priority - a.priority || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const today = ((todayPayload.response ?? []) as ApiFootballFixture[])
    .map((item) => mapApiFootballFixture(item, config))
    .filter((match) => isPriorityMatch(match, config))
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 12);

  const nextDay = ((nextPayload.response ?? []) as ApiFootballFixture[])
    .map((item) => mapApiFootballFixture(item, config))
    .filter((match) => isPriorityMatch(match, config))
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
        fetchApiFootball(`/fixtures?league=${leagueId}&season=${season}&last=3`, apiFootballKey),
        fetchApiFootball(`/fixtures?league=${leagueId}&season=${season}&next=3`, apiFootballKey),
      ]),
    );
    const leagueFixtures = leaguePayloads.flatMap((result) =>
      result.status === "fulfilled" ? ((result.value.response ?? []) as ApiFootballFixture[]) : [],
    );
    const mapped = leagueFixtures.map((item) => mapApiFootballFixture(item, config));
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
    .slice(0, config.maxMatches)
    .map(stripPriority);

  if (matches.length === 0) return null;

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
    newsMessage: config.newsMessage,
  };
}

export async function GET() {
  const config = await readFootballRuntimeConfig();
  if (config.providerMode === "off") {
    return NextResponse.json({ primaryMatch: null, matches: [], recentResults: [], upcomingFixtures: [], source: "disabled", newsMessage: config.newsMessage });
  }

  if (!config.sportmonksToken || config.providerMode === "free") {
    try {
      if (config.providerMode === "paid") throw new Error("paid_provider_required");
      const fallback = await getApiFootballMatches(config);
      if (fallback) return NextResponse.json(fallback);
      const freeFallback = await getTheSportsDbMatches(config);
      if (freeFallback) return NextResponse.json(freeFallback);
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
      newsMessage: config.newsMessage,
    });
  }

  try {
    const livePayload = await fetchSportMonks(
      "/livescores/inplay?include=participants;scores;periods;league.country;round",
      config.sportmonksToken,
    );

    const liveMatches = ((livePayload.data ?? []) as SportMonksFixture[]).map((fixture) => mapFixture(fixture, config)).filter((match) => isPriorityMatch(match, config));

    let fallbackMatches: Match[] = [];
    if (liveMatches.length === 0 && config.sportmonksResultsRoundId) {
      const resultsPayload = await fetchSportMonks(
        `/rounds/${config.sportmonksResultsRoundId}?include=fixtures.participants;fixtures.scores;league.country`,
        config.sportmonksToken,
      );
      fallbackMatches = (((resultsPayload.data?.fixtures ?? []) as SportMonksFixture[]) || [])
        .map((fixture) => mapFixture(fixture, config))
        .filter((match) => isPriorityMatch(match, config))
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
      .slice(0, config.maxMatches)
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
      newsMessage: config.newsMessage,
    });
  } catch {
    try {
      if (config.providerMode === "paid") throw new Error("paid_provider_required");
      const fallback = await getApiFootballMatches(config);
      if (fallback) return NextResponse.json(fallback);
      const freeFallback = await getTheSportsDbMatches(config);
      if (freeFallback) return NextResponse.json(freeFallback);
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
      newsMessage: config.newsMessage,
    });
  }
}
