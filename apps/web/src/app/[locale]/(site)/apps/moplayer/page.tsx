import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { isLocale } from "@/lib/i18n";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdString,
  softwareApplicationJsonLd,
} from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

const localizedMeta = {
  ar: {
    title: "MoPlayer — تطبيق وسائط أنظف لـ Android و Android TV",
    description:
      "MoPlayer: تجربة وسائط واحدة ونظيفة على Android و Android TV — بدون إعلانات، بدون تتبع. من إنتاج محمد الفراس.",
  },
  en: {
    title: "MoPlayer — Cinematic media for Android & Android TV",
    description:
      "MoPlayer: one focused, ad-free media experience for Android and Android TV. No tracking, no paywalls. Built by Mohammad Alfarras.",
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
      images: [{ url: "/images/moplayer-app-cover-final.jpeg", width: 1600, height: 900, alt: "MoPlayer" }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/images/moplayer-app-cover-final.jpeg"],
    },
  };
}

export default async function MoPlayerLocaleRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const ecosystem = await readAppEcosystem("moplayer");
  const latest = ecosystem.releases[0] ?? null;
  const primaryAsset = latest?.assets.find((a) => a.is_primary) ?? latest?.assets[0] ?? null;
  const fileSize = primaryAsset?.file_size_bytes ? `${(primaryAsset.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : undefined;

  const meta = localizedMeta[loc];
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer", path: `/${loc}/apps/moplayer` },
  ]);
  const software = softwareApplicationJsonLd({
    locale: loc,
    name: "MoPlayer",
    description: meta.description,
    version: latest?.version_name || "2.0.0",
    fileSize,
    targetSdk: ecosystem.product.android_target_sdk,
    downloadUrl: latest ? `${SITE_URL}/api/app/releases/${latest.slug}/download` : undefined,
  });
  const faq = ecosystem.faqs.length
    ? faqPageJsonLd(ecosystem.faqs.slice(0, 6).map((f) => ({ question: f.question, answer: f.answer })))
    : null;

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(software) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      {faq ? <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(faq) }} /> : null}
      <MoPlayerLanding ecosystem={ecosystem} locale={loc} />
    </>
  );
}
