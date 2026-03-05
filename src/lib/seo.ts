import type { Metadata } from "next";

import { readPage } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

const BASE_URL = "https://www.moalfarras.space";

export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const page = await readPage(locale, slug);
  if (!page) {
    return {};
  }

  const localizedPath = slug === "home" ? `/${locale}` : `/${locale}/${slug}`;
  const altAr = slug === "home" ? "/ar" : `/ar/${slug}`;
  const altEn = slug === "home" ? "/en" : `/en/${slug}`;

  return {
    title: page.seo.title,
    description: page.seo.description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: localizedPath,
      languages: {
        ar: altAr,
        en: altEn,
        "x-default": "/ar",
      },
    },
    openGraph: {
      type: "website",
      locale,
      url: `${BASE_URL}${localizedPath}`,
      title: page.seo.ogTitle,
      description: page.seo.ogDescription,
      siteName: "MOALFARRAS",
    },
    twitter: {
      card: "summary_large_image",
      title: page.seo.ogTitle,
      description: page.seo.ogDescription,
    },
  };
}

