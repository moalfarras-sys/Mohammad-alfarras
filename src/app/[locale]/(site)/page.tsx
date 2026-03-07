import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePage } from "@/components/site/home-page";
import { readPage, readSnapshot, readVideos } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "home");
}

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [page, snapshot, videos] = await Promise.all([readPage(locale, "home"), readSnapshot(), readVideos()]);
  if (!page) notFound();

  return <HomePage locale={locale} page={page} snapshot={snapshot} videos={videos} />;
}
