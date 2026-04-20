import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PortfolioProjectPage } from "@/components/site/portfolio-pages";
import { buildSiteModel } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, creativeWorkJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import type { Locale } from "@/types/cms";

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

  const loc = locale as Locale;
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "الأعمال" : "Work", path: `/${loc}/work` },
    { name: project.title, path: `/${loc}/work/${slug}` },
  ]);
  const work = creativeWorkJsonLd({
    locale: loc,
    title: project.title,
    slug,
    summary: project.description || project.summary,
    image: project.image,
  });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(work) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <PortfolioProjectPage model={model} slug={slug} />
    </>
  );
}
