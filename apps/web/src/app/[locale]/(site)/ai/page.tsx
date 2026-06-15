import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SITE_URL } from "@/content/site";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  return {
    title: "Site assistant",
    description: "The site assistant is available as an in-page widget across moalfarras.space.",
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${SITE_URL}/${loc}`,
      languages: {
        ar: `${SITE_URL}/ar`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/en`,
      },
    },
  };
}

export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}`);
}
