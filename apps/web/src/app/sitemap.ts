import type { MetadataRoute } from "next";

import { readSnapshot } from "@/lib/content/store";

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
  { path: "/apps/moplayer2", priority: 0.9, changeFrequency: "weekly" },
  { path: "/activate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/youtube", priority: 0.8, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/support", priority: 0.55, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.45, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const snapshot = await readSnapshot();

  const localized = (["ar", "en"] as const).flatMap((locale) =>
    localizedRoutes.map<MetadataRoute.Sitemap[number]>((route) => ({
      url: `${BASE}/${locale}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          ar: `${BASE}/ar${route.path}`,
          en: `${BASE}/en${route.path}`,
          "x-default": `${BASE}/en${route.path}`,
        },
      },
    })),
  );

  const projectRoutes = snapshot.work_projects
    .filter((project) => project.is_active && project.slug)
    .map((project) => ({
      slug: project.slug,
      updatedAt: project.updated_at ? new Date(project.updated_at) : now,
    }));

  const localizedProjects = (["ar", "en"] as const).flatMap((locale) =>
    projectRoutes.map<MetadataRoute.Sitemap[number]>((project) => ({
      url: `${BASE}/${locale}/work/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly",
      priority: 0.82,
      alternates: {
        languages: {
          ar: `${BASE}/ar/work/${project.slug}`,
          en: `${BASE}/en/work/${project.slug}`,
          "x-default": `${BASE}/en/work/${project.slug}`,
        },
      },
    })),
  );

  const canonical: MetadataRoute.Sitemap = [
    { url: `${BASE}/app`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.35 },
  ];

  return [...localized, ...localizedProjects, ...canonical];
}
