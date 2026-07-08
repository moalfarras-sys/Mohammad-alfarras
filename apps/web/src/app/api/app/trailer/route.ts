import { NextResponse } from "next/server";

import { incrementDailyCounter, readDeviceSetting, writeDeviceSetting } from "@/lib/activation-store";
import { rateLimit } from "@/lib/request-guard";

// A resolved title -> YouTube trailer id is effectively immutable, so cache hits hard. Genuine
// "no trailer found" misses re-check daily; transient failures are never cached (see cacheHeader).
const API_KEY = process.env.YOUTUBE_API_KEY;
const HIT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MISS_TTL_SECONDS = 60 * 60 * 24; // 1 day
// Global daily cap on paid search.list calls (100 quota units each; default quota 10k/day). Keeps a
// spike or abuse from exhausting the quota and dark-caching every title. Tunable.
const DAILY_SEARCH_BUDGET = 90;

type CacheMode = "hit" | "miss" | "none";

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cacheKey(title: string, type: string, year: string): string {
  return `yt:trailer:${type}:${normalizeTitle(title)}${year ? `:${year}` : ""}`;
}

function trailerResponse(body: unknown, cache: CacheMode) {
  const res = NextResponse.json(body, { status: 200 });
  if (cache === "hit") {
    // A real title -> id mapping is stable; let the CDN + client hold it for a long time.
    res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800");
  } else if (cache === "miss") {
    // "No trailer exists yet" — re-check daily so a later-published trailer can surface.
    res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
  } else {
    // Transient / soft-fail — never cache, so a momentary failure can't dark a title for weeks.
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

/**
 * GET /api/app/trailer?title=&type=movie|series&year=&product=
 *
 * Resolves the first embeddable YouTube result for a title so the app can autoplay it inline in the
 * preview pane. The YouTube API key never leaves the server, results are cached (Upstash, with a
 * Supabase fallback) to protect the daily search quota, and every path soft-fails to
 * `{ videoId: null }` so the device never sees an error — it just skips the trailer.
 */
export async function GET(request: Request) {
  const limited = await rateLimit({ request, bucket: "app-trailer", limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const params = new URL(request.url).searchParams;
  const title = (params.get("title") ?? "").trim().slice(0, 120);
  const typeRaw = (params.get("type") ?? "movie").trim().toLowerCase();
  const type = typeRaw === "series" ? "series" : "movie";
  const year = (params.get("year") ?? "").replace(/[^0-9]/g, "").slice(0, 4);

  if (!title) return trailerResponse({ videoId: null, reason: "missing_title" }, "none");
  if (!API_KEY) return trailerResponse({ videoId: null, reason: "not_configured" }, "none");

  const key = cacheKey(title, type, year);

  try {
    const cached = await readDeviceSetting<{ videoId: string | null }>(key);
    if (cached && typeof cached.videoId !== "undefined") {
      return trailerResponse({ videoId: cached.videoId, cached: true }, cached.videoId ? "hit" : "miss");
    }
  } catch {
    // A cache read failure just means we fall through to a live search.
  }

  // Global daily budget check BEFORE spending a 100-unit search. null => Upstash absent, no cap.
  const budgetKey = `yt:trailer:budget:${new Date().toISOString().slice(0, 10)}`;
  const used = await incrementDailyCounter(budgetKey, MISS_TTL_SECONDS);
  if (used !== null && used > DAILY_SEARCH_BUDGET) {
    return trailerResponse({ videoId: null, reason: "budget" }, "none");
  }

  const kind = type === "series" ? "tv series" : "movie";
  const query = `${title} ${kind} official trailer${year ? ` ${year}` : ""}`;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=id&type=video&videoEmbeddable=true&maxResults=3&safeSearch=strict&` +
        `q=${encodeURIComponent(query)}&key=${encodeURIComponent(API_KEY)}`,
      // Only reached on an Upstash-cache miss; revalidate at the miss cadence so a re-check actually
      // re-queries YouTube instead of re-reading a 30-day-stale empty Data Cache entry.
      { next: { revalidate: MISS_TTL_SECONDS } },
    );
    if (!res.ok) return trailerResponse({ videoId: null, reason: "search_failed" }, "none");
    const data = (await res.json()) as { items?: Array<{ id?: { videoId?: string } }> };
    const videoId = data.items?.find((item) => item.id?.videoId)?.id?.videoId ?? null;

    try {
      await writeDeviceSetting(
        key,
        { videoId },
        { ttlSeconds: videoId ? HIT_TTL_SECONDS : MISS_TTL_SECONDS, description: "Cached YouTube trailer lookup." },
      );
    } catch {
      // Best-effort cache write; the lookup still succeeds without it.
    }

    return trailerResponse({ videoId }, videoId ? "hit" : "miss");
  } catch {
    return trailerResponse({ videoId: null, reason: "error" }, "none");
  }
}
