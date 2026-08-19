import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoosLanding } from "@/components/app/moos-landing";
import { isLocale } from "@/lib/i18n";
import { readLatestMoosRelease } from "@/lib/moos-release";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import "@/styles/route-moos.css";

const SITE_URL = "https://moalfarras.space";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const copy =
    locale === "ar"
      ? {
          title: "نظام MoOS",
          description:
            "MoOS نظام تشغيل حقيقي للكمبيوتر بواجهة عربية أصيلة، مبني على Fedora Atomic و KDE Plasma 6، بتحديثات موقّعة وتراجع فوري. حمّل النسخة العامة أو نسخة الكلاود مجاناً.",
        }
      : {
          title: "MoOS — the operating system",
          description:
            "MoOS is a real desktop operating system with a natively Arabic interface, built on Fedora Atomic and KDE Plasma 6, with signed updates and instant rollback. Download the public or cloud edition free.",
        };

  const canonical = `${SITE_URL}/${locale}/moos`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;
  const image = `${SITE_URL}/images/moos/desktop-dark.webp`;
  const keywords =
    locale === "ar"
      ? ["نظام MoOS", "نظام تشغيل عربي", "توزيعة لينكس", "Fedora Atomic", "KDE Plasma", "bootc", "نظام تشغيل مجاني", "محمد الفراس"]
      : ["MoOS", "operating system", "Arabic Linux distro", "Fedora Atomic", "KDE Plasma", "bootc", "immutable OS", "Mohammad Alfarras"];

  return {
    title: copy.title,
    description: copy.description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/moos`,
        en: `${SITE_URL}/en/moos`,
        "x-default": `${SITE_URL}/ar/moos`,
      },
    },
    openGraph: {
      title: socialTitle,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [{ url: image, width: 2400, height: 1350, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: socialTitle,
      description: copy.description,
      images: [image],
    },
  };
}

export default async function MoosRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const release = await readLatestMoosRelease();
  const isAr = locale === "ar";

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MoOS",
    applicationCategory: "OperatingSystem",
    operatingSystem: "Fedora Atomic (bootc), KDE Plasma 6",
    description: isAr
      ? "نظام تشغيل شخصي للكمبيوتر بواجهة عربية أصيلة، مبني على Fedora Atomic و KDE Plasma 6، بتحديثات موقّعة ونسخة سحابية."
      : "A personal desktop operating system with a natively Arabic interface, built on Fedora Atomic and KDE Plasma 6, with signed updates and a cloud edition.",
    url: `${SITE_URL}/${locale}/moos`,
    image: `${SITE_URL}/images/moos/desktop-dark.webp`,
    inLanguage: ["ar", "en", "de"],
    author: { "@type": "Person", name: "Mohammad Alfarras", url: SITE_URL },
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    isAccessibleForFree: true,
    downloadUrl: `${SITE_URL}/api/os/download?type=desktop`,
    softwareHelp: release?.repoUrl ?? "https://github.com/moalfarras-sys/moos-image",
  };

  const breadcrumb = breadcrumbJsonLd(locale, [
    { name: isAr ? "الرئيسية" : "Home", path: `/${locale}` },
    { name: isAr ? "نظام MoOS" : "MoOS", path: `/${locale}/moos` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <MoosLanding locale={locale as "en" | "ar"} release={release} />
    </>
  );
}
