import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerPcLanding } from "@/components/app/moplayer-pc-landing";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { publicDownloadStats, readDownloadCounts } from "@/lib/download-counter";
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
          title: "MoPlayer PC لويندوز",
          description: "مشغل مكتبي متكامل وقوي مصمم لنظام التشغيل Windows.",
        }
      : {
          title: "MoPlayer PC",
          description: "A fully integrated desktop player built natively for Windows.",
        };

  const canonical = `${SITE_URL}/${locale}/apps/moplayer-pc`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;
  const [ecosystem, windowsRelease] = await Promise.all([
    readAppEcosystem("moplayer2"),
    readLatestWindowsRelease(),
  ]);
  const image = normalizePublicImagePath(
    windowsRelease?.cardImage ||
      windowsRelease?.heroImage ||
      windowsRelease?.screenshotItems?.[0]?.url ||
      windowsRelease?.screenshots?.[0] ||
      ecosystem.product.hero_image_path ||
      ecosystem.product.tv_banner_path ||
      "/images/moplayer-pc-desktop.png",
  );

  const keywords =
    locale === "ar"
      ? ["MoPlayer PC", "مشغل IPTV لويندوز", "مشغل وسائط ويندوز", "مشغل M3U للكمبيوتر", "مشغل Xtream ويندوز", "تحميل مشغل للكمبيوتر", "محمد الفراس"]
      : ["MoPlayer PC", "Windows IPTV player", "desktop M3U player", "Xtream Windows player", "download IPTV player for PC", "Mohammad Alfarras"];

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
      images: [{ url: image, width: 1600, height: 900, alt: socialTitle }],
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

  const [ecosystem, windowsRelease, downloadCounts] = await Promise.all([
    readAppEcosystem("moplayer2"),
    readLatestWindowsRelease(),
    readDownloadCounts(),
  ]);

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
    version: windowsRelease?.version ?? "1.0.4",
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
      <MoPlayerPcLanding
        ecosystem={ecosystem}
        locale={loc}
        windowsRelease={windowsRelease}
        downloadStats={publicDownloadStats(downloadCounts, "moplayer2", "windows")}
      />
    </>
  );
}
