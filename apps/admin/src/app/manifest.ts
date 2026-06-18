import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moalfarras Admin",
    short_name: "MF Admin",
    description: "Control center for the public website, MoPlayer Suite, MoPlayer iOS, and assistant operations.",
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
      { name: "MoPlayer Suite", short_name: "Apps", url: "/moplayer", description: "Manage all MoPlayer editions" },
      { name: "MoPlayer iOS", short_name: "iOS", url: "/moplayer/ios", description: "Manage MoPlayer iOS" },
      { name: "MoPlayer Pro", short_name: "Pro", url: "/moplayer/pro", description: "Manage MoPlayer Pro" },
      { name: "Email", short_name: "Email", url: "/email", description: "Email inbox" },
    ],
  };
}
