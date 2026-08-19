import { join } from "node:path";

import type { Metadata } from "next";

import { seoData } from "@/content/seo-data";
import type { Locale } from "@/types/cms";

const BASE_URL = "https://moalfarras.space";
const BRAND = "Mohammad Alfarras";

/** Open Graph and Twitter titles include the brand; document titles use the root template. */
function brandedTitle(title: string): string {
  return `${title} | ${BRAND}`;
}

export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const normalized = slug === "projects" ? "work" : (slug || "home");
  const localizedPath = normalized === "home" ? `/${locale}` : `/${locale}/${normalized}`;
  const altAr = normalized === "home" ? "/ar" : `/ar/${normalized}`;
  const altEn = normalized === "home" ? "/en" : `/en/${normalized}`;
  const localizedSeo = seoData[locale] as Record<string, (typeof seoData.en)["home"]>;
  const copy = localizedSeo[normalized] ?? localizedSeo.home;
  const localeTag = locale === "ar" ? "ar_SA" : "en_US";
  const altLocaleTag = locale === "ar" ? "en_US" : "ar_SA";

  // One resolved title shared across <title>, og:title, and twitter:title so the
  // page never shows three different titles (and never a doubled brand).
  const resolvedTitle = brandedTitle(copy.title);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}${localizedPath}`,
      languages: {
        ar: `${BASE_URL}${altAr}`,
        en: `${BASE_URL}${altEn}`,
        "x-default": `${BASE_URL}${altAr}`,
      },
    },
    openGraph: {
      type: "website",
      locale: localeTag,
      alternateLocale: [altLocaleTag],
      url: `${BASE_URL}${localizedPath}`,
      title: resolvedTitle,
      description: copy.description,
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [{ ...(await socialImage(copy.image)), alt: resolvedTitle }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: resolvedTitle,
      description: copy.description,
      images: [{ ...(await socialImage(copy.image)), alt: resolvedTitle }],
    },
  };
}

/** The site's generated share card — a real 1200×630 PNG. */
const GENERATED_CARD = { url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 };
const socialImageCache = new Map<string, { url: string; width: number; height: number }>();

/**
 * Resolve a page image into a share card that is actually shaped like one.
 *
 * Every page used to declare 1200×630 regardless of the real file, so a
 * portrait photo (843×1264) was handed to Facebook and LinkedIn inside a
 * 1.91:1 box and got cropped through the subject's face. Dimensions are now
 * measured from the file, and anything not landscape enough falls back to the
 * generated branded card instead of being cropped.
 */
async function socialImage(path: string) {
  if (/^https?:\/\//i.test(path)) return { url: path, width: 1200, height: 630 };
  const cached = socialImageCache.get(path);
  if (cached) return cached;

  let resolved = GENERATED_CARD;
  try {
    const { default: sharp } = await import("sharp");
    const filePath = join(process.cwd(), "public", path.replace(/^\//, ""));
    const { width, height } = await sharp(filePath).metadata();
    if (width && height) {
      const ratio = width / height;
      // 1.91:1 is the target; anything squarer than 3:2 crops badly.
      resolved = ratio >= 1.5 ? { url: absoluteImageUrl(path), width, height } : GENERATED_CARD;
    }
  } catch {
    // Unreadable file (or sharp unavailable): the generated card is always safe.
  }

  socialImageCache.set(path, resolved);
  return resolved;
}

function absoluteImageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
