import type { Locale } from "@/types/cms";

export type DownloadStatsView = {
  value: number;
  total?: number;
  since?: string;
  updatedAt?: string;
  /** False when the counter store could not be read. */
  available?: boolean;
};

/**
 * Public pages only show a download counter when it is a real, positive number.
 * An unreachable counter store or a zero count hides the counter instead of
 * advertising "0 downloads".
 */
export function hasPublicDownloadCount(stats: DownloadStatsView | null | undefined): stats is DownloadStatsView {
  return Boolean(stats && stats.available !== false && Math.round(Number(stats.value) || 0) > 0);
}

export function formatDownloadNumber(value: number | undefined, locale: Locale): string {
  const normalized = Math.max(0, Math.round(Number(value) || 0));
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US").format(normalized);
}

export function downloadSinceLabel(stats: DownloadStatsView | undefined, locale: Locale): string {
  if (!stats?.since) return locale === "ar" ? "منذ أول تحميل مسجّل" : "Since the first recorded download";
  const date = new Date(stats.since);
  if (Number.isNaN(date.getTime())) return locale === "ar" ? "منذ أول تحميل مسجّل" : "Since the first recorded download";
  return locale === "ar"
    ? `منذ ${date.toLocaleDateString("ar", { year: "numeric", month: "short" })}`
    : `Since ${date.toLocaleDateString("en-US", { year: "numeric", month: "short" })}`;
}
