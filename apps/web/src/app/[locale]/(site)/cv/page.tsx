import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePage } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, personExpandedJsonLd, webPageJsonLd } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "cv");
}

export default async function LocaleCvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "السيرة الذاتية" : "CV", path: `/${loc}/cv` },
  ]);
  const page = webPageJsonLd({
    locale: loc,
    path: `/${loc}/cv`,
    name: loc === "ar" ? "السيرة الذاتية — محمد الفراس" : "Curriculum vitae — Mohammad Alfarras",
    description:
      loc === "ar"
        ? "الخبرة المهنية، مبادئ العمل، والشهادات لمحمد الفراس."
        : "Professional experience, working principles, and credentials for Mohammad Alfarras.",
  });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(personExpandedJsonLd(loc)) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <SitePage locale={loc} slug="cv" />
    </>
  );
}
