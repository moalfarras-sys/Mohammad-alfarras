import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PortfolioProjectPage } from "@/components/site/portfolio-pages";
import { buildSiteModel } from "@/components/site/site-model";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, creativeWorkJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import "@/styles/route-work.css";
import type { Locale } from "@/types/cms";

export async function generateStaticParams() {
  const params: Array<{ locale: Locale; slug: string }> = [];
  for (const locale of ["en", "ar"] as const) {
    const model = await buildSiteModel({ locale, slug: "work" });
    for (const project of model.projects) {
      params.push({ locale, slug: project.slug });
    }
  }
  return params;
}

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
  const title = `${project.title} | ${locale === "ar" ? "الأعمال" : "Work"}`;
  const socialTitle = `${title} | Mohammad Alfarras`;
  const rawDescription = project.description || project.summary;
  const description =
    rawDescription.length <= 155
      ? rawDescription
      : `${rawDescription
          .slice(0, 154)
          .replace(/\s+\S*$/, "")
          .trimEnd()}…`;
  const normalizedImage = normalizePublicImagePath(project.image);
  const socialImage = /^https?:\/\//i.test(normalizedImage)
    ? normalizedImage
    : `${baseUrl}${normalizedImage.startsWith("/") ? normalizedImage : `/${normalizedImage}`}`;

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
      title: socialTitle,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
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
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(work) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <PortfolioProjectPage model={model} projectId={slug} />
    </>
  );
}
