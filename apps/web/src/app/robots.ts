import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/_next/static/", "/_next/image", "/ar/", "/en/", "/ar/privacy", "/en/privacy", "/ar/support", "/en/support", "/app", "/privacy", "/support"],
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    host: "https://moalfarras.space",
    sitemap: "https://moalfarras.space/sitemap.xml",
  };
}
