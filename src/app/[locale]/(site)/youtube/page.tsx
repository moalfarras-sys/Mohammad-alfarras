import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { YouTubeHub } from "@/components/site/youtube-hub";
import { readVideos } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "youtube");
}

export default async function YouTubePageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const videos = await readVideos();
  return <YouTubeHub locale={locale} videos={videos} />;
}
