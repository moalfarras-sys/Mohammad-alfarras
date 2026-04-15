import type { MetadataRoute } from "next";

const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cv", priority: 0.8, changeFrequency: "monthly" },
  { path: "/youtube", priority: 0.7, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://moalfarras.space";
  const now = new Date();

  return ["ar", "en"].flatMap((locale) =>
    routes.map((route) => ({
      url: `${base}/${locale}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          ar: `${base}/ar${route.path}`,
          en: `${base}/en${route.path}`,
        },
      },
    })),
  );
}
