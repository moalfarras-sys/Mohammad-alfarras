import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerActivationPage } from "@/components/app/moplayer-activation-page";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

const SITE_URL = "https://moalfarras.space";

const meta = {
  en: {
    title: "Activate MoPlayer | moalfarras.space",
    description:
      "Pair MoPlayer on Android TV with moalfarras.space using a short private device code and website activation flow.",
  },
  ar: {
    title: "تفعيل MoPlayer | moalfarras.space",
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
  const copy =
    isPro && locale === "ar"
      ? {
          title: "تفعيل MoPlayer Pro | moalfarras.space",
          description: "أكد كود التلفاز وأرسل مصدر M3U أو Xtream إلى MoPlayer Pro.",
        }
      : isPro
        ? {
            title: "Activate MoPlayer Pro | moalfarras.space",
            description: "Confirm your TV code and send an M3U or Xtream source to MoPlayer Pro.",
          }
        : meta[locale];
  const suffix = isPro ? "?product=moplayer2" : "";
  const canonical = `${SITE_URL}/${locale}/activate${suffix}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/activate${suffix}`,
        en: `${SITE_URL}/en/activate${suffix}`,
        "x-default": `${SITE_URL}/en/activate${suffix}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      images: [{ url: "/images/moplayer-activation-flow.webp", width: 1600, height: 900, alt: copy.title }],
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
      productSlug={product === "moplayer2" ? "moplayer2" : "moplayer"}
    />
  );
}
