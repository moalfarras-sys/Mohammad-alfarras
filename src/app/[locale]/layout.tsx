import { notFound } from "next/navigation";

import { CookieBanner } from "@/components/layout/cookie-banner";
import { LocaleDocumentSync } from "@/components/layout/locale-document-sync";
import { MobileDock } from "@/components/layout/mobile-dock";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { rebuildContent } from "@/data/rebuild-content";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.brandName,
    url: profileUrl,
    sameAs: ["https://www.youtube.com/@Moalfarras", "https://github.com/moalfarras-sys"],
    jobTitle: "Web developer, designer, and Arabic tech content creator",
  };

  return (
    <div lang={locale} dir={localeMeta[locale].dir} className="min-h-screen">
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative min-h-screen">
        <LocaleDocumentSync locale={locale} />

        {/* Animated secondary mesh overlay */}
        <div className="mesh-animated-overlay" aria-hidden="true" />

        {/* Subtle grid lines pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.018]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,135,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,135,1) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        <SiteNavbar locale={locale} links={links} tagline={t.navTagline} />
        <main className="pb-[7.25rem] lg:pb-0">{children}</main>
        <CookieBanner locale={locale} />
        <MobileDock locale={locale} />
        <SiteFooter locale={locale} />
      </div>
    </div>
  );
}
