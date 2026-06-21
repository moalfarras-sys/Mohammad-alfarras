import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // The admin control center must never be indexed. Hard wall, and no pointer
  // to the public-site sitemap/host (this is a separate admin deployment).
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
