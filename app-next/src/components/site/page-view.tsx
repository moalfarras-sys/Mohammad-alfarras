import type { Locale } from "@/types/cms";

import { SectionRenderer } from "@/components/site/section-renderer";
import { readPage, readVideos } from "@/lib/content/store";

import { YoutubeGrid } from "./youtube-grid";

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const page = await readPage(locale, slug);
  if (!page) {
    return null;
  }

  const videos = slug === "youtube" ? await readVideos() : [];

  return (
    <>
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} locale={locale} section={section} />
      ))}
      {slug === "youtube" ? <YoutubeGrid locale={locale} videos={videos} /> : null}
    </>
  );
}
