import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppsIndexPage } from "@/components/app/moplayer/apps-index";
import { pcFactsFrom } from "@/components/app/moplayer/family";
import { buildSiteModel } from "@/components/site/site-model";
import { SiteOffersSection } from "@/components/site/site-offers-section";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import { readReleaseFacts } from "@/lib/moplayer-release-facts";
import { pageMetadata } from "@/lib/seo";
import { readLatestWindowsRelease } from "@/lib/windows-release";
import type { Locale } from "@/types/cms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "apps");
}

export default async function AppsRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const [model, classic, pro, windowsRelease] = await Promise.all([
    buildSiteModel({ locale: loc, slug: "apps" }),
    readReleaseFacts("moplayer"),
    readReleaseFacts("moplayer2"),
    readLatestWindowsRelease(),
  ]);
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
  ]);
  const collection = collectionPageJsonLd(
    loc,
    "apps",
    loc === "ar" ? "تطبيقات محمد الفراس" : "Mohammad Alfarras — Apps",
    loc === "ar"
      ? "منظومة تطبيقات ومنتجات رقمية بُنيت بنفس مستوى الموقع."
      : "A small ecosystem of focused products built to the same standard as the site.",
  );

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(collection) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <AppsIndexPage locale={loc} classic={classic} pro={pro} pc={pcFactsFrom(windowsRelease)} />
      <SiteOffersSection model={model} placement="apps" />
    </>
  );
}
