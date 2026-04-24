import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePage } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale as Locale, "about");
}

export default async function LocaleAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SitePage locale={locale as Locale} slug="about" />;
}
