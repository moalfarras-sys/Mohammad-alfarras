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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = meta[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/activate`,
      languages: {
        ar: `${SITE_URL}/ar/activate`,
        en: `${SITE_URL}/en/activate`,
        "x-default": `${SITE_URL}/en/activate`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${SITE_URL}/${locale}/activate`,
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
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { code = "" } = await searchParams;
  return <MoPlayerActivationPage locale={locale as Locale} initialCode={code} />;
}
