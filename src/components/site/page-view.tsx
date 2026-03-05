import type { Locale } from "@/types/cms";

import { BlockRenderer } from "@/components/site/block-renderer";
import { SectionRenderer } from "@/components/site/section-renderer";
import { readPage, readSnapshot, readVideos } from "@/lib/content/store";
import { ScrollReveal } from "@/components/layout/scroll-reveal";

import { YoutubeGrid } from "./youtube-grid";

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const [page, snapshot] = await Promise.all([readPage(locale, slug), readSnapshot()]);
  if (!page) {
    return null;
  }

  const videos = slug === "youtube" ? await readVideos() : [];

  const hasBlocks = page.blocks.length > 0;
  const hasVideosBlock = page.blocks.some((block) => block.type === "videos" && block.enabled);

  return (
    <>
      {hasBlocks
        ? page.blocks.map((block) => (
          <ScrollReveal key={block.id}>
            <BlockRenderer block={block} locale={locale} snapshot={snapshot} />
          </ScrollReveal>
        ))
        : page.sections.map((section) => (
          <SectionRenderer key={section.id} locale={locale} section={section} />
        ))}
      {slug === "youtube" && !hasVideosBlock ? <YoutubeGrid locale={locale} videos={videos} /> : null}
    </>
  );
}
