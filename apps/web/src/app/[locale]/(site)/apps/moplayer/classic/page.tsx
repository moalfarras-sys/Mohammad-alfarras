import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { getMoPlayerFaqs, moPlayerCopy } from "@/content/apps";
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
import "@/styles/route-moplayer-classic.css";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

const localizedMeta = {
  ar: {
    title: "MoPlayer Classic للأندرويد",
    socialTitle: "MoPlayer Classic — تطبيق أندرويد سريع وخفيف",
    description:
      "MoPlayer Classic هو تطبيق أندرويد وAndroid TV خفيف وسريع، مناسب للأجهزة الضعيفة، مع تحميل APK رسمي وإرشادات تثبيت وتفعيل واضحة.",
  },
  en: {
    title: "MoPlayer Classic",
    socialTitle: "MoPlayer Classic — fast, lightweight Android player",
    description:
      "MoPlayer Classic is the lightweight Android and Android TV player for normal and low-power devices, with official APK downloads and clear setup guidance.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = localizedMeta[locale];
  const ecosystem = await readAppEcosystem("moplayer");
  const image = normalizePublicImagePath(
    ecosystem.product.hero_image_path ||
      ecosystem.product.tv_banner_path ||
      ecosystem.screenshots[0]?.image_path ||
      "/images/moplayer-hero-3d-final.png",
  );
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/apps/moplayer/classic`,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer/classic`,
        en: `${SITE_URL}/en/apps/moplayer/classic`,
        "x-default": `${SITE_URL}/ar/apps/moplayer/classic`,
      },
    },
    openGraph: {
      title: meta.socialTitle,
      description: meta.description,
      url: `${SITE_URL}/${locale}/apps/moplayer/classic`,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_SA"],
      images: [{ url: image, width: 1600, height: 900, alt: meta.socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.socialTitle,
      description: meta.description,
      images: [image],
    },
  };
}

export default async function MoPlayerClassicRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const [ecosystem, downloadCounts] = await Promise.all([
    readAppEcosystem("moplayer"),
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

  const meta = localizedMeta[loc];
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer", path: `/${loc}/apps/moplayer` },
    { name: "MoPlayer Classic", path: `/${loc}/apps/moplayer/classic` },
  ]);
  const software = softwareApplicationJsonLd({
    locale: loc,
    name: "MoPlayer Classic",
    description: meta.description,
    version: latest?.version_name || "v2 full",
    fileSize,
    targetSdk: normalizedEcosystem.product.android_target_sdk,
    downloadUrl: latest ? `${SITE_URL}/api/app/releases/${latest.slug}/download` : undefined,
  });
  const faq = faqPageJsonLd(getMoPlayerFaqs(loc));
  const pageCopy = moPlayerCopy[loc];

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
            "@id": `${SITE_URL}/${loc}/apps/moplayer/classic#webpage`,
            url: `${SITE_URL}/${loc}/apps/moplayer/classic`,
            name: meta.title,
            description: meta.description,
            inLanguage: loc === "ar" ? "ar-SA" : "en-US",
            about: {
              "@type": "SoftwareApplication",
              name: "MoPlayer Classic",
              description: pageCopy.heroBody,
            },
          }),
        }}
      />
      <MoPlayerLanding ecosystem={normalizedEcosystem} locale={loc} downloadStats={publicDownloadStats(downloadCounts, "moplayer")} />
    </>
  );
}
