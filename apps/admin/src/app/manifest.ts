import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "admin Moalfarras",
    short_name: "admin Moalfarras",
    description: "Digital OS control center for the public website and MoPlayer operations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020510",
    theme_color: "#020510",
    icons: [
      { src: "/images/logo.png", sizes: "1024x768", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
