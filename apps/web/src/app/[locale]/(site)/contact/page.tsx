import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactHubPage } from "@/components/site/contact-hub-page";
import { buildSiteModel } from "@/components/site/site-model";
import { SiteOffersSection } from "@/components/site/site-offers-section";
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
  const model = await buildSiteModel({ locale: loc, slug: "contact" });
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: loc === "ar" ? "تواصل" : "Contact", path: `/${loc}/contact` },
  ]);

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(contactPageJsonLd(loc)) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <ContactHubPage locale={loc} content={model.t.contact} />
      <SiteOffersSection model={model} placement="contact" />
    </>
  );
}
