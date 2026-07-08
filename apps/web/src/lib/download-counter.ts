import { createHash } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/client";

/**
 * Lightweight per-app download counter stored in the `download_counts`
 * site setting: { counts: { [id]: number }, total, since, updatedAt }.
 *
 * Designed to NEVER break a download: every call is wrapped in try/catch and
 * is meant to run via `after()` (post-response), so it never blocks the
 * redirect that serves the binary.
 */

const SETTING_KEY = "download_counts";

export type DownloadCounts = {
  counts: Record<string, number>;
  total: number;
  since?: string;
  updatedAt?: string;
};

export type PublicDownloadStats = {
  value: number;
  total: number;
  since?: string;
  updatedAt?: string;
};

export type DownloadEventInput = {
  releaseSlug?: string | null;
  assetId?: string | null;
  fileName?: string | null;
  targetUrl?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  ip?: string | null;
  country?: string | null;
  metadata?: Record<string, unknown>;
};

type DownloadCountRow = {
  product_slug?: string | null;
  platform?: string | null;
  downloads?: number | string | null;
  since?: string | null;
  updated_at?: string | null;
};

function countId(slug: string, platform?: string | null) {
  return platform && platform.toLowerCase() === "windows" ? `${slug}:windows` : slug;
}

function normalizePlatform(platform?: string | null) {
  return platform && platform.toLowerCase() === "windows" ? "windows" : "android";
}

function stableIpHash(ip?: string | null) {
  const value = ip?.trim();
  if (!value) return null;
  const salt = process.env.DOWNLOAD_EVENT_SALT || process.env.ADMIN_SESSION_SECRET || "moalfarras-download";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function downloadCountFor(counts: DownloadCounts, slug: string, platform?: string | null): number {
  return Math.max(0, Number(counts.counts[countId(slug, platform)]) || 0);
}

export function publicDownloadStats(counts: DownloadCounts, slug: string, platform?: string | null): PublicDownloadStats {
  return {
    value: downloadCountFor(counts, slug, platform),
    total: Math.max(0, Number(counts.total) || 0),
    since: counts.since,
    updatedAt: counts.updatedAt,
  };
}

async function recordDownloadEvent(slug: string, platform: string, event?: DownloadEventInput): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from("app_download_events").insert({
    product_slug: slug,
    platform,
    release_slug: event?.releaseSlug || null,
    asset_id: event?.assetId || null,
    file_name: event?.fileName || null,
    target_url: event?.targetUrl || null,
    user_agent: event?.userAgent?.slice(0, 500) || null,
    referer: event?.referer?.slice(0, 500) || null,
    ip_hash: stableIpHash(event?.ip),
    country: event?.country?.slice(0, 20) || null,
    metadata: event?.metadata ?? {},
  });
}

async function recordAnalyticsDownloadEvent(slug: string, platform: string, event?: DownloadEventInput): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from("analytics_events").insert({
    event_name: "app_download",
    event_payload: {
      product_slug: slug,
      platform,
      release_slug: event?.releaseSlug || null,
      asset_id: event?.assetId || null,
      file_name: event?.fileName || null,
      target_url: event?.targetUrl || null,
      referer: event?.referer?.slice(0, 500) || null,
      user_agent: event?.userAgent?.slice(0, 500) || null,
      ip_hash: stableIpHash(event?.ip),
      country: event?.country?.slice(0, 20) || null,
      metadata: event?.metadata ?? {},
    },
  });
}

async function updateLegacyAggregate(slug: string, platform?: string | null): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("site_settings").select("value_json").eq("key", SETTING_KEY).maybeSingle();
  const current = (data?.value_json && typeof data.value_json === "object" ? data.value_json : {}) as Partial<DownloadCounts>;
  const counts: Record<string, number> = current.counts && typeof current.counts === "object" ? { ...current.counts } : {};
  const id = countId(slug, platform);
  counts[id] = (Number(counts[id]) || 0) + 1;
  const value: DownloadCounts = {
    counts,
    total: (Number(current.total) || 0) + 1,
    since: typeof current.since === "string" ? current.since : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await supabase.from("site_settings").upsert({ key: SETTING_KEY, value_json: value }, { onConflict: "key" });
}

export function downloadEventFromRequest(
  request: Request,
  event?: Omit<DownloadEventInput, "userAgent" | "referer" | "ip" | "country">,
): DownloadEventInput {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ...event,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
    ip: forwardedFor || request.headers.get("x-real-ip"),
    country: request.headers.get("x-vercel-ip-country"),
  };
}

const botUserAgent =
  /bot|crawl|spider|slurp|curl\/|wget\/|python-requests|httpx\/|axios\/|headless|monitor|uptime|pingdom|facebookexternalhit|preview/i;

/**
 * The counter should reflect real user downloads, not router prefetches,
 * HEAD-style probes, or crawler hits on the redirect endpoint.
 */
export function shouldCountDownload(request: Request): boolean {
  if (request.method !== "GET") return false;
  if (request.headers.get("next-router-prefetch") || request.headers.get("x-middleware-prefetch")) return false;
  const purpose = request.headers.get("purpose") || request.headers.get("sec-purpose") || "";
  if (purpose.includes("prefetch")) return false;
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || botUserAgent.test(userAgent)) return false;
  return true;
}

export async function recordDownload(slug: string, platform?: string | null, event?: DownloadEventInput): Promise<void> {
  const normalizedPlatform = normalizePlatform(platform);
  try {
    await recordDownloadEvent(slug, normalizedPlatform, event);
  } catch {
    // Event tracking is best-effort until every environment has the migration.
  }

  try {
    await recordAnalyticsDownloadEvent(slug, normalizedPlatform, event);
  } catch {
    // Analytics events are also best-effort and must never affect downloads.
  }

  try {
    await updateLegacyAggregate(slug, platform);
  } catch {
    // Counting must never affect the download.
  }
}

async function readDownloadCountsView(): Promise<DownloadCounts | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("app_download_counts").select("*");
  if (error || !data?.length) return null;

  const counts: Record<string, number> = {};
  let total = 0;
  let since: string | undefined;
  let updatedAt: string | undefined;
  for (const row of data as DownloadCountRow[]) {
    const slug = String(row.product_slug ?? "").trim();
    if (!slug) continue;
    const platform = normalizePlatform(row.platform);
    const id = countId(slug, platform);
    const value = Math.max(0, Number(row.downloads) || 0);
    counts[id] = value;
    total += value;
    if (row.since && (!since || new Date(row.since).getTime() < new Date(since).getTime())) since = row.since;
    if (row.updated_at && (!updatedAt || new Date(row.updated_at).getTime() > new Date(updatedAt).getTime())) {
      updatedAt = row.updated_at;
    }
  }

  return { counts, total, since, updatedAt };
}

export async function readDownloadCounts(): Promise<DownloadCounts> {
  try {
    const trackedCounts = await readDownloadCountsView();
    if (trackedCounts) return trackedCounts;
  } catch {
    // Fall back to the legacy aggregate below.
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("site_settings").select("value_json").eq("key", SETTING_KEY).maybeSingle();
    const v = (data?.value_json && typeof data.value_json === "object" ? data.value_json : {}) as Partial<DownloadCounts>;
    return {
      counts: v.counts && typeof v.counts === "object" ? v.counts : {},
      total: Number(v.total) || 0,
      since: typeof v.since === "string" ? v.since : undefined,
      updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : undefined,
    };
  } catch {
    return { counts: {}, total: 0 };
  }
}

/** Best-effort product slug from a release slug like "moplayer-v2-1-0". */
export function productFromReleaseSlug(slug: string): string {
  const s = slug.toLowerCase();
  return s.includes("moplayer2") || s.includes("pro") ? "moplayer2" : "moplayer";
}
