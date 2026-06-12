import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerProductHub } from "@/components/app/moplayer-product-hub";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

const localizedMeta = {
  ar: {
    title: "MoPlayer — عائلة تطبيقات Android وWindows ومنصات التلفزيون",
    description:
      "بوابة MoPlayer الجديدة تجمع Classic وPro وPC، وتجهز مكانا واضحا لتطبيقات iOS وApple TV وLG وSamsung القادمة.",
  },
  en: {
    title: "MoPlayer — Android, Windows, and TV platform product family",
    description:
      "The new MoPlayer hub brings Classic, Pro, and PC together, with a prepared roadmap for future iOS, Apple TV, LG, and Samsung apps.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = localizedMeta[locale];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/apps/moplayer`,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer`,
        en: `${SITE_URL}/en/apps/moplayer`,
        "x-default": `${SITE_URL}/en/apps/moplayer`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_URL}/${locale}/apps/moplayer`,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_SA"],
      images: [{ url: "/images/moplayer-pro-hero.webp", width: 1600, height: 900, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/images/moplayer-pro-hero.webp"],
    },
  };
}

export default async function MoPlayerHubRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const meta = localizedMeta[loc];
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer", path: `/${loc}/apps/moplayer` },
  ]);
  const collection = collectionPageJsonLd(loc, "apps/moplayer", meta.title, meta.description);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/${loc}/apps/moplayer#products`,
    name: "MoPlayer product family",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "MoPlayer Classic", url: `${SITE_URL}/${loc}/apps/moplayer/classic` },
      { "@type": "ListItem", position: 2, name: "MoPlayer Pro", url: `${SITE_URL}/${loc}/apps/moplayer2` },
      { "@type": "ListItem", position: 3, name: "MoPlayer PC", url: `${SITE_URL}/api/app/download/latest?product=moplayer2&platform=windows` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(collection) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(itemList) }} />
      <MoPlayerProductHub locale={loc} />
    </>
  );
}
