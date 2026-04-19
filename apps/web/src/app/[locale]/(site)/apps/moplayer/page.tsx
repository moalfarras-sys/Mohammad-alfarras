import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MoPlayerLanding } from "@/components/app/moplayer-landing";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { isLocale } from "@/lib/i18n";

const localizedMeta = {
  ar: {
    title: "MoPlayer | تطبيق التشغيل ضمن منظومة محمد الفراس",
    description:
      "MoPlayer: تجربة تشغيل وسائط حديثة وسريعة على Android و Android TV ضمن منظومة منتجات محمد الفراس.",
  },
  en: {
    title: "MoPlayer | Mohammad Alfarras product ecosystem",
    description:
      "MoPlayer: a modern, fast media experience for Android and Android TV inside the Mohammad Alfarras product ecosystem.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = localizedMeta[locale];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `https://moalfarras.space/${locale}/apps/moplayer`,
      languages: {
        ar: "https://moalfarras.space/ar/apps/moplayer",
        en: "https://moalfarras.space/en/apps/moplayer",
        "x-default": "https://moalfarras.space/en/apps/moplayer",
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://moalfarras.space/${locale}/apps/moplayer`,
      type: "website",
      images: [{ url: "/images/moplayer-app-cover-final.jpeg", width: 1600, height: 900, alt: "MoPlayer" }],
    },
  };
}

export default async function MoPlayerLocaleRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ecosystem = await readAppEcosystem("moplayer");
  return <MoPlayerLanding ecosystem={ecosystem} locale={locale} />;
}
