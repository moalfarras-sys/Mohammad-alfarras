import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectWizard } from "@/components/site/project-wizard";
import { buildSiteModel } from "@/components/site/site-model";
import { SiteOffersSection } from "@/components/site/site-offers-section";
import { ContactV3 } from "@/components/v3/pages/contact-v3";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, contactPageJsonLd, jsonLdString } from "@/lib/seo-jsonld";
import { pageMetadata } from "@/lib/seo";
import "@/styles/route-contact.css";
import "@/styles/v3-motion.css";
import "@/styles/v3-pages.css";
import "@/styles/v3-contact.css";
import type { Locale } from "@/types/cms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "contact");
}

export default async function ContactPageRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(contactPageJsonLd(loc)) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />
      <ContactV3 locale={loc} content={model.t.contact} />
      <section className="st-section v3k-wizard" id="design-your-project">
        <div className="st-container pw-section">
          <ProjectWizard locale={loc} />
        </div>
      </section>
      <SiteOffersSection model={model} placement="contact" />
    </>
  );
}
