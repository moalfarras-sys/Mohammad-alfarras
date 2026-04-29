import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moalfarras Admin",
    short_name: "Admin",
    description: "Digital OS control center for the public website and MoPlayer operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#050914",
    theme_color: "#050914",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
