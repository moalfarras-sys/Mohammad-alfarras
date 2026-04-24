import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePage } from "@/components/site/site-pages-v3";
import { privacyCopy } from "@/content/legal";
import { SITE_URL } from "@/content/site";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const copy = privacyCopy[loc];

  return {
    title: `${copy.eyebrow} | Mohammad Alfarras`,
    description: copy.intro,
    alternates: {
      canonical: `${SITE_URL}/${loc}/privacy`,
      languages: {
        ar: `${SITE_URL}/ar/privacy`,
        en: `${SITE_URL}/en/privacy`,
        "x-default": `${SITE_URL}/en/privacy`,
      },
    },
  };
}

export default async function LocalizedPrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const copy = privacyCopy[loc];
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: copy.eyebrow, path: `/${loc}/privacy` },
  ]);
  const page = webPageJsonLd({
    locale: loc,
    path: `/${loc}/privacy`,
    name: copy.title,
    description: copy.intro,
  });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <SitePage locale={loc} slug="privacy" />
    </>
  );
}
