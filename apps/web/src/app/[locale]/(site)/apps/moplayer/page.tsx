import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerProductHub } from "@/components/app/moplayer-product-hub";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { isLocale } from "@/lib/i18n";
import { readLatestWindowsRelease } from "@/lib/windows-release";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

// Search Console, Aug 2026: "moplayer" brings 54 impressions at position 4.2
// and ZERO clicks. The old title ("تطبيقات MoPlayer") named the page instead of
// answering the search — someone typing "moplayer" wants to download it and
// wants to know it is free. The title now leads with the action and the price,
// and the description states platform, sources and cost in the first line,
// because that is all Google shows.
const localizedMeta = {
  ar: {
    title: "تحميل MoPlayer مجاناً — أندرويد و Android TV وويندوز",
    socialTitle: "MoPlayer — تحميل مجاني لأندرويد و Android TV وويندوز",
    description:
      "حمّل MoPlayer مجاناً: مشغّل IPTV لأجهزة أندرويد و Android TV وويندوز، يدعم Xtream و M3U وتفعيل QR. تحميل رسمي مباشر بدون اشتراك — التطبيق مشغّل فقط ولا يوفّر قنوات.",
    keywords: [
      "تحميل MoPlayer",
      "MoPlayer",
      "تنزيل MoPlayer",
      "MoPlayer APK",
      "مشغل IPTV",
      "مشغل IPTV للاندرويد",
      "مشغل Android TV",
      "تطبيق IPTV مجاني",
      "مشغل M3U",
      "مشغل Xtream",
      "تشغيل قوائم M3U",
      "برنامج IPTV للكمبيوتر",
      "مشغل IPTV ويندوز",
      "تفعيل MoPlayer",
      "MoPlayer Pro",
      "MoPlayer Classic",
      "MoPlayer PC",
      "mo tv تنزيل",
      "محمد الفراس",
    ],
  },
  en: {
    title: "Download MoPlayer Free — Android, Android TV & Windows",
    socialTitle: "MoPlayer — free download for Android, Android TV and Windows",
    description:
      "Download MoPlayer free: an IPTV player for Android, Android TV and Windows with Xtream, M3U and QR activation. Official direct download, no subscription — the app is a player only and provides no channels.",
    keywords: [
      "download MoPlayer",
      "MoPlayer",
      "MoPlayer APK",
      "MoPlayer download",
      "IPTV player",
      "Android TV IPTV player",
      "free IPTV player",
      "M3U player",
      "Xtream player",
      "IPTV player for Windows",
      "IPTV player for PC",
      "MoPlayer Pro",
      "MoPlayer Classic",
      "MoPlayer PC",
      "MoPlayer activation",
      "Mohammad Alfarras",
    ],
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = repairMojibakeDeep(localizedMeta[locale]);
  const pro = await readAppEcosystem("moplayer2");
  const image = normalizePublicImagePath(pro.product.hero_image_path || pro.product.tv_banner_path || pro.screenshots[0]?.image_path || "/images/moplayer-pro-hero.webp");
  return {
    title: meta.title,
    description: meta.description,
    keywords: [...meta.keywords],
    alternates: {
      canonical: `${SITE_URL}/${locale}/apps/moplayer`,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer`,
        en: `${SITE_URL}/en/apps/moplayer`,
        "x-default": `${SITE_URL}/ar/apps/moplayer`,
      },
    },
    openGraph: {
      title: meta.socialTitle,
      description: meta.description,
      url: `${SITE_URL}/${locale}/apps/moplayer`,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: [locale === "ar" ? "en_US" : "ar_SA"],
      images: [{ url: image, width: 1600, height: 900, alt: meta.socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.socialTitle,
      description: meta.description,
      images: [image],
    },
  };
}

export default async function MoPlayerHubRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const meta = repairMojibakeDeep(localizedMeta[loc]);
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "التطبيقات" : "Apps", path: `/${loc}/apps` },
    { name: "MoPlayer", path: `/${loc}/apps/moplayer` },
  ]);
  const collection = collectionPageJsonLd(loc, "apps/moplayer", meta.title, meta.description);
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/${loc}/apps/moplayer#products`,
    name: "MoPlayer product family",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "MoPlayer Classic", url: `${SITE_URL}/${loc}/apps/moplayer/classic` },
      { "@type": "ListItem", position: 2, name: "MoPlayer Pro", url: `${SITE_URL}/${loc}/apps/moplayer2` },
      { "@type": "ListItem", position: 3, name: "MoPlayer PC", url: `${SITE_URL}/${loc}/apps/moplayer-pc` },
      { "@type": "ListItem", position: 4, name: "MoPlayer iOS", url: `${SITE_URL}/${loc}/apps/moplayer-ios` },
    ],
  };
  const [classic, pro, windowsRelease] = await Promise.all([
    readAppEcosystem("moplayer"),
    readAppEcosystem("moplayer2"),
    readLatestWindowsRelease(),
  ]);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(collection) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(itemList) }} />
      <MoPlayerProductHub locale={loc} classic={classic} pro={pro} windowsRelease={windowsRelease} />
    </>
  );
}
