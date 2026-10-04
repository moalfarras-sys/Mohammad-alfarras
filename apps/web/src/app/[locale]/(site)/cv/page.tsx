import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildSiteModel } from "@/components/site/site-model";
import { CvPageV3 } from "@/components/v3/cv-page";
import { isLocale } from "@/lib/i18n";
import {
  breadcrumbJsonLd,
  jsonLdString,
  personExpandedJsonLd,
  webPageJsonLd,
} from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

import "@/styles/v3-cv.css";

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
  const isAr = loc === "ar";
  const model = await buildSiteModel({ locale: loc, slug: "cv" });
  // Counted from the project data: client projects with a live URL.
  const liveSites = model.projects.filter(
    (project) => !/moplayer/i.test(String(project.slug)) && /^https?:\/\//.test(project.href ?? ""),
  ).length;
  const education = model.cvBuilder.education.map((entry) => ({
    id: entry.id,
    school: isAr ? entry.school_ar : entry.school_en,
    degree: isAr ? entry.degree_ar : entry.degree_en,
    period: entry.period,
    location: isAr ? entry.location_ar : entry.location_en,
  }));

  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: isAr ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: isAr ? "السيرة الذاتية" : "CV", path: `/${loc}/cv` },
  ]);
  const page = webPageJsonLd({
    locale: loc,
    path: `/${loc}/cv`,
    name: isAr ? "السيرة الذاتية — محمد الفراس" : "Curriculum vitae — Mohammad Alfarras",
    description: isAr
      ? "الخبرة المهنية، المهارات، المشاريع المختارة وملفات السيرة الذاتية لمحمد الفراس."
      : "Professional experience, skills, selected projects and CV downloads for Mohammad Alfarras.",
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
      <CvPageV3
        locale={loc}
        profileName={model.profile.name}
        portrait="/images/portrait.jpg"
        downloads={{ branded: model.downloads.branded, docx: model.downloads.docx }}
        experience={model.cvExperience}
        education={education}
        projects={model.projects}
        liveSites={liveSites}
      />
    </>
  );
}
