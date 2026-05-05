import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { MoPlayer2Landing } from "@/components/app/moplayer2-landing";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { readAppEcosystem } from "@/lib/app-ecosystem";
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

export function generateStaticParams() {
  return managedApps.filter((app) => app.slug !== "moplayer").flatMap((app) => [
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
  const title = `${ecosystem.product.product_name} | Mohammad Alfarras Apps`;
  const description = ecosystem.product.short_description;
  const image = normalizePublicImagePath(ecosystem.product.hero_image_path || ecosystem.product.tv_banner_path || "/images/moplayer-hero-3d-final.png");

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/apps/${productSlug}`,
      languages: {
        ar: `${SITE_URL}/ar/apps/${productSlug}`,
        en: `${SITE_URL}/en/apps/${productSlug}`,
        "x-default": `${SITE_URL}/en/apps/${productSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/apps/${productSlug}`,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_SA"],
      images: [{ url: image, width: 1600, height: 900, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
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
  const ecosystem = await readAppEcosystem(productSlug);
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
  const fileSize = primaryAsset?.file_size_bytes ? `${(primaryAsset.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : undefined;
  const title = `${normalizedEcosystem.product.product_name} | Mohammad Alfarras Apps`;
  const description = normalizedEcosystem.product.short_description;

  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: normalizedEcosystem.product.product_name, path: `/${loc}/apps/${productSlug}` },
  ]);
  const software = softwareApplicationJsonLd({
    locale: loc,
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
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(software) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      {faq ? <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(faq) }} /> : null}
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
        <MoPlayer2Landing ecosystem={normalizedEcosystem} locale={loc} />
      ) : (
        <MoPlayerLanding ecosystem={normalizedEcosystem} locale={loc} />
      )}
    </>
  );
}
