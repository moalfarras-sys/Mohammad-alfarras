import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PortfolioProjectPage } from "@/components/site/portfolio-pages";
import { buildSiteModel } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const model = await buildSiteModel({ locale, slug: "work" });
  const project = model.projects.find((entry) => entry.slug === slug);
  if (!project) return {};

  const baseUrl = "https://moalfarras.space";
  const path = `/${locale}/work/${slug}`;
  const title = `${project.title} | ${locale === "ar" ? "الأعمال" : "Work"} | Mohammad Alfarras`;
  const description = project.description || project.summary;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: {
        ar: `${baseUrl}/ar/work/${slug}`,
        en: `${baseUrl}/en/work/${slug}`,
        "x-default": `${baseUrl}/en/work/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${baseUrl}${path}`,
      title,
      description,
      images: [
        {
          url: `${baseUrl}${project.image}`,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}${project.image}`],
    },
  };
}

export default async function ProjectDetailRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const model = await buildSiteModel({ locale, slug: "work" });
  const project = model.projects.find((entry) => entry.slug === slug);
  if (!project) notFound();

  return <PortfolioProjectPage model={model} slug={slug} />;
}
