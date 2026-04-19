import type { Metadata } from "next";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { readAppEcosystem } from "@/lib/app-ecosystem";

export const metadata: Metadata = {
  title: "MoPlayer — Cinematic media for Android & Android TV",
  description:
    "MoPlayer is a focused, fast, ad-free Android & Android TV media app built by Mohammad Alfarras. Direct downloads, no tracking, no paywalls, no clutter.",
  alternates: {
    canonical: "https://moalfarras.space/app",
    languages: {
      en: "https://moalfarras.space/en/apps/moplayer",
      ar: "https://moalfarras.space/ar/apps/moplayer",
      "x-default": "https://moalfarras.space/app",
    },
  },
  openGraph: {
    title: "MoPlayer — Cinematic media for Android & Android TV",
    description: "A focused, fast, ad-free media experience for Android and Android TV. Built by Mohammad Alfarras.",
    url: "https://moalfarras.space/app",
    type: "website",
    images: [
      { url: "/images/moplayer-app-cover-final.jpeg", width: 1600, height: 900, alt: "MoPlayer cover" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoPlayer — Cinematic media for Android & Android TV",
    description: "Focused, fast, ad-free Android + Android TV media app.",
    images: ["/images/moplayer-app-cover-final.jpeg"],
  },
};

export default async function AppPage() {
  const ecosystem = await readAppEcosystem("moplayer");
  return <MoPlayerLanding ecosystem={ecosystem} />;
}
