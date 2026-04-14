"use client";

import { getCvDownloadLinks, type CvPresentationModel } from "@/lib/cv-presenter";
import { formatNumber } from "@/lib/locale-format";

import { CvShowcase } from "./cv-showcase";
import type { SiteViewModel } from "./site-view-client";

function toPresentation(model: SiteViewModel): CvPresentationModel {
  return {
    locale: model.locale,
    builder: model.cvBuilder,
    sections: model.cvSections,
    projects: model.cvProjects,
    experience: model.cvExperience,
    certifications: model.certifications,
  };
}

export function CvProfessional2026({ model }: { model: SiteViewModel }) {
  const cv = toPresentation(model);
  const locale = model.locale;
  const isArabic = locale === "ar";
  const links = getCvDownloadLinks(locale, cv.builder.theme.defaultVariant);

  const metrics = [
    {
      label: isArabic ? "الخبرات" : "Roles",
      value: formatNumber(locale, cv.experience.length),
      tone: "primary" as const,
    },
    {
      label: isArabic ? "المشاريع" : "Projects",
      value: formatNumber(locale, cv.projects.length),
      tone: "secondary" as const,
    },
    {
      label: isArabic ? "المهارات" : "Skills",
      value: formatNumber(locale, cv.builder.skills.length),
      tone: "accent" as const,
    },
    {
      label: isArabic ? "يوتيوب" : "YouTube",
      value: formatNumber(locale, Number(model.youtube.subscribers ?? 0), {
        notation: "compact",
        maximumFractionDigits: 1,
      }),
      tone: "primary" as const,
    },
  ];

  return (
    <section className="relative overflow-hidden" data-testid="cv-page">
      <CvShowcase
        cv={cv}
        metrics={metrics}
        cta={{
          primaryLabel: isArabic ? "تحميل النسخة المعتمدة" : "Download branded PDF",
          primaryHref: links.current,
          secondaryLabel: isArabic ? "تحميل نسخة ATS" : "Download ATS PDF",
          secondaryHref: isArabic ? links.ats_ar : links.ats_en,
        }}
      />
    </section>
  );
}
