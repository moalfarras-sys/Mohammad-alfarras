import type { Locale } from "@/types/cms";

export function getNumericLocale(locale: Locale) {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getNumericLocale(locale), options).format(value);
}

export function formatMonthYear(locale: Locale, value: string | Date) {
  return new Intl.DateTimeFormat(getNumericLocale(locale), {
    month: "short",
    year: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
}
