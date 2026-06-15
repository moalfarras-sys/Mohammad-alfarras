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

function countId(slug: string, platform?: string | null) {
  return platform && platform.toLowerCase() === "windows" ? `${slug}:windows` : slug;
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

export async function recordDownload(slug: string, platform?: string | null): Promise<void> {
  try {
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
  } catch {
    // Counting must never affect the download.
  }
}

export async function readDownloadCounts(): Promise<DownloadCounts> {
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
