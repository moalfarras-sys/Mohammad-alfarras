import type { MetadataRoute } from "next";

const routes = ["", "/cv", "/blog", "/projects", "/youtube", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://moalfarras.space";
  const now = new Date();

  return ["ar", "en"].flatMap((locale) =>
    routes.map((route) => ({
      url: `${base}/${locale}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
  );
}
