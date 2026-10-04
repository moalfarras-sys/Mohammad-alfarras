import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerIosPageView, type IosStatus } from "@/components/app/moplayer/ios-page";
import { proShots } from "@/components/app/moplayer/shots";
import { SITE_URL } from "@/content/site";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

const metaCopy = {
  en: { subtitle: "MoPlayer for iPhone is being prepared for the App Store. Not available to download yet; MoPlayer runs today on Android TV, Fire TV and Windows." },
  ar: { subtitle: "نسخة MoPlayer للآيفون قيد التحضير لـ App Store وليست متاحة للتنزيل بعد؛ ويعمل MoPlayer اليوم على Android TV و Fire TV وويندوز." },
} as const;

// A store link is only shown when the admin has saved a real Apple URL.
function appleUrl(value: string | undefined) {
  const url = String(value ?? "").trim();
  return /^https:\/\/(apps|testflight)\.apple\.com\//i.test(url) ? url : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const c = metaCopy[loc];
  const canonical = `${SITE_URL}/${loc}/apps/moplayer-ios`;
  const socialImage = `${SITE_URL}${proShots.signIn.src}`;
  // No manual brand suffix: the root template already appends
  // " | Mohammad Alfarras", and both locales previously rendered the identical
  // English title "MoPlayer iOS | Moalfarras | Mohammad Alfarras".
  const pageTitle = loc === "ar" ? "MoPlayer للآيفون" : "MoPlayer iOS";
  return {
    title: pageTitle,
    description: c.subtitle,
    keywords:
      loc === "ar"
        ? ["MoPlayer iOS", "مشغل IPTV للايفون", "مشغل آيفون", "مشغل M3U للايفون", "App Store", "محمد الفراس"]
        : ["MoPlayer iOS", "iPhone IPTV player", "iOS M3U player", "Xtream iPhone player", "App Store IPTV", "Mohammad Alfarras"],
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer-ios`,
        en: `${SITE_URL}/en/apps/moplayer-ios`,
        "x-default": `${SITE_URL}/ar/apps/moplayer-ios`,
      },
    },
    openGraph: {
      title: `${pageTitle} | Mohammad Alfarras`,
      description: c.subtitle,
      url: canonical,
      type: "website",
      locale: loc === "ar" ? "ar_SA" : "en_US",
      images: [{ url: socialImage, width: 1100, height: 619, alt: pageTitle }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: `${pageTitle} | Mohammad Alfarras`,
      description: c.subtitle,
      images: [socialImage],
    },
  };
}

export default async function MoPlayerIosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const isAr = loc === "ar";
  const ecosystem = await readAppEcosystem("moplayer2").catch(() => null);
  const runtime = ecosystem?.runtimeConfig?.ios;
  const url = appleUrl(runtime?.storeUrl);
  const rawStatus = runtime?.status;
  const ios: IosStatus = {
    status: url && (rawStatus === "app_store" || rawStatus === "testflight") ? rawStatus : "coming_soon",
    appleUrl: url,
    note: "",
  };
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: isAr ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: isAr ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer iOS", path: `/${loc}/apps/moplayer-ios` },
  ]);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <MoPlayerIosPageView locale={loc} ios={ios} />
    </>
  );
}
