import type { Locale } from "@/types/cms";

export const locales: Locale[] = ["ar", "en"];
export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { dir: "rtl" | "ltr"; label: string; flag: string }> = {
  ar: { dir: "rtl", label: "العربية", flag: "🇸🇾" },
  en: { dir: "ltr", label: "English", flag: "🇬🇧" },
};

export const sitePages = ["", "cv", "blog", "projects", "youtube", "contact", "privacy"] as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function withLocale(locale: Locale, slug: string): string {
  if (!slug || slug === "/") {
    return `/${locale}`;
  }
  return `/${locale}/${slug.replace(/^\//, "")}`;
}

/** Same path, opposite locale (e.g. `/ar/blog` → `/en/blog`). */
export function alternateLocalePath(pathname: string, currentLocale: Locale): string {
  const nextLocale: Locale = currentLocale === "ar" ? "en" : "ar";
  const tail = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  if (tail === "/") {
    return `/${nextLocale}`;
  }
  return `/${nextLocale}${tail}`;
}
