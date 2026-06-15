import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PortfolioPrivacyPage } from "@/components/site/portfolio-pages";
import { privacyCopy } from "@/content/legal";
import { SITE_URL } from "@/content/site";
import { readSiteSetting } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import type { LegalPagesSetting } from "@/lib/legal-pages";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const copy = privacyCopy[loc];
  const title = loc === "ar" ? "سياسة الخصوصية" : "Privacy Policy";
  const socialTitle = `${title} | Mohammad Alfarras`;
  const canonical = `${SITE_URL}/${loc}/privacy`;
  const image = `${SITE_URL}/images/protofeilnew.jpeg`;

  return {
    title,
    description: copy.intro,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/privacy`,
        en: `${SITE_URL}/en/privacy`,
        "x-default": `${SITE_URL}/en/privacy`,
      },
    },
    openGraph: {
      title: socialTitle,
      description: copy.intro,
      url: canonical,
      type: "website",
      locale: loc === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [{ url: image, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: socialTitle,
      description: copy.intro,
      images: [image],
    },
  };
}

export default async function LocalizedPrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const copy = privacyCopy[loc];
  const legal = await readSiteSetting<LegalPagesSetting>("legal_pages", {});
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
      <PortfolioPrivacyPage locale={loc} extraNote={legal.privacyExtra} />
    </>
  );
}
