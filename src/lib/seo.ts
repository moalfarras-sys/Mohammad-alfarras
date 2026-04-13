import type { Metadata } from "next";

import { rebuildContent } from "@/data/rebuild-content";
import type { Locale } from "@/types/cms";

const BASE_URL = "https://moalfarras.space";

const keywordMap: Record<string, string[]> = {
  home: ["Mohammad Alfarras", "Arabic tech creator", "frontend developer Germany", "digital designer Germany", "محمد الفراس"],
  cv: ["Mohammad Alfarras about", "professional journey", "frontend and logistics", "سيرة محمد الفراس"],
  blog: ["digital presentation", "branding insights", "personal brand insights", "رؤية رقمية"],
  projects: ["case studies", "portfolio work", "frontend case study", "أعمال محمد الفراس"],
  youtube: ["Arabic YouTube creator", "Arabic tech reviews", "YouTube Mohammad Alfarras", "يوتيوب محمد الفراس"],
  contact: ["contact Mohammad Alfarras", "hire frontend designer", "content collaboration", "تواصل محمد الفراس"],
  privacy: ["privacy policy", "data handling", "سياسة الخصوصية"],
};

export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const entries = rebuildContent[locale].seo;
  const key = (slug || "home") as keyof typeof entries;
  const seo = entries[key] ?? entries.home;
  const ogImage = seo.image ?? "/images/brand-spotlight-2026.jpeg";
  const localizedPath = slug === "home" ? `/${locale}` : `/${locale}/${slug}`;
  const altAr = slug === "home" ? "/ar" : `/ar/${slug}`;
  const altEn = slug === "home" ? "/en" : `/en/${slug}`;
  const localeTag = locale === "ar" ? "ar_SA" : "en_US";

  return {
    title: seo.title,
    description: seo.description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}${localizedPath}`,
      languages: {
        ar: `${BASE_URL}${altAr}`,
        en: `${BASE_URL}${altEn}`,
        "x-default": `${BASE_URL}/ar`,
      },
    },
    openGraph: {
      type: "website",
      locale: localeTag,
      url: `${BASE_URL}${localizedPath}`,
      title: seo.ogTitle,
      description: seo.ogDescription,
      siteName: "Moalfarras",
      images: [
        {
          url: `${BASE_URL}${ogImage}`,
          width: 1200,
          height: 630,
          alt: seo.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [`${BASE_URL}${ogImage}`],
    },
    keywords: keywordMap[slug] ?? keywordMap.home,
  };
}
