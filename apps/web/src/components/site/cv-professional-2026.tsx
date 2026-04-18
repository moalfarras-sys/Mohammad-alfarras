"use client";

import type { CvPresentationModel } from "@/lib/cv-presenter";
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

  const metrics = [
    {
      label: isArabic ? "سنوات العمل" : "Years Active",
      value: "4+",
      tone: "primary" as const,
    },
    {
      label: isArabic ? "مشاهدة يوتيوب" : "YouTube Views",
      value: "1.5M+",
      tone: "secondary" as const,
    },
    {
      label: isArabic ? "مشروع منجز" : "Projects Delivered",
      value: formatNumber(locale, cv.projects.length + 5),
      tone: "accent" as const,
    },
    {
      label: isArabic ? "الاستجابة" : "Response Time",
      value: isArabic ? "<٢٤ ساعة" : "<24h",
      tone: "primary" as const,
    },
  ];

  return (
    <section className="relative overflow-hidden" data-testid="cv-page">
      <CvShowcase
        cv={cv}
        metrics={metrics}
        youtube={{
          subscribers: formatNumber(locale, Number(model.youtube.subscribers ?? 6100), {
            notation: "compact",
            maximumFractionDigits: 1,
          }),
          videos: formatNumber(locale, Number(model.youtube.videos ?? 162)),
        }}
      />
    </section>
  );
}
