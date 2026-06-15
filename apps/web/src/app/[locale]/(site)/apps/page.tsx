import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppsShowcasePage } from "@/components/site/apps-showcase-page";
import { buildSiteModel } from "@/components/site/site-model";
import { SiteOffersSection } from "@/components/site/site-offers-section";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { downloadCountFor, readDownloadCounts } from "@/lib/download-counter";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import { readLatestWindowsRelease } from "@/lib/windows-release";
import "@/styles/route-apps.css";
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
  const [model, classic, pro, windowsRelease, downloadCounts] = await Promise.all([
    buildSiteModel({ locale: loc, slug: "apps" }),
    readAppEcosystem("moplayer"),
    readAppEcosystem("moplayer2"),
    readLatestWindowsRelease(),
    readDownloadCounts(),
  ]);
  const classicImage = normalizePublicImagePath(
    classic.product.hero_image_path ||
      classic.product.tv_banner_path ||
      classic.screenshots[0]?.image_path ||
      "/images/moplayer-tv-hero.png",
  );
  const proImage = normalizePublicImagePath(
    pro.product.hero_image_path ||
      pro.product.tv_banner_path ||
      pro.screenshots[0]?.image_path ||
      "/images/moplayer-pro-hero.webp",
  );
  const pcImage = normalizePublicImagePath(
    windowsRelease?.heroImage ||
      windowsRelease?.screenshots?.[0] ||
      pro.product.hero_image_path ||
      "/images/moplayer-pc-desktop.png",
  );
  const appVisuals = {
    classic: {
      image: classicImage,
      icon: normalizePublicImagePath(classic.product.logo_path || "/images/moplayer-icon-512.png"),
      version: classic.releases[0]?.version_name,
      downloads: downloadCountFor(downloadCounts, "moplayer"),
    },
    pro: {
      image: proImage,
      icon: normalizePublicImagePath(pro.product.logo_path || "/images/moplayer-icon-512.png"),
      version: pro.releases[0]?.version_name,
      downloads: downloadCountFor(downloadCounts, "moplayer2"),
    },
    pc: {
      image: pcImage,
      icon: normalizePublicImagePath(pro.product.logo_path || "/images/moplayer-icon-512.png"),
      version: windowsRelease?.version,
      downloads: downloadCountFor(downloadCounts, "moplayer2", "windows"),
    },
  };
  const publicDownloadStats = {
    total: downloadCounts.total,
    since: downloadCounts.since,
    classic: appVisuals.classic.downloads,
    pro: appVisuals.pro.downloads,
    pc: appVisuals.pc.downloads,
  };
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
      <AppsShowcasePage locale={loc} siteImages={model.siteImages} appVisuals={appVisuals} downloadStats={publicDownloadStats} />
      <SiteOffersSection model={model} placement="apps" />
    </>
  );
}
