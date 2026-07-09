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

type CacheMode = "hit" | "miss" | "soft" | "none";

// Strip release-quality noise (4K/FHD/CAM/x265/…) and separators so searches and cache keys
// reflect the actual title, not the panel's file naming.
function cleanTitle(value: string): string {
  return value
    .replace(
      /\b(4k|8k|2160p|1080p|720p|480p|fhd|uhd|hdr|hd|sd|cam|camrip|hdcam|web-?dl|web-?rip|bluray|blu-ray|brrip|hdrip|dvdrip|x264|x265|h\.?264|h\.?265|hevc|10bit|vip)\b/gi,
      " ",
    )
    .replace(/[[\](){}<>|_+•·]+/g, " ")
    .replace(/\s*[-–—:]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Unicode-aware: keeps Arabic (and every other script). The previous [^a-z0-9] version stripped
// non-Latin titles to "" — so EVERY Arabic movie collapsed onto ONE cache key and the first
// resolved trailer was served for all of them (the "same trailer everywhere" bug).
function normalizeTitle(value: string): string {
  return cleanTitle(value)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cacheKey(title: string, type: string, year: string): string {
  const normalized = normalizeTitle(title);
  // Never allow an empty key segment — hash the raw title instead of letting titles collide.
  const safe = normalized || `raw-${Buffer.from(title, "utf8").toString("base64url").slice(0, 48)}`;
  return `yt:trailer:${type}:${safe}${year ? `:${year}` : ""}`;
}

function trailerResponse(body: unknown, cache: CacheMode) {
  const res = NextResponse.json(body, { status: 200 });
  if (cache === "hit") {
    // CDN keeps hits for a month (purged automatically on every deploy), but DEVICES only for an
    // hour — so a bad cached mapping can always be flushed server-side without waiting on clients.
    res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=2592000, stale-while-revalidate=604800");
  } else if (cache === "miss") {
    // "No trailer exists yet" — re-check daily so a later-published trailer can surface.
    res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
  } else if (cache === "soft") {
    // Transient failure (quota exhausted, YouTube 5xx): cache BRIEFLY so a fleet of devices
    // dwelling every ~2s stops hammering the API during an outage, yet recovery is minutes away.
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=180, stale-while-revalidate=120");
  } else {
    // Config errors (no title/key) — never cache.
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

// While this flag exists (set on a YouTube 429/403), skip searches entirely instead of burning
// the daily budget and latency on calls that are guaranteed to fail.
const QUOTA_COOLDOWN_KEY = "yt:trailer:quota-cooldown";
const QUOTA_COOLDOWN_SECONDS = 900;

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

  // During a quota outage every search is a guaranteed failure — short-circuit until the
  // cooldown flag expires so devices stop burning budget/latency for nothing.
  try {
    const coolingDown = await readDeviceSetting<{ down: boolean }>(QUOTA_COOLDOWN_KEY);
    if (coolingDown?.down) {
      return trailerResponse({ videoId: null, reason: "quota_cooldown" }, "soft");
    }
  } catch {
    // Flag unreadable — proceed with the normal path.
  }

  // Global daily budget check BEFORE spending a 100-unit search. null => Upstash absent, no cap.
  const budgetKey = `yt:trailer:budget:${new Date().toISOString().slice(0, 10)}`;
  const used = await incrementDailyCounter(budgetKey, MISS_TTL_SECONDS);
  if (used !== null && used > DAILY_SEARCH_BUDGET) {
    return trailerResponse({ videoId: null, reason: "budget" }, "soft");
  }

  // Search with the CLEANED title (quality junk hurts relevance) and language-matched terms —
  // Arabic titles find their trailers under "اعلان/تريلر", not "official trailer".
  const cleaned = cleanTitle(title) || title;
  const arabic = /[؀-ۿ]/.test(cleaned);
  const kind = type === "series" ? (arabic ? "مسلسل" : "tv series") : (arabic ? "فيلم" : "movie");
  const trailerTerm = arabic ? "اعلان تريلر" : "official trailer";
  const query = `${cleaned} ${kind} ${trailerTerm}${year ? ` ${year}` : ""}`;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
        `part=id&type=video&videoEmbeddable=true&maxResults=3&safeSearch=strict&` +
        `q=${encodeURIComponent(query)}&key=${encodeURIComponent(API_KEY)}`,
      // Only reached on an Upstash-cache miss; revalidate at the miss cadence so a re-check actually
      // re-queries YouTube instead of re-reading a 30-day-stale empty Data Cache entry.
      { next: { revalidate: MISS_TTL_SECONDS } },
    );
    if (!res.ok) {
      // Quota exhaustion (429, or 403 quotaExceeded): raise the cooldown flag so the next
      // ~15 minutes of requests skip the API instead of hammering a guaranteed failure.
      if (res.status === 429 || res.status === 403) {
        try {
          await writeDeviceSetting(
            QUOTA_COOLDOWN_KEY,
            { down: true },
            { ttlSeconds: QUOTA_COOLDOWN_SECONDS, description: "YouTube search quota cooldown." },
          );
        } catch {
          // Best effort — the soft cache still throttles.
        }
      }
      return trailerResponse({ videoId: null, reason: "search_failed" }, "soft");
    }
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
