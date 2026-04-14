import type { CmsSnapshot, Locale } from "@/types/cms";

import { getCvBuilderData, getOrderedCvSections, localizeCvText, type CvBuilderData } from "@/lib/cv-builder";
import { formatMonthYear } from "@/lib/locale-format";

export type CvPresentationProject = {
  id: string;
  title: string;
  summary: string;
  href?: string;
  repoUrl?: string;
};

export type CvPresentationExperience = {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
};

export type CvPresentationCertification = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  description: string;
  credentialUrl: string;
};

export type CvPresentationModel = {
  locale: Locale;
  builder: CvBuilderData;
  sections: ReturnType<typeof getOrderedCvSections>;
  projects: CvPresentationProject[];
  experience: CvPresentationExperience[];
  certifications: CvPresentationCertification[];
};

function formatPeriod(locale: Locale, startDate: string, endDate: string | null, currentRole: boolean) {
  const start = formatMonthYear(locale, startDate);
  if (currentRole || !endDate) {
    return `${start} - ${locale === "ar" ? "الآن" : "Present"}`;
  }

  return `${start} - ${formatMonthYear(locale, endDate)}`;
}

export function buildCvPresentationModel(snapshot: CmsSnapshot, locale: Locale, overrideBuilder?: CvBuilderData): CvPresentationModel {
  const builder = overrideBuilder ?? getCvBuilderData(snapshot);
  const selectedIds = new Set(builder.selectedProjectIds);

  const projects = snapshot.work_projects
    .filter((project) => project.is_active && (selectedIds.size === 0 || selectedIds.has(project.id)))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((project) => {
      const translation = snapshot.work_project_translations.find(
        (entry) => entry.project_id === project.id && entry.locale === locale,
      );

      return {
        id: project.id,
        title: translation?.title ?? project.slug,
        summary: translation?.summary ?? "",
        href: project.project_url || undefined,
        repoUrl: project.repo_url || undefined,
      };
    });

  const experience =
    builder.experience.length > 0
      ? builder.experience.map((entry) => ({
          id: entry.id,
          role: locale === "ar" ? entry.role_ar : entry.role_en,
          company: entry.company,
          period: locale === "ar" ? entry.period_ar : entry.period_en,
          location: locale === "ar" ? entry.location_ar : entry.location_en,
          description: locale === "ar" ? entry.summary_ar : entry.summary_en,
          highlights: locale === "ar" ? entry.highlights_ar : entry.highlights_en,
        }))
      : snapshot.experiences
          .filter((entry) => entry.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((entry) => {
            const translation = snapshot.experience_translations.find(
              (item) => item.experience_id === entry.id && item.locale === locale,
            );

            return {
              id: entry.id,
              role: translation?.role_title ?? entry.company,
              company: entry.company,
              period: formatPeriod(locale, entry.start_date, entry.end_date, entry.current_role),
              location: entry.location,
              description: translation?.description ?? "",
              highlights: translation?.highlights_json ?? [],
            };
          });

  const certifications = snapshot.certifications
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const translation = snapshot.certification_translations.find(
        (item) => item.certification_id === entry.id && item.locale === locale,
      );

      return {
        id: entry.id,
        name: translation?.name ?? entry.issuer,
        issuer: entry.issuer,
        issueDate: entry.issue_date,
        description: translation?.description ?? "",
        credentialUrl: entry.credential_url,
      };
    });

  return {
    locale,
    builder,
    sections: getOrderedCvSections(builder),
    projects,
    experience,
    certifications,
  };
}

export function getCvDownloadLinks(locale: Locale, variant: "branded" | "ats" = "branded") {
  return {
    branded_ar: "/api/cv-pdf?locale=ar&variant=branded",
    branded_en: "/api/cv-pdf?locale=en&variant=branded",
    ats_ar: "/api/cv-pdf?locale=ar&variant=ats",
    ats_en: "/api/cv-pdf?locale=en&variant=ats",
    current: `/api/cv-pdf?locale=${locale}&variant=${variant}`,
  };
}

export function getCvSectionLabel(locale: Locale, ar: string, en: string) {
  return localizeCvText(locale, ar, en);
}
