import type { MetadataRoute } from "next";

import { buildSiteModel } from "@/components/site/site-model";
import { siteLastModified } from "@/content/site-data";

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
  { path: "/moos", priority: 0.95, changeFrequency: "weekly" },
  { path: "/apps", priority: 0.9, changeFrequency: "weekly" },
  { path: "/apps/moplayer", priority: 0.95, changeFrequency: "weekly" },
  { path: "/apps/moplayer/classic", priority: 0.86, changeFrequency: "weekly" },
  { path: "/apps/moplayer2", priority: 0.9, changeFrequency: "weekly" },
  { path: "/apps/moplayer-ios", priority: 0.82, changeFrequency: "weekly" },
  { path: "/apps/moplayer-pc", priority: 0.86, changeFrequency: "weekly" },
  { path: "/youtube", priority: 0.8, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/support", priority: 0.55, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.45, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // All four legal pages ship their full text in the code and are live, so all
  // four belong in the sitemap. They used to be omitted whenever the CMS flag
  // was unset, which — after the database went away — meant Google only ever
  // saw them as 404s.
  const legalRoutes: RouteDef[] = [
    { path: "/impressum", priority: 0.35, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.35, changeFrequency: "yearly" },
    { path: "/app-disclaimer", priority: 0.35, changeFrequency: "yearly" },
    { path: "/download-disclaimer", priority: 0.35, changeFrequency: "yearly" },
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

  // Derive project URLs from the SAME source the /work pages render from
  // (buildSiteModel → includes the curated showcase when the CMS has no project
  // media). This keeps the sitemap in sync with generateStaticParams so it never
  // lists a /work/<slug> that 404s, nor hides a real one.
  const workModel = await buildSiteModel({ locale: "ar", slug: "work" });
  const seenSlugs = new Set<string>();
  // The project model carries no per-project update date, so every /work URL
  // shares the site-wide lastModified stamp.
  const projectRoutes = workModel.projects
    .filter((project) => project.slug && !seenSlugs.has(project.slug) && seenSlugs.add(project.slug))
    .map((project) => ({ slug: project.slug }));

  const localizedProjects = (["ar", "en"] as const).flatMap((locale) =>
    projectRoutes.map<MetadataRoute.Sitemap[number]>((project) => ({
      url: `${BASE}/${locale}/work/${project.slug}`,
      lastModified: new Date(siteLastModified),
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
