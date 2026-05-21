import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MOALFARRAS",
    short_name: "MOALFARRAS",
    description: "Bilingual personal brand for Mohammad Alfarras.",
    start_url: "/ar",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "1024x768",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
