import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/downloads/"],
    },
    sitemap: "https://moalfarras.space/sitemap.xml",
  };
}
