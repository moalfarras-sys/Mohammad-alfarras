import type { MetadataRoute } from "next";

/**
 * Sitemap for Google + Bing + Yandex + IndexNow.
 * Locale pairs (ar/en) are declared via `alternates.languages` so search
 * engines understand bilingual parity. /app is preserved as legacy but points
 * to /en/apps/moplayer as the canonical product URL.
 */

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
  { path: "/work/seeltransport", priority: 0.82, changeFrequency: "monthly" },
  { path: "/work/schnellsicherumzug", priority: 0.82, changeFrequency: "monthly" },
  { path: "/work/moplayer", priority: 0.8, changeFrequency: "monthly" },
  { path: "/apps", priority: 0.9, changeFrequency: "weekly" },
  { path: "/apps/moplayer", priority: 0.95, changeFrequency: "weekly" },
  { path: "/activate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/youtube", priority: 0.75, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/support", priority: 0.55, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.45, changeFrequency: "yearly" },
];

const BASE = "https://moalfarras.space";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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

  const canonical: MetadataRoute.Sitemap = [
    { url: `${BASE}/app`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.35 },
  ];

  return [...localized, ...canonical];
}
