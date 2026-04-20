import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePage } from "@/components/site/site-pages-v3";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, contactPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "contact");
}

export default async function ContactPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "تواصل" : "Contact", path: `/${loc}/contact` },
  ]);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(contactPageJsonLd(loc)) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <SitePage locale={loc} slug="contact" />
    </>
  );
}
