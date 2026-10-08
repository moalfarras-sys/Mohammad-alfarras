import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoosV3 } from "@/components/v3/moos-v3";
import { isLocale } from "@/lib/i18n";
import { readLatestMoosRelease } from "@/lib/moos-release";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo-jsonld";

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
          title: "نظام MoOS — نظام تشغيل عربي مجاني للكمبيوتر",
          description:
            "تعرّف إلى MoOS، نظام تشغيل عربي جديد قيد التطوير مبني على MoOS Atomic وKDE Plasma 6، مع تطبيقات Android وWindows الاختيارية وMo AI والتحكم من الجوال. مجاني ومفتوح المصدر، مع مثبّت رسمي موقّع.",
        }
      : {
          title: "MoOS — a free Arabic-native desktop operating system",
          description:
            "Meet MoOS, a new Arabic-native operating system in active development, built on MoOS Atomic and KDE Plasma 6 with optional Android and Windows apps, Mo AI and phone control. Free and open source, with a signed official installer.",
        };

  const canonical = `${SITE_URL}/${locale}/moos`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;
  const image = `${SITE_URL}/images/moos/desktop-dark.webp`;
  const keywords =
    locale === "ar"
      ? [
          "نظام MoOS",
          "MoOS",
          "نظام تشغيل عربي",
          "نظام تشغيل مجاني",
          "توزيعة لينكس عربية",
          "تحميل نظام تشغيل",
          "بديل ويندوز",
          "لينكس للمبتدئين",
          "MoOS Atomic",
          "KDE Plasma",
          "bootc",
          "تشغيل تطبيقات أندرويد",
          "تشغيل تطبيقات ويندوز",
          "Mo AI",
          "ميرا مساعد ذكي",
          "Mo PC Remote",
          "نظام تشغيل للسيرفر",
          "نظام تشغيل سحابي",
          "محمد الفراس",
        ]
      : [
          "MoOS",
          "Arabic Linux distro",
          "free operating system",
          "download Linux OS",
          "MoOS Atomic",
          "KDE Plasma 6",
          "bootc",
          "immutable OS",
          "atomic Linux desktop",
          "Android apps on Linux",
          "Windows apps on Linux",
          "Mo AI",
          "Mira AI assistant",
          "Mo PC Remote",
          "Linux for Arabic users",
          "cloud server OS",
          "Mohammad Alfarras",
        ];

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
    operatingSystem: "MoOS Atomic (bootc), KDE Plasma 6",
    description: isAr
      ? "نظام تشغيل عربي جديد قيد التطوير مبني على MoOS Atomic وKDE Plasma 6، مع تحديثات موقّعة وطبقات اختيارية لتطبيقات Android وWindows وMo AI والتحكم من الجوال."
      : "A new Arabic-native desktop operating system in active development, built on MoOS Atomic and KDE Plasma 6 with signed updates, optional Android and Windows app layers, Mo AI and phone control.",
    url: `${SITE_URL}/${locale}/moos`,
    image: `${SITE_URL}/images/moos/desktop-dark.webp`,
    inLanguage: ["ar", "en"],
    author: { "@type": "Person", name: "Mohammad Alfarras", url: SITE_URL },
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    isAccessibleForFree: true,
    downloadUrl: `${SITE_URL}/api/os/download?type=${release?.iso.available && !release.maintenance ? "iso" : "desktop"}`,
    softwareVersion: release?.iso.version,
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
      <MoosV3 locale={locale as "en" | "ar"} release={release} />
    </>
  );
}
