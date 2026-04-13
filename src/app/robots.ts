import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/ar/admin", "/en/admin"] }],
    host: "https://moalfarras.space",
    sitemap: "https://moalfarras.space/sitemap.xml",
  };
}
