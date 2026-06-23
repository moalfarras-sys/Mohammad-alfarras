import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InteractiveCvPage } from "@/components/site/interactive-cv-page";
import { buildSiteModel } from "@/components/site/site-model";
import { youtubeChannel } from "@/content/site-data";
import { isLocale } from "@/lib/i18n";
import {
  breadcrumbJsonLd,
  jsonLdString,
  personExpandedJsonLd,
  webPageJsonLd,
} from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import "@/styles/route-cv.css";
import type { Locale } from "@/types/cms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "cv");
}

export default async function LocaleCvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const model = await buildSiteModel({ locale: loc, slug: "cv" });
  const views =
    Number(
      model.live.youtube?.totalViews ?? model.youtube.views ?? youtubeChannel.fallback.views,
    ) || youtubeChannel.fallback.views;
  const subscribers =
    Number(
      model.live.youtube?.subscribers ??
        model.youtube.subscribers ??
        youtubeChannel.fallback.subscribers,
    ) || youtubeChannel.fallback.subscribers;
  const videos =
    Number(
      model.live.youtube?.videoCount ?? model.youtube.videos ?? youtubeChannel.fallback.videos,
    ) || youtubeChannel.fallback.videos;
  // Counts are derived from real site data so the CV stats stay in sync: add a client
  // project in the admin (or a MoPlayer surface below) and the numbers rise automatically.
  const projectsCount =
    model.projects.filter((project) => !/moplayer/i.test(String(project.id))).length ||
    5;
  // MoPlayer ships on four surfaces today: Classic + Pro (Android/Android TV), PC (Windows),
  // and iPhone. Counted from this list so adding a surface bumps the stat.
  const appSurfaces = ["moplayer-classic", "moplayer-pro", "moplayer-pc", "moplayer-ios"];
  const appsCount = appSurfaces.length;
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "السيرة الذاتية" : "CV", path: `/${loc}/cv` },
  ]);
  const page = webPageJsonLd({
    locale: loc,
    path: `/${loc}/cv`,
    name: loc === "ar" ? "السيرة الذاتية — محمد الفراس" : "Curriculum vitae — Mohammad Alfarras",
    description:
      loc === "ar"
        ? "الخبرة المهنية، مبادئ العمل، والشهادات لمحمد الفراس."
        : "Professional experience, working principles, and credentials for Mohammad Alfarras.",
  });

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(personExpandedJsonLd(loc)) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(page) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <InteractiveCvPage
        locale={loc}
        profileName={model.profile.name}
        portrait="/images/portrait.jpg"
        downloads={{ branded: model.downloads.branded, docx: model.downloads.docx }}
        stats={{ views, subscribers, videos, projects: projectsCount, apps: appsCount }}
        experience={model.cvExperience}
      />
    </>
  );
}
