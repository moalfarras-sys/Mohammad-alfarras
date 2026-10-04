import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerPcPage } from "@/components/app/moplayer/pc-page";
import { pcShots } from "@/components/app/moplayer/shots";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, softwareApplicationJsonLd } from "@/lib/seo-jsonld";
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
          title: "تحميل MoPlayer PC لويندوز — مثبّت ونسخة محمولة",
          description:
            "حمّل MoPlayer PC مجاناً لويندوز 10 و 11: مشغّل IPTV مكتبي يدعم Xtream و M3U، بمثبّت رسمي ونسخة محمولة تعمل بدون تثبيت، مع تفعيل عبر QR من الموقع.",
        }
      : {
          title: "Download MoPlayer PC for Windows — installer & portable",
          description:
            "Download MoPlayer PC free for Windows 10 and 11: a desktop IPTV player with Xtream and M3U support, an official installer plus a portable build that needs no install and QR activation from the website.",
        };

  const canonical = `${SITE_URL}/${locale}/apps/moplayer-pc`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;
  const image = pcShots.settings.src;

  const keywords =
    locale === "ar"
      ? [
          "تحميل MoPlayer PC",
          "MoPlayer للكمبيوتر",
          "مشغل IPTV لويندوز",
          "برنامج IPTV للكمبيوتر",
          "مشغل M3U للكمبيوتر",
          "مشغل Xtream ويندوز",
          "تحميل مشغل IPTV مجاني",
          "برنامج تشغيل قنوات للكمبيوتر",
          "نسخة محمولة بدون تثبيت",
          "ويندوز 10",
          "ويندوز 11",
          "محمد الفراس",
        ]
      : [
          "download MoPlayer PC",
          "Windows IPTV player",
          "desktop M3U player",
          "Xtream Windows player",
          "free IPTV player for PC",
          "portable IPTV player",
          "IPTV player Windows 11",
          "IPTV player Windows 10",
          "Mohammad Alfarras",
        ];

  return {
    title: copy.title,
    description: copy.description,
    keywords,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer-pc`,
        en: `${SITE_URL}/en/apps/moplayer-pc`,
        "x-default": `${SITE_URL}/ar/apps/moplayer-pc`,
      },
    },
    openGraph: {
      title: socialTitle,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [{ url: image, width: 1280, height: 673, alt: socialTitle }],
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

export default async function MoPlayerPcRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const windowsRelease = await readLatestWindowsRelease();

  const loc = locale as "en" | "ar";
  const isAr = loc === "ar";
  // This is a download page with a version, a size and a download URL, and it
  // was the only product page emitting no product schema at all.
  const software = softwareApplicationJsonLd({
    locale: loc,
    path: "apps/moplayer-pc",
    name: "MoPlayer PC",
    description: isAr
      ? "مشغل مكتبي لويندوز يشغّل مصادر M3U و Xtream التي يضيفها المستخدم، بمثبّت ونسخة محمولة."
      : "A Windows desktop player for your own M3U and Xtream sources, with an installer and a portable build.",
    version: windowsRelease?.version ?? "",
    fileSize: windowsRelease?.fileSizeBytes ? `${Math.round(windowsRelease.fileSizeBytes / 1024 / 1024)} MB` : undefined,
    downloadUrl: `${SITE_URL}/api/app/download/latest?product=moplayer-pc&platform=windows`,
    operatingSystem: windowsRelease?.systemRequirements ?? "Windows 10, Windows 11",
    requirements: "Windows 10 or newer (x64)",
    featureList: ["Xtream", "M3U", "QR activation", "Portable build", "Multi-view"],
  });
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: isAr ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: isAr ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer PC", path: `/${loc}/apps/moplayer-pc` },
  ]);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(software) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <MoPlayerPcPage locale={loc} release={windowsRelease} />
    </>
  );
}
