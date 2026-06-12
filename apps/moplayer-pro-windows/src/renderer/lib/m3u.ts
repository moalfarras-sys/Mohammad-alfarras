import type { Category, ContentType, LibraryData, MediaItem, SourceSecret } from "../../shared/types";
import { sha1 } from "./hash";

type ExtInfo = {
  title: string;
  tvgId: string;
  logo: string;
  group: string;
  description: string;
  rating: string;
  genre: string;
  durationSecs: number;
};

const attributeRegex = /([A-Za-z0-9_-]+)=["']([^"']*)["']/g;
const seriesPatterns = [
  /(.*?)\s*[-_. ]?\s*(?:s|season|موسم|الموسم)\s*([0-9]+)\s*[-_. ]?\s*(?:e|ep|episode|حلقة|الحلقة)\s*([0-9]+)/i,
  /(.*?)\s+([0-9]{1,2})x([0-9]{1,3})\b/i,
  /(.*?)\s+(?:episode|ep|حلقة|الحلقة)\s*([0-9]{1,3})\b/i,
];
const seriesTokens = ["series", "serie", "tv show", "مسلسل", "مسلسلات"];
const movieTokens = ["movie", "movies", "vod", "film", "films", "cinema", "فيلم", "افلام", "أفلام", "سينما"];

function parseAttributes(line: string) {
  const attrs: Record<string, string> = {};
  for (const match of line.matchAll(attributeRegex)) {
    attrs[match[1].toLowerCase()] = match[2];
  }
  return attrs;
}

function first(attrs: Record<string, string>, keys: string[]) {
  return keys.map((key) => attrs[key.toLowerCase()]?.trim()).find(Boolean) ?? "";
}

function parseDuration(raw: string) {
  const value = raw.trim();
  if (!value) return 0;
  const direct = Number(value);
  if (Number.isFinite(direct)) return direct;
  const parts = value.split(":").map((part) => Number(part)).filter(Number.isFinite);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseInfo(line: string): ExtInfo {
  const attrs = parseAttributes(line);
  const title = line.split(",").pop()?.trim() || attrs["tvg-name"] || "Untitled";
  return {
    title,
    tvgId: attrs["tvg-id"] ?? "",
    logo: attrs["tvg-logo"] ?? "",
    group: attrs["group-title"] ?? "",
    description: first(attrs, ["description", "desc", "plot", "overview", "tvg-description"]),
    rating: first(attrs, ["rating", "tvg-rating", "imdb-rating"]),
    genre: first(attrs, ["genre", "tvg-genre"]),
    durationSecs: parseDuration(first(attrs, ["duration", "runtime", "length"])),
  };
}

function inferType(info: ExtInfo, url: string): "live" | "movie" | "series" {
  const path = url.toLowerCase();
  const group = info.group.toLowerCase();
  const title = info.title.toLowerCase();
  if (path.includes("/series/") || seriesTokens.some((token) => group.includes(token)) || seriesPatterns.some((pattern) => pattern.test(info.title))) {
    return "series";
  }
  if (path.includes("/movie/") || path.includes("/vod/") || movieTokens.some((token) => group.includes(token) || title.includes(token))) {
    return "movie";
  }
  return "live";
}

export async function parseM3u(source: SourceSecret, playlistText: string, sourceId: string): Promise<LibraryData> {
  const categories = new Map<string, Category>();
  const media: MediaItem[] = [];
  const seriesParents = new Map<string, MediaItem>();
  let pending: ExtInfo | null = null;

  for (const rawLine of playlistText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF", 0)) {
      pending = parseInfo(line);
      continue;
    }
    if (line.startsWith("#")) continue;
    if (!pending) continue;

    let type: ContentType = inferType(pending, line);
    const categoryName = pending.group || (type === "live" ? "Live TV" : type === "movie" ? "Movies" : "Series");
    const categoryId = await sha1(`${type}:${categoryName}`);
    if (!categories.has(categoryId)) {
      categories.set(categoryId, {
        id: categoryId,
        sourceId,
        type,
        name: categoryName,
        count: 0,
      });
    }

    let title = pending.title || line.split("/").pop() || "Untitled";
    let seriesId = "";
    let seasonNumber = 0;
    let episodeNumber = 0;

    if (type === "series") {
      const match = seriesPatterns.map((pattern) => pattern.exec(title)).find(Boolean);
      if (match) {
        const cleanName = match[1]?.trim() || categoryName || "Series";
        seasonNumber = match.length >= 4 ? Number(match[2]) || 1 : 1;
        episodeNumber = match.length >= 4 ? Number(match[3]) || 0 : Number(match[2]) || 0;
        seriesId = await sha1(`series:${cleanName}`);
        if (!seriesParents.has(seriesId)) {
          const parent: MediaItem = {
            id: seriesId,
            sourceId,
            type: "series",
            categoryId,
            categoryName,
            title: cleanName,
            streamUrl: "",
            posterUrl: pending.logo,
            description: pending.description || `Series ${cleanName}`,
            rating: pending.rating,
            seriesId,
          };
          seriesParents.set(seriesId, parent);
          media.push(parent);
        }
        type = "episode";
        title = episodeNumber ? `Episode ${episodeNumber}` : pending.title;
      }
    }

    const item: MediaItem = {
      id: await sha1(`${pending.tvgId}:${pending.title}:${line}`),
      sourceId,
      type,
      categoryId,
      categoryName,
      title,
      streamUrl: line,
      posterUrl: pending.logo,
      description: pending.description || title,
      rating: pending.rating,
      durationSecs: pending.durationSecs,
      seriesId,
      seasonNumber,
      episodeNumber,
    };
    media.push(item);
    const category = categories.get(categoryId);
    if (category) category.count += 1;
    pending = null;
  }

  return {
    sourceId,
    sourceName: source.name,
    syncedAt: new Date().toISOString(),
    categories: [...categories.values()],
    media,
  };
}
