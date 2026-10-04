import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerClassicPage } from "@/components/app/moplayer/classic-page";
import { classicShots } from "@/components/app/moplayer/shots";
import { getMoPlayerFaqs } from "@/content/apps";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { formatDownloadNumber, hasPublicDownloadCount } from "@/lib/download-display";
import { publicDownloadStats, readDownloadCounts } from "@/lib/download-counter";
import { formatFileSize, readReleaseFacts, releaseFactsFrom } from "@/lib/moplayer-release-facts";
import { isLocale } from "@/lib/i18n";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdString,
  softwareApplicationJsonLd,
} from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";
import { androidRequirementLabel } from "@moalfarras/shared/app-releases";

const SITE_URL = "https://moalfarras.space";

const localizedMeta = {
  ar: {
    title: "تحميل MoPlayer Classic APK — أندرويد و Android TV",
    socialTitle: "MoPlayer Classic — تطبيق أندرويد سريع وخفيف",
    description:
      "حمّل MoPlayer Classic APK مجاناً: نسخة خفيفة وسريعة لأندرويد و Android TV تعمل حتى على الأجهزة الضعيفة، مع دعم Xtream و M3U وشرح التثبيت والتفعيل خطوة بخطوة.",
  },
  en: {
    title: "Download MoPlayer Classic APK — Android & Android TV",
    socialTitle: "MoPlayer Classic — fast, lightweight Android player",
    description:
      "Download MoPlayer Classic APK free: the lightweight Android and Android TV player that still runs well on low-power boxes, with Xtream and M3U support and step-by-step install and activation guidance.",
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
  const image = classicShots.liveBrowser.src;
  const keywords =
    locale === "ar"
      ? ["MoPlayer Classic", "مشغل IPTV للأندرويد", "مشغل M3U", "مشغل Xtream", "مشغل خفيف للأجهزة الضعيفة", "تحميل APK", "محمد الفراس"]
      : ["MoPlayer Classic", "IPTV player Android", "M3U player", "Xtream player", "lightweight Android TV player", "APK download", "Mohammad Alfarras"];

  return {
    title: meta.title,
    description: meta.description,
    keywords,
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
      images: [{ url: image, width: 1920, height: 1080, alt: meta.socialTitle }],
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
  const [ecosystem, proFacts, downloadCounts] = await Promise.all([
    readAppEcosystem("moplayer"),
    readReleaseFacts("moplayer2"),
    readDownloadCounts(),
  ]);
  const facts = releaseFactsFrom("moplayer", ecosystem);
  const stats = publicDownloadStats(downloadCounts, "moplayer");
  const downloads = hasPublicDownloadCount(stats) ? formatDownloadNumber(stats.value, loc) : null;
  const fileSize = formatFileSize(facts.sizeBytes, "en") ?? undefined;

  const meta = localizedMeta[loc];
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer", path: `/${loc}/apps/moplayer` },
    { name: "MoPlayer Classic", path: `/${loc}/apps/moplayer/classic` },
  ]);
  const software = softwareApplicationJsonLd({
    locale: loc,
    path: "apps/moplayer/classic",
    name: "MoPlayer Classic",
    description: meta.description,
    version: facts.version,
    fileSize,
    targetSdk: ecosystem.product.android_target_sdk,
    operatingSystem: `Android ${facts.minAndroid}+, Android TV`,
    requirements: androidRequirementLabel(facts.minSdk),
    downloadUrl: `${SITE_URL}${facts.downloadHref}`,
  });
  const faq = faqPageJsonLd(getMoPlayerFaqs(loc));

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
              description: meta.description,
            },
          }),
        }}
      />
      <MoPlayerClassicPage locale={loc} facts={facts} proFacts={proFacts} downloads={downloads} />
    </>
  );
}
