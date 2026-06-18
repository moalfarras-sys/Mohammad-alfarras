import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/site/legal-page";
import { SITE_URL } from "@/content/site";
import { legalPageContent, legalPagesPublished, type LegalPageSlug, type LegalPagesSetting } from "@/lib/legal-pages";
import { readSiteSetting, readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { resolveSiteImages, siteImage } from "@/lib/site-images";
import type { Locale } from "@/types/cms";

type RouteParams = { params: Promise<{ locale: string }> };

async function readLegalSetting() {
  return readSiteSetting<LegalPagesSetting>("legal_pages", {});
}

export async function generateLegalMetadata(slug: LegalPageSlug, { params }: RouteParams): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const setting = await readLegalSetting();
  const content = legalPageContent(slug, loc, setting);
  const canonical = `${SITE_URL}/${loc}/${slug}`;

  return {
    title: content.title,
    description: content.description,
    // The Impressum is a permanent legal page and is always available + indexable;
    // the other legal pages stay noindex until published in admin.
    robots: slug === "impressum" || legalPagesPublished(setting) ? undefined : { index: false, follow: false },
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/${slug}`,
        en: `${SITE_URL}/en/${slug}`,
        "x-default": `${SITE_URL}/ar/${slug}`,
      },
    },
  };
}

export async function renderLegalPage(slug: LegalPageSlug, { params }: RouteParams) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const setting = await readLegalSetting();
  // The Impressum must always be reachable (legal requirement + linked in every
  // footer). The other legal pages stay gated behind the admin publish flag.
  if (slug !== "impressum" && !legalPagesPublished(setting)) notFound();
  const snapshot = await readSnapshot();
  const siteImages = resolveSiteImages(snapshot);
  const heroImage = siteImage(siteImages, "legal_hero", "/images/hero_tech.png");
  return <LegalPage content={legalPageContent(slug, locale, setting)} locale={locale} heroImage={heroImage} />;
}
