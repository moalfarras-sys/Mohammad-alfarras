import type { Metadata } from "next";

import { getBrandAssets, getSiteSeoDocument } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

const BASE_URL = "https://moalfarras.space";

const keywordMap: Record<string, string[]> = {
  home: [
    "Mohammad Alfarras", "Arabic tech creator", "frontend developer Germany",
    "digital designer Germany", "محمد الفراس", "مطور مواقع ألمانيا", "تصميم مواقع احترافي",
    "موقع شخصي محمد الفراس", "portfolio developer Germany",
  ],
  about: [
    "Mohammad Alfarras about", "personal website Germany", "creative developer Germany",
    "من هو محمد الفراس", "نبذة محمد الفراس", "مطور ومصمم في ألمانيا",
  ],
  cv: [
    "Mohammad Alfarras CV", "professional journey", "frontend and logistics Germany",
    "سيرة محمد الفراس", "سيرة ذاتية مطور مواقع", "Mohammad Alfarras background",
  ],
  work: [
    "Mohammad Alfarras work", "project case studies", "product portfolio Germany",
    "أعمال محمد الفراس", "دراسات حالة محمد الفراس", "مشاريع رقمية احترافية",
  ],
  blog: [
    "digital presentation case studies", "branding insights Germany",
    "personal brand web design", "رؤية رقمية", "أعمال تصميم مواقع",
  ],
  projects: [
    "Mohammad Alfarras projects", "case studies portfolio", "SEEL Transport website",
    "Schnell Sicher Umzug website", "MoPlayer app", "أعمال محمد الفراس",
    "مشاريع ويب احترافية", "frontend portfolio Germany",
  ],
  youtube: [
    "Arabic YouTube creator Germany", "Arabic tech reviews electronics",
    "YouTube Mohammad Alfarras", "يوتيوب محمد الفراس", "مراجعات تقنية عربية",
    "قناة يوتيوب تقنية",
  ],
  contact: [
    "contact Mohammad Alfarras", "hire frontend designer Germany",
    "content collaboration Arabic", "تواصل محمد الفراس", "التواصل مع مطور مواقع",
  ],
  privacy: ["privacy policy moalfarras.space", "data handling", "سياسة الخصوصية محمد الفراس"],
};

export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const snapshot = await readSnapshot();
  const seoDoc = getSiteSeoDocument(snapshot);
  const brand = getBrandAssets(snapshot);
  const entries = seoDoc[locale];
  const normalizedSlug = slug === "about" ? "cv" : slug === "work" ? "projects" : slug || "home";
  const key = normalizedSlug as keyof typeof entries;
  const seo = entries[key] ?? entries.home;
  const ogImage = seo.image ?? "/images/brand-spotlight-2026.jpeg";
  const localizedPath = slug === "home" ? `/${locale}` : `/${locale}/${slug}`;
  const altAr = slug === "home" ? "/ar" : `/ar/${slug}`;
  const altEn = slug === "home" ? "/en" : `/en/${slug}`;
  const localeTag = locale === "ar" ? "ar_SA" : "en_US";
  const altLocaleTag = locale === "ar" ? "en_US" : "ar_SA";
  const altLocalePath = locale === "ar" ? altEn : altAr;
  const siteNameOg = `${brand.siteName.en} | ${brand.siteName.ar}`;

  return {
    title: seo.title,
    description: seo.description,
    metadataBase: new URL(BASE_URL),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `${BASE_URL}${localizedPath}`,
      languages: {
        ar: `${BASE_URL}${altAr}`,
        en: `${BASE_URL}${altEn}`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: localeTag,
      alternateLocale: [altLocaleTag],
      url: `${BASE_URL}${localizedPath}`,
      title: seo.ogTitle,
      description: seo.ogDescription,
      siteName: siteNameOg,
      images: [
        {
          url: `${BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: seo.ogTitle,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [
        {
          url: `${BASE_URL}${ogImage}`,
          alt: seo.ogTitle,
        },
      ],
    },
    keywords: keywordMap[slug] ?? keywordMap[normalizedSlug] ?? keywordMap.home,
    other: {
      "og:locale:alternate": altLocaleTag,
      "canonical": `${BASE_URL}${localizedPath}`,
      "alternate": `${BASE_URL}${altLocalePath}`,
    },
  };
}
