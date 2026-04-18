import { notFound } from "next/navigation";

import { AtmosphericBackground } from "@/components/layout/atmospheric-background";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { LocaleDocumentSync } from "@/components/layout/locale-document-sync";
import { MobileDock } from "@/components/layout/mobile-dock";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { resolveBrandAssetPaths, resolveRebuildLocaleContent } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import { isLocale, withLocale } from "@/lib/i18n";

function absoluteSiteUrl(siteUrl: string, value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const snapshot = await readSnapshot();
  const copy = resolveRebuildLocaleContent(snapshot, locale);
  const brandMedia = resolveBrandAssetPaths(snapshot);
  const siteUrl = "https://moalfarras.space";
  const profileUrl = `${siteUrl}/${locale}`;

  const links = [
    { id: "home", label: locale === "ar" ? "الرئيسية" : "Home", href: withLocale(locale, "") },
    { id: "work", label: locale === "ar" ? "أعمالي" : "My Work", href: withLocale(locale, "work") },
    { id: "youtube", label: copy.nav.youtube, href: withLocale(locale, "youtube") },
    { id: "contact", label: copy.nav.contact, href: withLocale(locale, "contact") },
  ];

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: copy.brandName,
    url: profileUrl,
    image: absoluteSiteUrl(siteUrl, brandMedia.profilePortrait),
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
      "https://de.linkedin.com/in/mohammad-alfarras-525531262",
      "https://www.instagram.com/moalfarras",
    ],
    jobTitle: locale === "ar" ? "مطور ومصمم وصانع محتوى تقني" : "Web developer, designer, and Arabic tech content creator",
    worksFor: { "@type": "Organization", name: "Freelance" },
    knowsLanguage: ["ar", "en", "de"],
    hasOccupation: {
      "@type": "Occupation",
      name: locale === "ar" ? "مطور ومصمم مواقع" : "Frontend Developer and Web Designer",
    },
    address: { "@type": "PostalAddress", addressCountry: "DE" },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: copy.brandName,
    author: { "@id": `${siteUrl}/#person` },
    inLanguage: [locale === "ar" ? "ar-SA" : "en-US", locale === "ar" ? "en-US" : "ar-SA"],
    potentialAction: { "@type": "ReadAction", target: `${siteUrl}/${locale}` },
  };

  const portfolioJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/${locale}/work#collection`,
    name: locale === "ar" ? `أعمال ${copy.brandName}` : `${copy.brandName} Portfolio`,
    url: `${siteUrl}/${locale}/work`,
    author: { "@id": `${siteUrl}/#person` },
    description: copy.projects.body,
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd) }} />

      <div className="relative min-h-screen">
        <LocaleDocumentSync locale={locale} />
        <AtmosphericBackground />
        <SiteNavbar locale={locale} links={links} tagline={copy.navTagline} logoSrc={brandMedia.logo} brandName={copy.brandName} />
        <main className="pb-[7.25rem] lg:pb-0">{children}</main>
        <CookieBanner locale={locale} />
        <MobileDock locale={locale} />
        <SiteFooter locale={locale} logoSrc={brandMedia.logo} content={{ brandName: copy.brandName, nav: copy.nav, navTagline: copy.navTagline, footer: copy.footer, contact: copy.contact }} />
      </div>
    </>
  );
}
