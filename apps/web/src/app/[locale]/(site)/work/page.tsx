import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePage } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, collectionPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "work");
}

export default async function WorkRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "الأعمال" : "Work", path: `/${loc}/work` },
  ]);
  const collection = collectionPageJsonLd(
    loc,
    "work",
    loc === "ar" ? "أعمال محمد الفراس" : "Mohammad Alfarras — Work",
    loc === "ar"
      ? "أعمال ودراسات حالة مختارة تعرض كيف تتحول المشاريع إلى واجهات أوضح وحضور رقمي أقوى."
      : "Selected case studies and product work showing clearer structure, stronger trust, and sharper digital presentation.",
  );

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(collection) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <SitePage locale={loc} slug="work" />
    </>
  );
}
