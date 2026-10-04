import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildSiteModel } from "@/components/site/site-model";
import { AboutPageV3 } from "@/components/v3/about-page";
import { youtubeChannel } from "@/content/site-data";
import { isLocale } from "@/lib/i18n";
import { readReleaseFacts } from "@/lib/moplayer-release-facts";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

import "@/styles/v3-about.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale as Locale, "about");
}

export default async function LocaleAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const [model, moplayer] = await Promise.all([buildSiteModel({ locale: loc, slug: "about" }), readReleaseFacts("moplayer")]);
  const liveSites = model.projects.filter(
    (project) => !/moplayer/i.test(String(project.slug)) && /^https?:\/\//.test(project.href ?? ""),
  ).length;
  const subscribers =
    Number(model.live.youtube?.subscribers ?? model.youtube.subscribers ?? youtubeChannel.fallback.subscribers) ||
    youtubeChannel.fallback.subscribers;

  return <AboutPageV3 locale={loc} liveSites={liveSites} subscribers={subscribers} moplayerVersion={moplayer.version} />;
}
