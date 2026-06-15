import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AiAssistantPage } from "@/components/site/ai-assistant-page";
import { SITE_URL } from "@/content/site";
import { readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo-jsonld";
import { resolveSiteImages, siteImage } from "@/lib/site-images";
import type { Locale } from "@/types/cms";

const pageCopy = {
  en: {
    title: "Mo Ai Assistant",
    description: "Ask the moalfarras.space assistant about services, MoPlayer, activation, support, downloads, CV, and project requests.",
  },
  ar: {
    title: "مساعد Mo Ai",
    description: "اسأل مساعد moalfarras.space عن الخدمات، MoPlayer، التفعيل، الدعم، التحميل، السيرة، وطلبات المشاريع.",
  },
} satisfies Record<Locale, { title: string; description: string }>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const copy = pageCopy[loc];
  const canonical = `${SITE_URL}/${loc}/ai`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/ai`,
        en: `${SITE_URL}/en/ai`,
        "x-default": `${SITE_URL}/en/ai`,
      },
    },
    openGraph: {
      title: `${copy.title} | Mohammad Alfarras`,
      description: copy.description,
      url: canonical,
      type: "website",
      locale: loc === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras",
    },
  };
}

export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const copy = pageCopy[loc];
  const snapshot = await readSnapshot();
  const siteImages = resolveSiteImages(snapshot);
  const heroImage = siteImage(siteImages, "ai_hero", "/images/hero_tech.png");
  const page = webPageJsonLd({ locale: loc, path: `/${loc}/ai`, name: copy.title, description: copy.description });
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: copy.title, path: `/${loc}/ai` },
  ]);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <AiAssistantPage locale={loc} heroImage={heroImage} />
    </>
  );
}
