import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { MoPlayer2Landing } from "@/components/app/moplayer2-landing";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { publicDownloadStats, readDownloadCounts } from "@/lib/download-counter";
import { isLocale } from "@/lib/i18n";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdString,
  softwareApplicationJsonLd,
} from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";
import { isManagedAppSlug, managedApps } from "@moalfarras/shared/app-products";

const SITE_URL = "https://moalfarras.space";

const productMetadata = {
  moplayer2: {
    ar: {
      title: "تحميل MoPlayer Pro APK — Android TV و Fire TV",
      description:
        "حمّل MoPlayer Pro APK مجاناً: مشغّل IPTV متقدّم لأجهزة Android TV و Fire TV، يدعم Xtream و M3U وتفعيل QR وواجهة ريموت سريعة. تحميل رسمي مباشر بدون اشتراك.",
    },
    en: {
      title: "Download MoPlayer Pro APK — Android TV & Fire TV",
      description:
        "Download MoPlayer Pro APK free: an advanced IPTV player for Android TV and Fire TV with Xtream, M3U, QR activation and a fast remote-first interface. Official direct download, no subscription.",
    },
  },
} as const;

export function generateStaticParams() {
  return managedApps
    .filter((app) => app.slug !== "moplayer")
    .flatMap((app) => [
      { locale: "ar", productSlug: app.slug },
      { locale: "en", productSlug: app.slug },
    ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; productSlug: string }>;
}): Promise<Metadata> {
  const { locale, productSlug } = await params;
  if (!isLocale(locale) || !isManagedAppSlug(productSlug)) return {};
  const ecosystem = await readAppEcosystem(productSlug);
  const localized = productSlug === "moplayer2" ? productMetadata.moplayer2[locale] : null;
  const title = localized?.title ?? ecosystem.product.product_name;
  const socialTitle = `${title} | Mohammad Alfarras`;
  const description = localized?.description ?? ecosystem.product.short_description;
  const image = normalizePublicImagePath(
    ecosystem.product.hero_image_path ||
      ecosystem.product.tv_banner_path ||
      "/images/moplayer-hero-3d-final.png",
  );

  const keywords =
    locale === "ar"
      ? [
          "تحميل MoPlayer Pro",
          "MoPlayer Pro APK",
          "تنزيل MoPlayer Pro",
          "مشغل IPTV لأجهزة Android TV",
          "مشغل Fire TV",
          "مشغل Xtream",
          "مشغل M3U للتلفزيون",
          "تطبيق IPTV للتلفزيون",
          "برنامج بث مباشر للتلفزيون",
          "تفعيل MoPlayer Pro",
          "تفعيل QR",
          "تطبيق بث للتلفزيون",
          "محمد الفراس",
        ]
      : [
          "download MoPlayer Pro",
          "MoPlayer Pro APK",
          "Android TV IPTV player",
          "Fire TV IPTV player",
          "Xtream Codes player",
          "M3U player for TV",
          "free IPTV app for Android TV",
          "premium IPTV app",
          "MoPlayer activation",
          "QR activation",
          "Mohammad Alfarras",
        ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_URL}/${locale}/apps/${productSlug}`,
      languages: {
        ar: `${SITE_URL}/ar/apps/${productSlug}`,
        en: `${SITE_URL}/en/apps/${productSlug}`,
        "x-default": `${SITE_URL}/ar/apps/${productSlug}`,
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      url: `${SITE_URL}/${locale}/apps/${productSlug}`,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_SA"],
      images: [{ url: image, width: 1600, height: 900, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export default async function AppProductRoute({
  params,
}: {
  params: Promise<{ locale: string; productSlug: string }>;
}) {
  const { locale, productSlug } = await params;
  if (!isLocale(locale) || !isManagedAppSlug(productSlug)) notFound();

  const loc = locale as Locale;
  const [ecosystem, downloadCounts] = await Promise.all([
    readAppEcosystem(productSlug),
    readDownloadCounts(),
  ]);
  const normalizedEcosystem = {
    ...ecosystem,
    product: {
      ...ecosystem.product,
      hero_image_path: normalizePublicImagePath(ecosystem.product.hero_image_path),
      logo_path: normalizePublicImagePath(ecosystem.product.logo_path),
      tv_banner_path: normalizePublicImagePath(ecosystem.product.tv_banner_path),
    },
    screenshots: ecosystem.screenshots.map((item) => ({
      ...item,
      image_path: normalizePublicImagePath(item.image_path),
    })),
  };
  const latest = normalizedEcosystem.releases[0] ?? null;
  const primaryAsset = latest?.assets.find((a) => a.is_primary) ?? latest?.assets[0] ?? null;
  const fileSize = primaryAsset?.file_size_bytes
    ? `${(primaryAsset.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
    : undefined;
  const localized = productSlug === "moplayer2" ? productMetadata.moplayer2[loc] : null;
  const title = localized?.title ?? normalizedEcosystem.product.product_name;
  const description = localized?.description ?? normalizedEcosystem.product.short_description;

  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: normalizedEcosystem.product.product_name, path: `/${loc}/apps/${productSlug}` },
  ]);
  const software = softwareApplicationJsonLd({
    locale: loc,
    path: `apps/${productSlug}`,
    name: normalizedEcosystem.product.product_name,
    description,
    version: latest?.version_name || normalizedEcosystem.product.default_download_label,
    fileSize,
    targetSdk: normalizedEcosystem.product.android_target_sdk,
    downloadUrl: latest ? `${SITE_URL}/api/app/releases/${latest.slug}/download` : undefined,
  });
  const faq = faqPageJsonLd(
    normalizedEcosystem.faqs.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(software) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      {faq ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: jsonLdString(faq) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: jsonLdString({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${SITE_URL}/${loc}/apps/${productSlug}#webpage`,
            url: `${SITE_URL}/${loc}/apps/${productSlug}`,
            name: title,
            description,
            inLanguage: loc === "ar" ? "ar-SA" : "en-US",
          }),
        }}
      />
      {productSlug === "moplayer2" ? (
        <MoPlayer2Landing ecosystem={normalizedEcosystem} locale={loc} downloadStats={publicDownloadStats(downloadCounts, productSlug)} />
      ) : (
        <MoPlayerLanding ecosystem={normalizedEcosystem} locale={loc} downloadStats={publicDownloadStats(downloadCounts, productSlug)} />
      )}
    </>
  );
}
