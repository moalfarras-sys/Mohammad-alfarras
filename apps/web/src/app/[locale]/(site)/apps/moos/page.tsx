import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoosLanding } from "@/components/app/moos-landing";
import { isLocale } from "@/lib/i18n";
import { readLatestMoosRelease } from "@/lib/moos-release";
import { jsonLdString } from "@/lib/seo-jsonld";

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
          title: "MoOS — نظام تشغيل",
          description:
            "MoOS نظام تشغيل شخصي للكمبيوتر مبني على Fedora Atomic و KDE Plasma 6، بتحديثات موقّعة، ونسخة سحابية. ثبّته بأمر واحد.",
        }
      : {
          title: "MoOS — Operating System",
          description:
            "MoOS is a personal desktop OS built on Fedora Atomic and KDE Plasma 6, with signed updates and a cloud edition. Install it with one command.",
        };

  const canonical = `${SITE_URL}/${locale}/apps/moos`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;
  const image = `${SITE_URL}/images/moos/moos-desktop-dark.webp`;
  const keywords =
    locale === "ar"
      ? ["MoOS", "نظام تشغيل", "لينكس", "Fedora Atomic", "KDE Plasma", "bootc", "نظام تشغيل عربي", "محمد الفراس"]
      : ["MoOS", "operating system", "Linux distro", "Fedora Atomic", "KDE Plasma", "bootc", "immutable OS", "Mohammad Alfarras"];

  return {
    title: copy.title,
    description: copy.description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/apps/moos`,
        en: `${SITE_URL}/en/apps/moos`,
        "x-default": `${SITE_URL}/en/apps/moos`,
      },
    },
    openGraph: {
      title: socialTitle,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [{ url: image, width: 1600, height: 1000, alt: socialTitle }],
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

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MoOS",
    applicationCategory: "OperatingSystem",
    operatingSystem: "Fedora Atomic (bootc), KDE Plasma 6",
    description:
      locale === "ar"
        ? "نظام تشغيل شخصي للكمبيوتر مبني على Fedora Atomic و KDE Plasma 6 بتحديثات موقّعة ونسخة سحابية."
        : "A personal desktop OS built on Fedora Atomic and KDE Plasma 6 with signed updates and a cloud edition.",
    url: `${SITE_URL}/${locale}/apps/moos`,
    image: `${SITE_URL}/images/moos/moos-desktop-dark.webp`,
    author: { "@type": "Person", name: "Mohammad Alfarras", url: SITE_URL },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    softwareHelp: release?.repoUrl ?? "https://github.com/moalfarras-sys/moos-image",
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(softwareJsonLd) }}
      />
      <MoosLanding locale={locale as "en" | "ar"} release={release} />
    </>
  );
}
