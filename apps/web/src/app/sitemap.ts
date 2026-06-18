import type { MetadataRoute } from "next";

import { getSiteSetting, readSnapshot } from "@/lib/content/store";
import { siteLastModified } from "@/content/site-data";
import { legalPagesPublished, type LegalPagesSetting } from "@/lib/legal-pages";

const BASE = "https://moalfarras.space";

type RouteDef = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const localizedRoutes: RouteDef[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.85, changeFrequency: "monthly" },
  { path: "/services", priority: 0.85, changeFrequency: "monthly" },
  { path: "/cv", priority: 0.9, changeFrequency: "monthly" },
  { path: "/work", priority: 0.9, changeFrequency: "weekly" },
  { path: "/apps", priority: 0.9, changeFrequency: "weekly" },
  { path: "/apps/moplayer", priority: 0.95, changeFrequency: "weekly" },
  { path: "/apps/moplayer/classic", priority: 0.86, changeFrequency: "weekly" },
  { path: "/apps/moplayer2", priority: 0.9, changeFrequency: "weekly" },
  { path: "/apps/moplayer-ios", priority: 0.82, changeFrequency: "weekly" },
  { path: "/apps/moplayer-pc", priority: 0.86, changeFrequency: "weekly" },
  { path: "/activate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/moplayer/setup", priority: 0.55, changeFrequency: "monthly" },
  { path: "/youtube", priority: 0.8, changeFrequency: "weekly" },
  { path: "/ai", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/support", priority: 0.55, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.45, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await readSnapshot();
  const legalPages = getSiteSetting<LegalPagesSetting>(snapshot, "legal_pages", {});
  const legalRoutes: RouteDef[] = [
    // Impressum is always live and indexable; the rest follow the publish flag.
    { path: "/impressum", priority: 0.35, changeFrequency: "yearly" },
    ...(legalPagesPublished(legalPages)
      ? [
          { path: "/terms", priority: 0.35, changeFrequency: "yearly" as const },
          { path: "/app-disclaimer", priority: 0.35, changeFrequency: "yearly" as const },
          { path: "/download-disclaimer", priority: 0.35, changeFrequency: "yearly" as const },
        ]
      : []),
  ];

  const localized = (["ar", "en"] as const).flatMap((locale) =>
    [...localizedRoutes, ...legalRoutes].map<MetadataRoute.Sitemap[number]>((route) => ({
      url: `${BASE}/${locale}${route.path}`,
      lastModified: new Date(siteLastModified),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          ar: `${BASE}/ar${route.path}`,
          en: `${BASE}/en${route.path}`,
          "x-default": `${BASE}/ar${route.path}`,
        },
      },
    })),
  );

  const projectRoutes = snapshot.work_projects
    .filter((project) => project.is_active && project.slug)
    .map((project) => ({
      slug: project.slug,
      updatedAt: project.updated_at ? new Date(project.updated_at) : undefined,
    }));

  const localizedProjects = (["ar", "en"] as const).flatMap((locale) =>
    projectRoutes.map<MetadataRoute.Sitemap[number]>((project) => ({
      url: `${BASE}/${locale}/work/${project.slug}`,
      lastModified:
        project.updatedAt && !Number.isNaN(project.updatedAt.getTime())
          ? project.updatedAt
          : new Date(siteLastModified),
      changeFrequency: "monthly",
      priority: 0.82,
      alternates: {
        languages: {
          ar: `${BASE}/ar/work/${project.slug}`,
          en: `${BASE}/en/work/${project.slug}`,
          "x-default": `${BASE}/ar/work/${project.slug}`,
        },
      },
    })),
  );

  return [...localized, ...localizedProjects];
}
