import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePage, buildSiteModel } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, videoObjectJsonLd, webPageJsonLd } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "youtube");
}

export default async function YoutubeRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const model = await buildSiteModel({ locale: loc, slug: "youtube" });
  const featured = model.featuredVideo ?? model.latestVideos[0];

  const page = webPageJsonLd({
    locale: loc,
    path: `/${loc}/youtube`,
    name: loc === "ar" ? "قناة يوتيوب — محمد الفراس" : "YouTube — Mohammad Alfarras",
    description:
      loc === "ar"
        ? "محتوى تقني عربي من محمد الفراس: +1.5 مليون مشاهدة، +6 آلاف مشترك."
        : "Arabic tech content from Mohammad Alfarras: 1.5M+ views, 6K+ subscribers.",
  });
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "يوتيوب" : "YouTube", path: `/${loc}/youtube` },
  ]);

  const videoJson = featured
    ? videoObjectJsonLd({
        locale: loc,
        title: (loc === "ar" ? featured.title_ar : featured.title_en) || featured.youtube_id,
        description: (loc === "ar" ? featured.description_ar : featured.description_en) || "",
        thumbnailUrl: featured.thumbnail,
        uploadDate: featured.published_at,
        duration: featured.duration,
        youtubeId: featured.youtube_id,
      })
    : null;

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      {videoJson ? <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(videoJson) }} /> : null}
      <SitePage locale={loc} slug="youtube" />
    </>
  );
}
