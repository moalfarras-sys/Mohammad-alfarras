import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerPcLanding } from "@/components/app/moplayer-pc-landing";
import { isLocale } from "@/lib/i18n";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { readLatestWindowsRelease } from "@/lib/windows-release";

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
          title: "MoPlayer PC لويندوز",
          description: "مشغل مكتبي متكامل وقوي مصمم لنظام التشغيل Windows.",
        }
      : {
          title: "MoPlayer PC",
          description: "A fully integrated desktop player built natively for Windows.",
        };

  const canonical = `${SITE_URL}/${locale}/apps/moplayer-pc`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer-pc`,
        en: `${SITE_URL}/en/apps/moplayer-pc`,
        "x-default": `${SITE_URL}/en/apps/moplayer-pc`,
      },
    },
    openGraph: {
      title: socialTitle,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [
        { url: "/images/moplayer-pro-hero.webp", width: 1600, height: 900, alt: socialTitle },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: socialTitle,
      description: copy.description,
      images: ["/images/moplayer-pro-hero.webp"],
    },
  };
}

export default async function MoPlayerPcRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [ecosystem, windowsRelease] = await Promise.all([
    readAppEcosystem("moplayer2"),
    readLatestWindowsRelease(),
  ]);

  return (
    <MoPlayerPcLanding
      ecosystem={ecosystem}
      locale={locale as "en" | "ar"}
      windowsRelease={windowsRelease}
    />
  );
}
