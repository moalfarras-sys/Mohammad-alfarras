import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moalfarras Admin",
    short_name: "MF Admin",
    description: "Control center for the public website, MoPlayer Classic, MoPlayer Pro, and assistant operations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay", "browser"],
    orientation: "portrait",
    background_color: "#020510",
    theme_color: "#020510",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Website", short_name: "Site", url: "/website", description: "Edit the public website" },
      { name: "MoPlayer", short_name: "Classic", url: "/moplayer", description: "Manage MoPlayer Classic" },
      { name: "MoPlayer Pro", short_name: "Pro", url: "/moplayer-pro", description: "Manage MoPlayer Pro" },
      { name: "Email", short_name: "Email", url: "/email", description: "Email inbox" },
    ],
  };
}
