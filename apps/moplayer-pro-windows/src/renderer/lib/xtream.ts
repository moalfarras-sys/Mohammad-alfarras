import type { Category, LibraryData, MediaDetails, MediaItem, SourceSecret, XtreamAccountInfo } from "../../shared/types";
import { hostLabel, normalizeUrl, sha1 } from "./hash";

type XtreamCategory = {
  category_id?: string;
  category_name?: string;
};

type XtreamLive = {
  name?: string;
  stream_id?: number | string;
  stream_icon?: string;
  category_id?: string;
  added?: string;
  tv_archive?: number | string;
  tv_archive_duration?: number | string;
};

type XtreamVod = {
  name?: string;
  stream_id?: number | string;
  stream_icon?: string;
  cover?: string;
  cover_big?: string;
  plot?: string;
  description?: string;
  category_id?: string;
  rating?: string;
  rating_5based?: string | number;
  added?: string;
  container_extension?: string;
};

type XtreamSeries = {
  name?: string;
  series_id?: number | string;
  cover?: string;
  plot?: string;
  category_id?: string;
  rating?: string;
  last_modified?: string;
};

type XtreamEpisode = {
  id?: string | number;
  title?: string;
  episode_num?: number;
  season?: number;
  container_extension?: string;
  info?: {
    movie_image?: string;
    cover_big?: string;
    plot?: string;
    duration_secs?: string | number;
    duration?: string;
  };
};

function query(secret: SourceSecret, action?: string, extra: Record<string, string | number> = {}) {
  const base = normalizeUrl(secret.baseUrl ?? "", true);
  const url = new URL("player_api.php", base);
  url.searchParams.set("username", secret.username ?? "");
  url.searchParams.set("password", secret.password ?? "");
  if (action) url.searchParams.set("action", action);
  Object.entries(extra).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

function streamBase(secret: SourceSecret) {
  return normalizeUrl(secret.baseUrl ?? "", true).replace(/\/$/, "");
}

function timestamp(raw?: string | number) {
  const value = Number(raw ?? 0);
  return Number.isFinite(value) ? value : 0;
}

async function json<T>(url: string, timeoutMs = 90000): Promise<T> {
  return window.moPlayer.net.json<T>({ url, timeoutMs });
}

type XtreamUserInfo = {
  auth?: number | string;
  status?: string;
  username?: string;
  exp_date?: string | number | null;
  is_trial?: string | number | boolean;
  active_cons?: string | number;
  max_connections?: string | number;
  created_at?: string | number;
  allowed_output_formats?: string[];
  message?: string;
};

type XtreamServerInfo = {
  url?: string;
  timezone?: string;
  allowed_output_formats?: string[];
};

type XtreamHandshakeResponse = {
  user_info?: XtreamUserInfo;
  server_info?: XtreamServerInfo;
  message?: string;
};

export type XtreamHandshake = {
  account: XtreamAccountInfo;
  liveExtension: "m3u8" | "ts";
};

function toNumber(raw: unknown) {
  const value = Number(raw ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function toBool(raw: unknown) {
  return raw === true || raw === 1 || raw === "1" || String(raw).toLowerCase() === "true";
}

function maskUsername(raw: string) {
  if (!raw) return "";
  if (raw.length <= 3) return `${raw[0] ?? ""}**`;
  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

function pickLiveExtension(formats: string[]): "m3u8" | "ts" {
  const normalized = formats.map((value) => String(value).trim().toLowerCase());
  if (normalized.some((value) => value === "m3u8" || value === "hls")) return "m3u8";
  if (normalized.some((value) => value === "ts" || value === "mpegts")) return "ts";
  return "m3u8";
}

export async function authenticateXtream(secret: SourceSecret): Promise<XtreamHandshake> {
  let response: XtreamHandshakeResponse;
  try {
    response = await json<XtreamHandshakeResponse>(query(secret), 30000);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Connection failed";
    throw new Error(`Could not reach the Xtream server. ${reason}`);
  }
  const user = response.user_info;
  if (!user || typeof user !== "object") {
    throw new Error("This address did not return Xtream account data. Check the server URL.");
  }
  const authed = user.auth === 1 || user.auth === "1" || String(user.auth).toLowerCase() === "true";
  if (!authed) {
    const status = String(user.status ?? "").trim();
    const serverMessage = String(user.message ?? response.message ?? "").trim();
    if (status && status.toLowerCase() !== "active") {
      throw new Error(`The provider rejected this account: ${status}.`);
    }
    throw new Error(serverMessage || "Invalid username or password for this Xtream server.");
  }
  const status = String(user.status ?? "Active");
  const formats = Array.isArray(user.allowed_output_formats)
    ? user.allowed_output_formats
    : Array.isArray(response.server_info?.allowed_output_formats)
      ? response.server_info.allowed_output_formats
      : [];
  const account: XtreamAccountInfo = {
    status,
    expDate: toNumber(user.exp_date),
    isTrial: toBool(user.is_trial),
    activeConnections: toNumber(user.active_cons),
    maxConnections: toNumber(user.max_connections),
    createdAt: toNumber(user.created_at),
    allowedOutputFormats: formats.map((value) => String(value)),
    serverTimezone: response.server_info?.timezone ?? "",
    serverMessage: String(response.message ?? "").trim(),
    usernameMasked: maskUsername(String(user.username ?? secret.username ?? "")),
  };
  if (account.expDate > 0 && account.expDate * 1000 < Date.now()) {
    throw new Error(`This Xtream account expired on ${new Date(account.expDate * 1000).toLocaleDateString()}.`);
  }
  if (status.toLowerCase() === "banned" || status.toLowerCase() === "disabled") {
    throw new Error(`The provider reports this account as ${status}.`);
  }
  return { account, liveExtension: pickLiveExtension(account.allowedOutputFormats) };
}

function categoryMap(rows: XtreamCategory[], sourceId: string, type: "live" | "movie" | "series") {
  const map = new Map<string, string>();
  const categories: Category[] = rows.map((row, index) => {
    const id = String(row.category_id ?? index);
    const name = String(row.category_name ?? "").trim() || (type === "live" ? "Live TV" : type === "movie" ? "Movies" : "Series");
    map.set(id, name);
    return {
      id,
      sourceId,
      type,
      name,
      count: 0,
    } satisfies Category;
  });
  return { map, categories };
}

export async function loadXtream(secret: SourceSecret, sourceId: string, liveExtension: "m3u8" | "ts" = "m3u8"): Promise<LibraryData> {
  const base = streamBase(secret);
  const [liveCatsRaw, movieCatsRaw, seriesCatsRaw, liveRows, vodRows, seriesRows] = await Promise.all([
    json<XtreamCategory[]>(query(secret, "get_live_categories")),
    json<XtreamCategory[]>(query(secret, "get_vod_categories")),
    json<XtreamCategory[]>(query(secret, "get_series_categories")),
    json<XtreamLive[]>(query(secret, "get_live_streams"), 120000),
    json<XtreamVod[]>(query(secret, "get_vod_streams"), 120000),
    json<XtreamSeries[]>(query(secret, "get_series"), 120000),
  ]);

  const liveCats = categoryMap(Array.isArray(liveCatsRaw) ? liveCatsRaw : [], sourceId, "live");
  const movieCats = categoryMap(Array.isArray(movieCatsRaw) ? movieCatsRaw : [], sourceId, "movie");
  const seriesCats = categoryMap(Array.isArray(seriesCatsRaw) ? seriesCatsRaw : [], sourceId, "series");
  const categories = [...liveCats.categories, ...movieCats.categories, ...seriesCats.categories];
  const categoryById = new Map(categories.map((item) => [item.id, item]));

  const live: MediaItem[] = (Array.isArray(liveRows) ? liveRows : []).map((row, index) => {
    const id = String(row.stream_id ?? index);
    const categoryId = String(row.category_id ?? "");
    const ext = liveExtension;
    categoryById.get(categoryId) && (categoryById.get(categoryId)!.count += 1);
    const archiveOn = row.tv_archive === 1 || row.tv_archive === "1";
    return {
      id: `live:${id}`,
      sourceId,
      type: "live",
      categoryId,
      categoryName: liveCats.map.get(categoryId) ?? "Live TV",
      title: String(row.name ?? "Live channel"),
      streamUrl: `${base}/live/${encodeURIComponent(secret.username ?? "")}/${encodeURIComponent(secret.password ?? "")}/${id}.${ext}`,
      posterUrl: row.stream_icon ?? "",
      addedAt: timestamp(row.added),
      tvArchiveDays: archiveOn ? Number(row.tv_archive_duration ?? 1) || 1 : 0,
    };
  });

  const movies: MediaItem[] = (Array.isArray(vodRows) ? vodRows : []).map((row, index) => {
    const id = String(row.stream_id ?? index);
    const categoryId = String(row.category_id ?? "");
    const ext = row.container_extension || "mp4";
    categoryById.get(categoryId) && (categoryById.get(categoryId)!.count += 1);
    return {
      id: `movie:${id}`,
      sourceId,
      type: "movie",
      categoryId,
      categoryName: movieCats.map.get(categoryId) ?? "Movies",
      title: String(row.name ?? "Movie"),
      streamUrl: `${base}/movie/${encodeURIComponent(secret.username ?? "")}/${encodeURIComponent(secret.password ?? "")}/${id}.${ext}`,
      posterUrl: row.stream_icon || row.cover || row.cover_big || "",
      description: row.plot || row.description || "",
      rating: String(row.rating ?? row.rating_5based ?? ""),
      addedAt: timestamp(row.added),
      containerExtension: ext,
    };
  });

  const series: MediaItem[] = (Array.isArray(seriesRows) ? seriesRows : []).map((row, index) => {
    const id = String(row.series_id ?? index);
    const categoryId = String(row.category_id ?? "");
    categoryById.get(categoryId) && (categoryById.get(categoryId)!.count += 1);
    return {
      id: `series:${id}`,
      sourceId,
      type: "series",
      categoryId,
      categoryName: seriesCats.map.get(categoryId) ?? "Series",
      title: String(row.name ?? "Series"),
      streamUrl: "",
      posterUrl: row.cover ?? "",
      description: row.plot ?? "",
      rating: row.rating ?? "",
      addedAt: timestamp(row.last_modified),
      seriesId: id,
    };
  });

  const fallbackCategoryIds = new Set(categories.map((item) => item.id));
  for (const item of [...live, ...movies, ...series]) {
    if (!fallbackCategoryIds.has(item.categoryId)) {
      const category: Category = {
        id: item.categoryId || `${item.type}:default`,
        sourceId,
        type: item.type,
        name: item.categoryName,
        count: 1,
      };
      categories.push(category);
      fallbackCategoryIds.add(category.id);
    }
  }

  return {
    sourceId,
    sourceName: secret.name || hostLabel(secret.baseUrl ?? ""),
    syncedAt: new Date().toISOString(),
    categories,
    media: [...live, ...movies, ...series],
  };
}

type XtreamInfoBlock = {
  plot?: string;
  description?: string;
  rating?: string | number;
  rating_5based?: string | number;
  genre?: string;
  duration_secs?: string | number;
  episode_run_time?: string | number;
  duration?: string;
  director?: string;
  cast?: string;
  actors?: string;
  releasedate?: string;
  release_date?: string;
  movie_image?: string;
  cover?: string;
  cover_big?: string;
  backdrop_path?: string[] | string;
  youtube_trailer?: string;
};

function firstBackdrop(raw?: string[] | string) {
  if (Array.isArray(raw)) return raw.find((value) => /^https?:\/\//i.test(String(value))) ?? "";
  return /^https?:\/\//i.test(String(raw ?? "")) ? String(raw) : "";
}

function parseDetails(info: XtreamInfoBlock | undefined): MediaDetails {
  if (!info || typeof info !== "object") return {};
  const rating = String(info.rating ?? info.rating_5based ?? "").trim();
  const durationSecs = Number(info.duration_secs ?? 0)
    || (Number(info.episode_run_time ?? 0) ? Number(info.episode_run_time) * 60 : 0);
  return {
    plot: String(info.plot ?? info.description ?? "").trim(),
    rating: rating === "0" ? "" : rating,
    genre: String(info.genre ?? "").trim(),
    durationSecs,
    director: String(info.director ?? "").trim(),
    cast: String(info.cast ?? info.actors ?? "").trim(),
    releaseDate: String(info.releasedate ?? info.release_date ?? "").trim(),
    posterUrl: String(info.movie_image ?? info.cover_big ?? info.cover ?? "").trim(),
    backdropUrl: firstBackdrop(info.backdrop_path),
    youtubeTrailer: String(info.youtube_trailer ?? "").trim(),
  };
}

export type EpgEntry = {
  title: string;
  description: string;
  start: number;
  end: number;
  nowPlaying: boolean;
};

function decodeEpgText(raw: unknown) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return value;
  }
}

type XtreamEpgRow = {
  title?: string;
  description?: string;
  start_timestamp?: string | number;
  stop_timestamp?: string | number;
  now_playing?: number | string;
};

/** Now/next programme guide for one live channel via get_short_epg. */
export async function loadShortEpg(secret: SourceSecret, item: MediaItem, limit = 6): Promise<EpgEntry[]> {
  const streamId = item.id.replace(/^live:/, "");
  const response = await json<{ epg_listings?: XtreamEpgRow[] }>(
    query(secret, "get_short_epg", { stream_id: streamId, limit }),
    20000,
  );
  const nowSecs = Date.now() / 1000;
  return (Array.isArray(response.epg_listings) ? response.epg_listings : [])
    .map((row) => {
      const start = Number(row.start_timestamp ?? 0);
      const end = Number(row.stop_timestamp ?? 0);
      return {
        title: decodeEpgText(row.title),
        description: decodeEpgText(row.description),
        start,
        end,
        nowPlaying: row.now_playing === 1 || row.now_playing === "1" || (start <= nowSecs && nowSecs < end),
      };
    })
    .filter((entry) => entry.title);
}

/** On-demand movie metadata (plot, rating, cast...) from get_vod_info. */
export async function loadXtreamVodInfo(secret: SourceSecret, item: MediaItem): Promise<MediaDetails> {
  const vodId = item.id.replace(/^movie:/, "");
  const response = await json<{ info?: XtreamInfoBlock }>(query(secret, "get_vod_info", { vod_id: vodId }), 30000);
  return parseDetails(response.info);
}

export type SeriesBundle = {
  details: MediaDetails;
  episodes: MediaItem[];
};

export async function loadXtreamEpisodes(secret: SourceSecret, sourceId: string, series: MediaItem): Promise<SeriesBundle> {
  const base = streamBase(secret);
  const seriesId = series.seriesId || series.id.replace(/^series:/, "");
  const response = await json<{ info?: XtreamInfoBlock; episodes?: Record<string, XtreamEpisode[]> }>(
    query(secret, "get_series_info", { series_id: seriesId }),
    90000,
  );
  const details = parseDetails(response.info);
  const episodes = Object.entries(response.episodes ?? {}).flatMap(([season, rows]) =>
    rows.map((row, index) => {
      const episodeId = String(row.id ?? `${seriesId}-${season}-${index}`);
      const ext = row.container_extension || "mp4";
      return {
        id: `episode:${episodeId}`,
        sourceId,
        type: "episode" as const,
        categoryId: series.categoryId,
        categoryName: series.categoryName,
        title: row.title || `Episode ${row.episode_num || index + 1}`,
        streamUrl: `${base}/series/${encodeURIComponent(secret.username ?? "")}/${encodeURIComponent(secret.password ?? "")}/${episodeId}.${ext}`,
        posterUrl: row.info?.movie_image || row.info?.cover_big || series.posterUrl,
        description: row.info?.plot || series.description,
        durationSecs: Number(row.info?.duration_secs ?? 0) || 0,
        seriesId,
        seasonNumber: Number(row.season ?? season) || 1,
        episodeNumber: Number(row.episode_num ?? index + 1),
        containerExtension: ext,
      };
    }),
  );
  const resolved = await Promise.all(
    episodes.map(async (episode) => ({
      ...episode,
      id: episode.id || `episode:${await sha1(`${seriesId}:${episode.seasonNumber}:${episode.episodeNumber}`)}`,
    })),
  );
  resolved.sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0));
  return { details, episodes: resolved };
}

/**
 * Catch-up (timeshift) URL for an archived programme:
 * {base}/timeshift/{user}/{pass}/{durationMinutes}/{YYYY-MM-DD:HH-MM}/{streamId}.ts
 */
export function buildTimeshiftUrl(secret: SourceSecret, channel: MediaItem, startUnixSecs: number, durationSecs: number) {
  const base = streamBase(secret);
  const id = channel.id.replace(/^live:/, "");
  const start = new Date(startUnixSecs * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}:${pad(start.getHours())}-${pad(start.getMinutes())}`;
  const minutes = Math.max(1, Math.round(durationSecs / 60));
  return `${base}/timeshift/${encodeURIComponent(secret.username ?? "")}/${encodeURIComponent(secret.password ?? "")}/${minutes}/${stamp}/${id}.ts`;
}

export function extractXtreamFromM3uUrl(raw: string): SourceSecret | null {
  try {
    const url = new URL(raw);
    const username = url.searchParams.get("username") ?? "";
    const password = url.searchParams.get("password") ?? "";
    if (!username || !password || !url.pathname.toLowerCase().includes("get.php")) return null;
    return {
      kind: "xtream",
      name: hostLabel(raw),
      baseUrl: `${url.protocol}//${url.host}/`,
      username,
      password,
      playlistUrl: raw,
    };
  } catch {
    return null;
  }
}
