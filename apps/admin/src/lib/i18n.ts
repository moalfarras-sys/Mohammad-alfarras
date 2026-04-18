export type Locale = "ar" | "en";

export const locales: Locale[] = ["ar", "en"];
export const defaultLocale: Locale = "ar";

export const localeMeta: Record<Locale, { dir: "rtl" | "ltr"; label: string; flag: string }> = {
  ar: { dir: "rtl", label: "العربية", flag: "🇸🇾" },
  en: { dir: "ltr", label: "English", flag: "🇬🇧" },
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
