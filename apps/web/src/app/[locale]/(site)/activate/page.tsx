import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerActivationPage } from "@/components/app/moplayer-activation-page";
import { readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { resolveSiteImages, siteImage } from "@/lib/site-images";
import "@/styles/route-activation.css";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

const meta = {
  en: {
    title: "Activate MoPlayer",
    description:
      "Pair MoPlayer on Android TV with moalfarras.space using a short private device code and website activation flow.",
  },
  ar: {
    title: "تفعيل MoPlayer",
    description: "اربط MoPlayer على Android TV مع moalfarras.space باستخدام كود جهاز قصير وخاص.",
  },
} as const;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { product = "" } = await searchParams;
  const isPro = product === "moplayer2";
  const isPc = product === "moplayer-pc";
  const copy = isPc
    ? locale === "ar"
      ? {
          title: "تفعيل MoPlayer PC",
          description: "أكد كود الكمبيوتر وأرسل مصدرك الخاص إلى MoPlayer PC بأمان.",
        }
      : {
          title: "Activate MoPlayer PC",
          description: "Confirm your PC code and securely send your private source to MoPlayer PC.",
        }
    : isPro && locale === "ar"
      ? {
          title: "تفعيل MoPlayer Pro",
          description: "أكد كود التلفاز وأرسل مصدرك الخاص إلى MoPlayer Pro بأمان.",
        }
      : isPro
        ? {
            title: "Activate MoPlayer Pro",
            description:
              "Confirm your TV code and securely send your private source to MoPlayer Pro.",
          }
        : meta[locale];
  const suffix = isPc ? "?product=moplayer-pc" : isPro ? "?product=moplayer2" : "";
  const canonical = `${SITE_URL}/${locale}/activate${suffix}`;
  const socialTitle = `${copy.title} | Mohammad Alfarras`;

  const snapshot = await readSnapshot();
  const siteImages = resolveSiteImages(snapshot);
  const image = siteImage(siteImages, "activation_hero", siteImage(siteImages, "home_product_secondary", "/images/moplayer-activation-flow.webp"));
  const socialImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/activate${suffix}`,
        en: `${SITE_URL}/en/activate${suffix}`,
        "x-default": `${SITE_URL}/ar/activate${suffix}`,
      },
    },
    openGraph: {
      title: socialTitle,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [{ url: socialImage, width: 1600, height: 900, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: socialTitle,
      description: copy.description,
      images: [socialImage],
    },
  };
}

export default async function ActivateRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; device_code?: string; product?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { code = "", device_code = "", product = "" } = await searchParams;

  return (
    <MoPlayerActivationPage
      locale={locale as Locale}
      initialCode={code || device_code}
      productSlug={
        product === "moplayer-pc"
          ? "moplayer-pc"
          : product === "moplayer2"
            ? "moplayer2"
            : "moplayer"
      }
    />
  );
}
