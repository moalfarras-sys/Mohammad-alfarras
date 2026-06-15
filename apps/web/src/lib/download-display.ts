import type { Locale } from "@/types/cms";

export type DownloadStatsView = {
  value: number;
  total?: number;
  since?: string;
  updatedAt?: string;
};

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
