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
        allow: [
          "/",
          "/_next/static/",
          "/_next/image",
          "/ar/",
          "/en/",
          "/ar/apps",
          "/en/apps",
          "/ar/apps/moplayer",
          "/en/apps/moplayer",
          "/ar/apps/moplayer2",
          "/en/apps/moplayer2",
          "/ar/activate",
          "/en/activate",
          "/ar/privacy",
          "/en/privacy",
          "/ar/support",
          "/en/support",
          "/app",
          "/privacy",
          "/support",
        ],
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    host: "https://moalfarras.space",
    sitemap: "https://moalfarras.space/sitemap.xml",
  };
}
