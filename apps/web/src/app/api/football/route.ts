import { NextResponse } from "next/server";

import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { readWidgetProviderSettings } from "@/lib/widget-provider-settings";

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";
const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const RAPIDAPI_FOOTBALL_BASE_URL = "https://free-api-live-football-data.p.rapidapi.com";
const RAPIDAPI_FOOTBALL_HOST = "free-api-live-football-data.p.rapidapi.com";
const ESPN_SCOREBOARD_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const THE_SPORTS_DB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";
const TOP_LEAGUE_IDS = [39, 140, 135, 78, 61];
const RAPIDAPI_TOP_LEAGUE_IDS = [77, 47, 42, 87, 55, 54, 53, 73];
const RAPIDAPI_LEAGUES: Record<number, { name: string; priority: number; logo: string }> = {
  77: { name: "FIFA World Cup", priority: 100, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/77.png" },
  42: { name: "UEFA Champions League", priority: 92, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/42.png" },
  73: { name: "UEFA Europa League", priority: 84, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/73.png" },
  47: { name: "Premier League", priority: 78, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/47.png" },
  87: { name: "LaLiga", priority: 76, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/87.png" },
  54: { name: "Bundesliga", priority: 74, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/54.png" },
  55: { name: "Serie A", priority: 72, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/55.png" },
  53: { name: "Ligue 1", priority: 70, logo: "https://images.fotmob.com/image_resources/logo/leaguelogo/dark/53.png" },
};
const THE_SPORTS_DB_WORLD_CUP_LEAGUE_ID = "4429";
const THE_SPORTS_DB_TOP_LEAGUE_IDS = [THE_SPORTS_DB_WORLD_CUP_LEAGUE_ID, "4328", "4335", "4332", "4331", "4334", "4480"];
const ESPN_WORLD_CUP_2026_DATES = "20260611-20260719";
const ESPN_SCOREBOARD_SOURCES = [
  { slug: "fifa.world", league: "FIFA World Cup", priority: 100, query: `dates=${ESPN_WORLD_CUP_2026_DATES}&limit=300`, fullSchedule: true },
  { slug: "uefa.champions", league: "UEFA Champions League", priority: 92, query: "limit=50", fullSchedule: false },
  { slug: "uefa.europa", league: "UEFA Europa League", priority: 84, query: "limit=50", fullSchedule: false },
  { slug: "eng.1", league: "English Premier League", priority: 78, query: "limit=50", fullSchedule: false },
  { slug: "esp.1", league: "Spanish LALIGA", priority: 76, query: "limit=50", fullSchedule: false },
  { slug: "ger.1", league: "German Bundesliga", priority: 74, query: "limit=50", fullSchedule: false },
  { slug: "ita.1", league: "Italian Serie A", priority: 72, query: "limit=50", fullSchedule: false },
  { slug: "fra.1", league: "French Ligue 1", priority: 70, query: "limit=50", fullSchedule: false },
] as const;

type FootballRuntimeConfig = {
  providerMode: "auto" | "paid" | "free" | "off";
  priorityLeagueIds: number[];
  priorityKeywords: string[];
  newsMessage: string;
  maxMatches: number;
  sportmonksToken?: string;
  sportmonksResultsRoundId?: string;
  apiFootballKey?: string;
  rapidApiFootballKey?: string;
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
  statusLong?: string;
  elapsed: number | null;
  league: string;
  leagueLogo: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  venueName?: string;
  venueCity?: string;
  referee?: string;
  halftimeHome?: number | null;
  halftimeAway?: number | null;
  round?: string;
  group?: string;
  season?: string;
  priority: number;
};

type PublicMatch = Omit<Match, "priority">;

function stripPriority(match: Match): PublicMatch {
  const { priority: internalPriority, ...publicMatch } = match;
  void internalPriority;
  return publicMatch;
}

function publicMatches(matches: Match[]) {
  return matches.map(stripPriority);
}

function normalizeIsoDate(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/i.test(trimmed)) return trimmed.replace(/Z$/i, ":00Z");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.replace(/([+-]\d{2}:\d{2})$/, ":00$1");
  }
  if (/Z$/i.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00Z`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}Z`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`;
  return trimmed;
}

function dateOnly(value: string) {
  return normalizeIsoDate(value).slice(0, 10);
}

function parseNullableNumber(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseId(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * 1_000_000_000);
}

function parseElapsedDisplay(value: string | undefined) {
  const match = value?.match(/(\d+)/);
  if (!match) return null;
  const elapsed = Number(match[1]);
  return Number.isFinite(elapsed) ? elapsed : null;
}

function isLiveStatus(status: string) {
  return ["1H", "2H", "ET", "P", "LIVE", "HT", "BT"].includes(status);
}

function isFinishedStatus(status: string) {
  return ["FT", "AET", "PEN"].includes(status);
}

// A finished match older than this is history, not widget material — it must never crowd out
// live or upcoming fixtures in the lists the TV widgets read.
const STALE_FINISHED_MS = 48 * 60 * 60 * 1000;

function isStaleFinished(match: Match) {
  return isFinishedStatus(match.status) && Date.now() - matchTimestamp(match) > STALE_FINISHED_MS;
}

function isUpcomingStatus(status: string) {
  return ["NS", "TBD", "SCHEDULED", "TIMED"].includes(status);
}

function matchTimestamp(match: Match) {
  const timestamp = new Date(normalizeIsoDate(match.date)).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function uniqueMatches(matches: Match[]) {
  const seen = new Set<string>();
  const unique: Match[] = [];
  for (const match of matches) {
    const key = String(match.id);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(match);
  }
  return unique;
}

function sortForWidget(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const liveDiff = Number(isLiveStatus(b.status)) - Number(isLiveStatus(a.status));
    if (liveDiff !== 0) return liveDiff;
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;
    const now = Date.now();
    return Math.abs(matchTimestamp(a) - now) - Math.abs(matchTimestamp(b) - now);
  });
}

function sortByDateAsc(matches: Match[]) {
  return [...matches].sort((a, b) => matchTimestamp(a) - matchTimestamp(b));
}

function sortByDateDesc(matches: Match[]) {
  return [...matches].sort((a, b) => matchTimestamp(b) - matchTimestamp(a));
}

function buildFootballPayload(
  matches: Match[],
  config: FootballRuntimeConfig,
  source: string,
  mode: string,
  worldCupMatches: Match[] = [],
): FootballPayload | null {
  const unique = uniqueMatches(matches);
  if (unique.length === 0) return null;

  // Widgets should see live + upcoming + recent — stale finished games only crowd them out.
  // Fall back to the unfiltered pool so a between-matchdays lull never blanks the widget.
  const freshPool = unique.filter((match) => !isStaleFinished(match));
  const pool = freshPool.length ? freshPool : unique;

  const previousDay = sortByDateDesc(unique.filter((match) => dateOnly(match.date) === isoDate(-1))).slice(0, 20);
  const today = sortForWidget(unique.filter((match) => dateOnly(match.date) === isoDate(0))).slice(0, 30);
  const nextDay = sortByDateAsc(unique.filter((match) => dateOnly(match.date) === isoDate(1))).slice(0, 20);
  const liveMatches = unique.filter((match) => isLiveStatus(match.status));
  const recentResults = sortByDateDesc(unique.filter((match) => isFinishedStatus(match.status))).slice(0, 20);
  const upcomingFixtures = sortByDateAsc(unique.filter((match) => isUpcomingStatus(match.status) || matchTimestamp(match) >= Date.now())).slice(0, 32);
  const freshResults = recentResults.filter((match) => !isStaleFinished(match));
  // upcomingFixtures/recentResults are subsets of `unique`, so re-dedupe after concatenating.
  const prioritized = uniqueMatches(sortForWidget(liveMatches.length ? liveMatches : [...upcomingFixtures, ...freshResults, ...pool])).slice(0, config.maxMatches);
  const important = sortForWidget(pool).slice(0, Math.max(24, config.maxMatches));
  const cup = sortByDateAsc(uniqueMatches(worldCupMatches)).map(stripPriority);
  // The widget-facing important list must lead with live/next cup fixtures, not the tournament's
  // month-old finished games (the full chronological schedule stays in `worldCupMatches`).
  const cupWidget = sortForWidget(uniqueMatches(worldCupMatches).filter((match) => !isStaleFinished(match)));
  const primary = prioritized[0] ?? sortForWidget(pool)[0];
  if (!primary) return null;

  return {
    primaryMatch: stripPriority(primary),
    matches: publicMatches(prioritized),
    previousDay: publicMatches(previousDay),
    today: publicMatches(today),
    nextDay: publicMatches(nextDay),
    importantMatches: publicMatches(cupWidget.length ? uniqueMatches([...cupWidget, ...important]) : important),
    recentResults: publicMatches(recentResults),
    upcomingFixtures: publicMatches(upcomingFixtures),
    ...(cup.length ? { worldCupMatches: cup } : {}),
    source,
    mode,
    newsMessage: config.newsMessage,
  };
}

type ApiFootballFixture = {
  fixture?: {
    id?: number;
    date?: string;
    referee?: string | null;
    venue?: { name?: string; city?: string };
    status?: { short?: string; long?: string; elapsed?: number | null };
  };
  league?: { id?: number; name?: string; logo?: string; round?: string; season?: number };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
  score?: { halftime?: { home?: number | null; away?: number | null } };
};

type SportsDbEvent = {
  idEvent?: string;
  strLeague?: string;
  strLeagueBadge?: string;
  strSeason?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strStatus?: string;
  strProgress?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strVenue?: string;
  strCity?: string;
  strCountry?: string;
  strGroup?: string;
  intRound?: string;
};

type EspnScoreboardSource = (typeof ESPN_SCOREBOARD_SOURCES)[number];

type EspnLogo = { href?: string };

type EspnStatus = {
  clock?: number;
  displayClock?: string;
  type?: {
    name?: string;
    state?: string;
    completed?: boolean;
    description?: string;
    detail?: string;
    shortDetail?: string;
  };
};

type EspnCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  team?: {
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
    logos?: EspnLogo[];
  };
};

type EspnCompetition = {
  status?: EspnStatus;
  competitors?: EspnCompetitor[];
  venue?: {
    fullName?: string;
    address?: { city?: string; country?: string };
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  season?: { year?: number; slug?: string };
  competitions?: EspnCompetition[];
};

type RapidApiFootballTeam = {
  id?: number;
  score?: number | null;
  name?: string;
  longName?: string;
};

type RapidApiFootballMatch = {
  id?: number;
  leagueId?: number;
  time?: string;
  home?: RapidApiFootballTeam;
  away?: RapidApiFootballTeam;
  statusId?: number;
  tournamentStage?: string;
  status?: {
    utcTime?: string;
    finished?: boolean;
    started?: boolean;
    cancelled?: boolean;
    ongoing?: boolean;
    scoreStr?: string;
    liveTime?: {
      short?: string;
      long?: string;
    };
  };
  timeTS?: number;
};

type FootballPayload = {
  primaryMatch: PublicMatch | null;
  matches: PublicMatch[];
  previousDay: PublicMatch[];
  today: PublicMatch[];
  nextDay: PublicMatch[];
  importantMatches: PublicMatch[];
  recentResults: PublicMatch[];
  upcomingFixtures: PublicMatch[];
  worldCupMatches?: PublicMatch[];
  source: string;
  mode: string;
  newsMessage: string;
};

const defaultFootballConfig: FootballRuntimeConfig = {
  providerMode: "auto",
  priorityLeagueIds: [39, 140, 135, 78, 61, 2, 3, 848, 1, 15],
  priorityKeywords: ["world cup", "fifa", "champions league", "europa", "premier", "la liga", "serie a", "bundesliga", "ligue 1"],
  newsMessage: "",
  maxMatches: 20,
  sportmonksToken: process.env.SPORTMONKS_TOKEN,
  sportmonksResultsRoundId: process.env.SPORTMONKS_RESULTS_ROUND_ID,
  apiFootballKey: process.env.API_FOOTBALL_KEY,
  rapidApiFootballKey: process.env.RAPIDAPI_FOOTBALL_KEY,
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
    date: normalizeIsoDate(fixture.starting_at),
    status: inferStatus(fixture),
    statusLong: fixture.result_info ?? undefined,
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
    id: item.fixture?.id ?? parseId(undefined),
    date: normalizeIsoDate(item.fixture?.date),
    status: item.fixture?.status?.short ?? "NS",
    statusLong: item.fixture?.status?.long ?? item.fixture?.status?.short ?? "Scheduled",
    elapsed: item.fixture?.status?.elapsed ?? null,
    league: leagueName,
    leagueLogo: item.league?.logo ?? "",
    homeTeam: item.teams?.home?.name ?? "Home",
    homeLogo: item.teams?.home?.logo ?? "",
    awayTeam: item.teams?.away?.name ?? "Away",
    awayLogo: item.teams?.away?.logo ?? "",
    homeGoals: item.goals?.home ?? null,
    awayGoals: item.goals?.away ?? null,
    venueName: item.fixture?.venue?.name,
    venueCity: item.fixture?.venue?.city,
    referee: item.fixture?.referee ?? undefined,
    halftimeHome: item.score?.halftime?.home ?? null,
    halftimeAway: item.score?.halftime?.away ?? null,
    round: item.league?.round,
    season: item.league?.season ? String(item.league.season) : undefined,
    priority: competitionPriority(leagueName, item.league?.id, config),
  };
}

async function readFootballRuntimeConfig(): Promise<FootballRuntimeConfig> {
  const providerSettings = await readWidgetProviderSettings();
  const providerOverlay = {
    sportmonksToken: providerSettings.sportmonksToken,
    sportmonksResultsRoundId: providerSettings.sportmonksResultsRoundId,
    apiFootballKey: providerSettings.apiFootballKey,
    rapidApiFootballKey: providerSettings.rapidApiFootballKey,
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

async function fetchApiFootball(path: string, apiKey: string, revalidate = 120) {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`api_football_${response.status}`);
  }

  return response.json();
}

async function fetchRapidApiFootball(path: string, apiKey: string) {
  const response = await fetch(`${RAPIDAPI_FOOTBALL_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_FOOTBALL_HOST,
      "x-rapidapi-key": apiKey,
    },
    next: { revalidate: path.includes("current-live") ? 60 : 300 },
  });

  if (!response.ok) {
    throw new Error(`rapidapi_football_${response.status}`);
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

function espnDateRange(fromOffset = -1, toOffset = 7) {
  return `${isoDate(fromOffset).replace(/-/g, "")}-${isoDate(toOffset).replace(/-/g, "")}`;
}

async function fetchEspnScoreboard(source: EspnScoreboardSource) {
  // League scoreboards default to "today only", which starves the widget of upcoming fixtures
  // between matchdays. Ask for a rolling yesterday..+7d window instead (keyless, free) so NS
  // fixtures with kickoff times are always available; the World Cup source keeps its own range.
  const query = source.fullSchedule ? source.query : `${source.query}&dates=${espnDateRange()}`;
  const response = await fetch(`${ESPN_SCOREBOARD_BASE_URL}/${source.slug}/scoreboard?${query}`, {
    next: { revalidate: source.fullSchedule ? 900 : 300 },
  });

  if (!response.ok) {
    throw new Error(`espn_${source.slug}_${response.status}`);
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

function espnStatusShort(status: EspnStatus | undefined) {
  const state = status?.type?.state?.toLowerCase() ?? "";
  const name = status?.type?.name?.toUpperCase() ?? "";
  const description = status?.type?.description?.toLowerCase() ?? "";
  if (status?.type?.completed || state === "post") return "FT";
  if (name.includes("HALFTIME") || description.includes("halftime")) return "HT";
  if (state === "in") {
    if (name.includes("FIRST")) return "1H";
    if (name.includes("SECOND")) return "2H";
    return "LIVE";
  }
  if (description.includes("postponed")) return "PST";
  if (description.includes("canceled") || description.includes("cancelled")) return "CANC";
  return "NS";
}

function espnScore(competitor: EspnCompetitor | undefined, status: string) {
  if (!competitor || isUpcomingStatus(status)) return null;
  return parseNullableNumber(competitor.score);
}

function espnTeamLogo(competitor: EspnCompetitor | undefined) {
  return competitor?.team?.logo || competitor?.team?.logos?.find((logo) => Boolean(logo.href))?.href || "";
}

function mapEspnEvent(event: EspnEvent, source: EspnScoreboardSource, config: FootballRuntimeConfig): Match | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.homeAway === "home") ?? competitors[0];
  const away = competitors.find((competitor) => competitor.homeAway === "away") ?? competitors[1];
  const homeTeam = home?.team?.displayName || home?.team?.shortDisplayName;
  const awayTeam = away?.team?.displayName || away?.team?.shortDisplayName;
  if (!homeTeam || !awayTeam) return null;

  const status = espnStatusShort(competition?.status);
  const statusLong = competition?.status?.type?.description || competition?.status?.type?.detail || status;
  const venueCity = [
    competition?.venue?.address?.city,
    competition?.venue?.address?.country,
  ].filter(Boolean).join(", ");
  const leagueName = source.league;

  return {
    id: parseId(event.id),
    date: normalizeIsoDate(event.date),
    status,
    statusLong,
    elapsed: parseElapsedDisplay(competition?.status?.displayClock),
    league: leagueName,
    leagueLogo: "",
    homeTeam,
    homeLogo: espnTeamLogo(home),
    awayTeam,
    awayLogo: espnTeamLogo(away),
    homeGoals: espnScore(home, status),
    awayGoals: espnScore(away, status),
    venueName: competition?.venue?.fullName,
    venueCity: venueCity || undefined,
    round: event.season?.slug,
    season: event.season?.year ? String(event.season.year) : undefined,
    priority: Math.max(source.priority, competitionPriority(leagueName, undefined, config)),
  };
}

function cleanSportsDbText(value: string | undefined) {
  const text = (value ?? "").trim();
  return text.includes("�") ? "" : text;
}

function mapSportsDbEvent(event: SportsDbEvent, config: FootballRuntimeConfig): Match | null {
  const homeTeam = cleanSportsDbText(event.strHomeTeam);
  const awayTeam = cleanSportsDbText(event.strAwayTeam);
  if (!homeTeam || !awayTeam) return null;
  const date = normalizeIsoDate(event.strTimestamp || (event.dateEvent ? `${event.dateEvent}T${event.strTime || "00:00:00"}` : new Date().toISOString()));
  const leagueName = cleanSportsDbText(event.strLeague) || "Football";
  const homeGoals = parseSportsDbGoals(event.intHomeScore);
  const awayGoals = parseSportsDbGoals(event.intAwayScore);
  const venueCity = [cleanSportsDbText(event.strCity), cleanSportsDbText(event.strCountry)].filter(Boolean).join(", ");
  return {
    id: parseId(event.idEvent),
    date,
    status: sportsDbIsLive(event) ? "LIVE" : sportsDbStatusLabel(event),
    statusLong: sportsDbIsLive(event) ? "Live" : sportsDbStatusLabel(event),
    elapsed: parseSportsDbGoals(event.strProgress),
    league: leagueName,
    leagueLogo: event.strLeagueBadge ?? "",
    homeTeam,
    homeLogo: event.strHomeTeamBadge ?? "",
    awayTeam,
    awayLogo: event.strAwayTeamBadge ?? "",
    homeGoals,
    awayGoals,
    venueName: cleanSportsDbText(event.strVenue),
    venueCity: venueCity || undefined,
    round: event.intRound,
    group: cleanSportsDbText(event.strGroup),
    season: event.strSeason,
    priority: competitionPriority(leagueName, undefined, config),
  };
}

function rapidApiDate(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function rapidStatusShort(status: RapidApiFootballMatch["status"]) {
  if (status?.cancelled) return "CANC";
  if (status?.finished) return "FT";
  if (status?.ongoing) return "LIVE";
  if (status?.started) return "1H";
  return "NS";
}

function rapidElapsed(status: RapidApiFootballMatch["status"]) {
  const liveTime = status?.liveTime?.short || status?.liveTime?.long || "";
  const match = liveTime.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function rapidGoals(team: RapidApiFootballTeam | undefined, status: string) {
  if (!team || status === "NS") return null;
  return parseNullableNumber(team.score);
}

function rapidLeague(leagueId: number | undefined) {
  return leagueId ? RAPIDAPI_LEAGUES[leagueId] : undefined;
}

function mapRapidApiFootballMatch(item: RapidApiFootballMatch, config: FootballRuntimeConfig): Match | null {
  const homeTeam = item.home?.longName || item.home?.name;
  const awayTeam = item.away?.longName || item.away?.name;
  if (!homeTeam || !awayTeam) return null;

  const leagueId = item.leagueId;
  const league = rapidLeague(leagueId);
  const leagueName = league?.name ?? "Football";
  const status = rapidStatusShort(item.status);
  const priority = Math.max(league?.priority ?? 0, competitionPriority(leagueName, undefined, config));

  return {
    id: parseId(item.id),
    date: normalizeIsoDate(item.status?.utcTime || (item.timeTS ? new Date(item.timeTS).toISOString() : undefined)),
    status,
    statusLong: item.status?.liveTime?.short || item.status?.scoreStr || status,
    elapsed: rapidElapsed(item.status),
    league: leagueName,
    leagueLogo: league?.logo ?? "",
    homeTeam,
    homeLogo: item.home?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${item.home.id}.png` : "",
    awayTeam,
    awayLogo: item.away?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${item.away.id}.png` : "",
    homeGoals: rapidGoals(item.home, status),
    awayGoals: rapidGoals(item.away, status),
    round: item.tournamentStage,
    priority,
  };
}

function rapidApiMatchesFromPayload(payload: unknown) {
  const response = (payload as { response?: Record<string, unknown> })?.response ?? {};
  const live = Array.isArray(response.live) ? response.live : [];
  const matches = Array.isArray(response.matches) ? response.matches : [];
  return [...live, ...matches] as RapidApiFootballMatch[];
}

async function getEspnFootballMatches(config: FootballRuntimeConfig): Promise<FootballPayload | null> {
  const payloads = await Promise.allSettled(ESPN_SCOREBOARD_SOURCES.map((source) => fetchEspnScoreboard(source)));
  const matches: Match[] = [];
  const worldCupMatches: Match[] = [];

  payloads.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const source = ESPN_SCOREBOARD_SOURCES[index];
    const mapped = ((result.value.events ?? []) as EspnEvent[])
      .map((event) => mapEspnEvent(event, source, config))
      .filter((match): match is Match => Boolean(match))
      .filter((match) => isPriorityMatch(match, config));
    matches.push(...mapped);
    if (source.fullSchedule) worldCupMatches.push(...mapped);
  });

  const mode = matches.some((match) => isLiveStatus(match.status))
    ? "live"
    : worldCupMatches.length > 0
      ? "world_cup_schedule"
      : "results_upcoming";

  return buildFootballPayload(matches, config, "espn-scoreboard", mode, worldCupMatches);
}

async function getRapidApiFootballMatches(config: FootballRuntimeConfig): Promise<FootballPayload | null> {
  const apiKey = config.rapidApiFootballKey;
  if (!apiKey) return null;

  const payloads = await Promise.allSettled([
    fetchRapidApiFootball("/football-current-live", apiKey),
    fetchRapidApiFootball(`/football-get-matches-by-date?date=${rapidApiDate(-1)}`, apiKey),
    fetchRapidApiFootball(`/football-get-matches-by-date?date=${rapidApiDate(0)}`, apiKey),
    fetchRapidApiFootball(`/football-get-matches-by-date?date=${rapidApiDate(1)}`, apiKey),
  ]);

  const matches = payloads
    .flatMap((result) => (result.status === "fulfilled" ? rapidApiMatchesFromPayload(result.value) : []))
    .map((item) => mapRapidApiFootballMatch(item, config))
    .filter((match): match is Match => Boolean(match))
    .filter((match) => RAPIDAPI_TOP_LEAGUE_IDS.some((leagueId) => RAPIDAPI_LEAGUES[leagueId]?.name === match.league))
    .filter((match) => isPriorityMatch(match, config));

  const worldCupMatches = matches.filter((match) => match.league.toLowerCase().includes("world cup"));
  const mode = matches.some((match) => isLiveStatus(match.status))
    ? "live"
    : worldCupMatches.length > 0
      ? "world_cup_schedule"
      : "results_upcoming";

  return buildFootballPayload(matches, config, "rapidapi-live-football-data", mode, worldCupMatches);
}

async function getTheSportsDbMatches(config: FootballRuntimeConfig): Promise<FootballPayload | null> {
  const dayPayloads = await Promise.allSettled([
    fetchTheSportsDb(`/eventsday.php?d=${isoDate(-1)}&s=Soccer`),
    fetchTheSportsDb(`/eventsday.php?d=${isoDate(0)}&s=Soccer`),
    fetchTheSportsDb(`/eventsday.php?d=${isoDate(1)}&s=Soccer`),
  ]);

  const dayEvents = dayPayloads.flatMap((result) =>
    result.status === "fulfilled" ? ((result.value.events ?? []) as SportsDbEvent[]) : [],
  );

  const leaguePayloads = await Promise.allSettled(
    [
      `/eventsseason.php?id=${THE_SPORTS_DB_WORLD_CUP_LEAGUE_ID}&s=2026`,
      ...THE_SPORTS_DB_TOP_LEAGUE_IDS.flatMap((leagueId) => [
        `/eventsnextleague.php?id=${leagueId}`,
        `/eventspastleague.php?id=${leagueId}`,
      ]),
    ].map((path) => fetchTheSportsDb(path)),
  );

  const leagueEvents = leaguePayloads.flatMap((result) =>
    result.status === "fulfilled" ? ((result.value.events ?? []) as SportsDbEvent[]) : [],
  );

  const matches = [...dayEvents, ...leagueEvents]
    .map((item) => mapSportsDbEvent(item, config))
    .filter((match): match is Match => Boolean(match))
    .filter((match) => isPriorityMatch(match, config));
  const worldCupMatches = matches.filter((match) => match.league.toLowerCase().includes("world cup"));
  const mode = matches.some((match) => isLiveStatus(match.status)) ? "live" : "results_upcoming";

  return buildFootballPayload(matches, config, "thesportsdb", mode, worldCupMatches);
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

  // The per-day queries can return the same fixture twice (the API resolves
  // the date in the venue's local timezone), so always dedupe by fixture id.
  let recentResults = uniqueMatches([...previousDay, ...today])
    .filter((match) => match.homeGoals !== null && match.awayGoals !== null)
    .sort((a, b) => b.priority - a.priority || new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  let upcomingFixtures = uniqueMatches([...today, ...nextDay])
    .filter((match) => match.homeGoals === null || match.awayGoals === null)
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  // Rescue each list independently: a lone finished match from yesterday must not suppress the
  // upcoming-fixtures fetch (that gate was why the widget could show only one stale FT game).
  // 900s revalidate keeps these per-league fallback calls well inside the daily quota.
  const needRecent = liveMatches.length === 0 && recentResults.length === 0;
  const needUpcoming = liveMatches.length === 0 && upcomingFixtures.length === 0;
  if (needRecent || needUpcoming) {
    const season = apiFootballSeason();
    const leaguePayloads = await Promise.allSettled(
      TOP_LEAGUE_IDS.flatMap((leagueId) => [
        ...(needRecent ? [fetchApiFootball(`/fixtures?league=${leagueId}&season=${season}&last=3`, apiFootballKey, 900)] : []),
        ...(needUpcoming ? [fetchApiFootball(`/fixtures?league=${leagueId}&season=${season}&next=3`, apiFootballKey, 900)] : []),
      ]),
    );
    const leagueFixtures = leaguePayloads.flatMap((result) =>
      result.status === "fulfilled" ? ((result.value.response ?? []) as ApiFootballFixture[]) : [],
    );
    const mapped = leagueFixtures.map((item) => mapApiFootballFixture(item, config));
    if (needRecent) {
      recentResults = mapped
        .filter((match) => match.homeGoals !== null && match.awayGoals !== null)
        .sort((a, b) => b.priority - a.priority || new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 12);
    }
    if (needUpcoming) {
      upcomingFixtures = mapped
        .filter((match) => match.homeGoals === null || match.awayGoals === null)
        .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 8);
    }
  }

  // Live first; otherwise upcoming + fresh results. Stale finished games are a last resort only,
  // so the widget prefers "what's next" over "what ended days ago" without ever going blank.
  const freshRecent = recentResults.filter((match) => !isStaleFinished(match));
  const widgetPool = [...upcomingFixtures, ...freshRecent];
  const matches = uniqueMatches(
    liveMatches.length > 0 ? liveMatches : widgetPool.length > 0 ? widgetPool : [...recentResults, ...upcomingFixtures],
  )
    .sort((a, b) => b.priority - a.priority || new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, config.maxMatches)
    .map(stripPriority);

  if (matches.length === 0) return null;

  const importantMatches = uniqueMatches(liveMatches.length > 0 ? liveMatches : [...previousDay, ...today, ...nextDay, ...recentResults, ...upcomingFixtures])
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

async function getFallbackFootballMatches(config: FootballRuntimeConfig): Promise<FootballPayload | null> {
  const providers = [
    () => getApiFootballMatches(config),
    () => getRapidApiFootballMatches(config),
    () => getEspnFootballMatches(config),
    () => getTheSportsDbMatches(config),
  ];

  for (const provider of providers) {
    try {
      const payload = await provider();
      if (payload && payload.matches.length > 0) return payload;
    } catch {
      // Keep the widget alive by trying the next real data source.
    }
  }

  return null;
}

// CDN cache for data-bearing responses: absorbs the TV widgets polling in lockstep
// without hammering the upstream providers, while staying fresh enough for live scores.
const FOOTBALL_CACHE_HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };

export async function GET() {
  const config = await readFootballRuntimeConfig();
  if (config.providerMode === "off") {
    return NextResponse.json(
      { primaryMatch: null, matches: [], recentResults: [], upcomingFixtures: [], source: "disabled", newsMessage: config.newsMessage },
      { headers: FOOTBALL_CACHE_HEADERS },
    );
  }

  if (!config.sportmonksToken || config.providerMode === "free") {
    if (config.providerMode !== "paid") {
      const fallback = await getFallbackFootballMatches(config);
      if (fallback) return NextResponse.json(fallback, { headers: FOOTBALL_CACHE_HEADERS });
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
    }, { headers: FOOTBALL_CACHE_HEADERS });
  } catch {
    if (config.providerMode !== "paid") {
      const fallback = await getFallbackFootballMatches(config);
      if (fallback) return NextResponse.json(fallback, { headers: FOOTBALL_CACHE_HEADERS });
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
