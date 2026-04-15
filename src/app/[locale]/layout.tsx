import { notFound } from "next/navigation";

import { CookieBanner } from "@/components/layout/cookie-banner";
import { LocaleDocumentSync } from "@/components/layout/locale-document-sync";
import { MobileDock } from "@/components/layout/mobile-dock";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { rebuildContent } from "@/data/rebuild-content";
import { AtmosphericBackground } from "@/components/layout/atmospheric-background";
import { isLocale, localeMeta, withLocale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = rebuildContent[locale];
  const siteUrl = "https://moalfarras.space";
  const profileUrl = `${siteUrl}/${locale}`;

  const links = [
    { id: "home", label: t.nav.home, href: withLocale(locale, "") },
    { id: "cv", label: t.nav.cv, href: withLocale(locale, "cv") },
    { id: "projects", label: t.nav.projects, href: withLocale(locale, "projects") },
    { id: "youtube", label: t.nav.youtube, href: withLocale(locale, "youtube") },
    { id: "contact", label: t.nav.contact, href: withLocale(locale, "contact") },
  ];

  // Structured data: Person schema
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: locale === "ar" ? "محمد الفراس" : "Mohammad Alfarras",
    url: profileUrl,
    image: `${siteUrl}/images/portrait.jpg`,
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
      "https://de.linkedin.com/in/mohammad-alfarras-525531262",
      "https://www.instagram.com/moalfarras",
    ],
    jobTitle: locale === "ar"
      ? "مطور ومصمم وصانع محتوى تقني"
      : "Web developer, designer, and Arabic tech content creator",
    worksFor: {
      "@type": "Organization",
      name: "Freelance",
    },
    knowsLanguage: ["ar", "en", "de"],
    hasOccupation: {
      "@type": "Occupation",
      name: locale === "ar" ? "مطور ومصمم مواقع" : "Frontend Developer and Web Designer",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "DE",
    },
  };

  // Structured data: WebSite schema with search action
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: locale === "ar" ? "محمد الفراس" : "Mohammad Alfarras",
    author: { "@id": `${siteUrl}/#person` },
    inLanguage: [locale === "ar" ? "ar-SA" : "en-US", locale === "ar" ? "en-US" : "ar-SA"],
  };

  return (
    <div lang={locale} dir={localeMeta[locale].dir} className="min-h-screen">
      {/* Structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="relative min-h-screen">
        <LocaleDocumentSync locale={locale} />

        {/* Cinematic Atmospheric Engine — Fluid DRIFTING Glows */}
        <AtmosphericBackground />

        <SiteNavbar locale={locale} links={links} tagline={t.navTagline} />
        <main className="pb-[7.25rem] lg:pb-0">{children}</main>
        <CookieBanner locale={locale} />
        <MobileDock locale={locale} />
        <SiteFooter locale={locale} />
      </div>
    </div>
  );
}
