import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/downloads/", "/draft/", "/*/draft/", "/ai", "/ar/ai", "/en/ai"],
    },
    sitemap: "https://moalfarras.space/sitemap.xml",
  };
}
