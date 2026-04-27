import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerActivationPage } from "@/components/app/moplayer-activation-page";
import { isLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

const meta = {
  en: {
    title: "MoPlayer Setup | Add IPTV Source",
    description:
      "Activate MoPlayer and securely send an Xtream or M3U source to the paired Android TV device.",
  },
  ar: {
    title: "إعداد MoPlayer | إضافة مصدر IPTV",
    description:
      "فعّل MoPlayer وأرسل مصدر Xtream أو M3U بأمان إلى جهاز Android TV المرتبط.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = repairMojibakeDeep(meta[locale]);
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/moplayer/setup`,
      languages: {
        ar: `${SITE_URL}/ar/moplayer/setup`,
        en: `${SITE_URL}/en/moplayer/setup`,
        "x-default": `${SITE_URL}/en/moplayer/setup`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${SITE_URL}/${locale}/moplayer/setup`,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      images: [{ url: "/images/moplayer-tv-banner.png", width: 1600, height: 900, alt: copy.title }],
    },
  };
}

export default async function MoPlayerSetupRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { code = "" } = await searchParams;
  return <MoPlayerActivationPage locale={locale as Locale} initialCode={code} />;
}
