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
      images: [
        {
          url: absoluteImageUrl(copy.image),
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: resolvedTitle,
      description: copy.description,
      images: [{ url: absoluteImageUrl(copy.image), alt: resolvedTitle }],
    },
  };
}

function absoluteImageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
