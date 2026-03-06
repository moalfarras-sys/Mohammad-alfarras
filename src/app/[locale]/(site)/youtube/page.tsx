import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { readVideos } from "@/lib/content/store";
import { YouTubeHub } from "@/components/site/youtube-hub";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "youtube");
}

export default async function YouTubePageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const videos = await readVideos();
  return <YouTubeHub locale={locale as "ar" | "en"} videos={videos} />;
}
