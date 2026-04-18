import type { Metadata } from "next";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { readAppEcosystem } from "@/lib/app-ecosystem";

export const metadata: Metadata = {
  title: "MoPlayer",
  description: "Official MoPlayer product page with Android and Android TV release details, APK downloads, changelog, support, and privacy information.",
  alternates: {
    canonical: "https://moalfarras.space/app",
  },
  openGraph: {
    title: "MoPlayer",
    description: "Android and Android TV media experience under the Moalfarras ecosystem.",
    url: "https://moalfarras.space/app",
    type: "website",
    images: [{ url: "/images/moplayer-brand-glow-card.png", width: 1600, height: 900, alt: "MoPlayer brand preview" }],
  },
};

export default async function AppPage() {
  const ecosystem = await readAppEcosystem("moplayer");
  return <MoPlayerLanding ecosystem={ecosystem} />;
}
