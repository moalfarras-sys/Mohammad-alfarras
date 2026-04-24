import { notFound } from "next/navigation";

import { AtmosphericBackground } from "@/components/layout/atmospheric-background";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { HireMeFab } from "@/components/layout/hire-me-fab";
import { LocaleDocumentSync } from "@/components/layout/locale-document-sync";
import { MobileDock } from "@/components/layout/mobile-dock";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { getNavigation } from "@/content/navigation";
import { resolveBrandAssetPaths } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import { isLocale, withLocale } from "@/lib/i18n";

function siteCopy(locale: "ar" | "en") {
  if (locale === "ar") {
    return {
      brandName: "محمد الفراس",
      tagline: "حضور رقمي · منتجات · محتوى تقني",
      links: [
        { id: "home", label: "الرئيسية", href: withLocale(locale, "") },
        { id: "work", label: "الأعمال", href: withLocale(locale, "work") },
        { id: "apps", label: "التطبيقات", href: withLocale(locale, "apps") },
        { id: "youtube", label: "يوتيوب", href: withLocale(locale, "youtube") },
        { id: "cv", label: "السيرة", href: withLocale(locale, "cv") },
        { id: "contact", label: "تواصل", href: withLocale(locale, "contact") },
      ],
      footer: {
        title: "إذا كان لديك مشروع يحتاج وضوحاً تقنياً وحضوراً أقوى، فلنرتبه بشكل صحيح.",
        body: "الهوية الشخصية، الأعمال، MoPlayer، الدعم، الخصوصية، والسيرة تعمل هنا كمنظومة واحدة.",
        cta: "ابدأ التواصل",
      },
      portfolioDescription:
        "أعمال محمد الفراس: مشاريع، دراسات حالة، ومنتجات رقمية داخل موقع شخصي ومهني واضح البنية.",
    };
  }

  return {
    brandName: "Mohammad Alfarras",
    tagline: "Personal site · digital work · tech content",
    links: [
      { id: "home", label: "Home", href: withLocale(locale, "") },
      { id: "work", label: "Work", href: withLocale(locale, "work") },
      { id: "apps", label: "Apps", href: withLocale(locale, "apps") },
      { id: "youtube", label: "YouTube", href: withLocale(locale, "youtube") },
      { id: "cv", label: "CV", href: withLocale(locale, "cv") },
      { id: "contact", label: "Contact", href: withLocale(locale, "contact") },
    ],
    footer: {
      title: "If your project needs clearer technical presence, let’s structure it properly.",
      body: "Personal identity, work, MoPlayer, support, privacy, and CV now operate as one ecosystem.",
      cta: "Get in touch",
    },
    portfolioDescription:
      "Selected work by Mohammad Alfarras: websites, case studies, and product surfaces inside a personal professional website.",
  };
}

function safePortraitSrc(path: string | null | undefined) {
  if (!path) return "/images/portrait.jpg";
  const value = path.trim().toLowerCase();
  if (!value) return "/images/portrait.jpg";
  if (value.includes("service_") || value.includes("moplayer") || value.includes("logo")) {
    return "/images/portrait.jpg";
  }
  return path;
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
  const brandMedia = resolveBrandAssetPaths(snapshot);
  const portraitSrc = safePortraitSrc(brandMedia.profilePortrait);
  const copy = siteCopy(locale);
  const siteUrl = "https://moalfarras.space";

  const navLinks = getNavigation(locale);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: copy.brandName,
    url: `${siteUrl}/${locale}`,
    image: portraitSrc.startsWith("http") ? portraitSrc : `${siteUrl}${portraitSrc}`,
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
      "https://de.linkedin.com/in/mohammad-alfarras-525531262",
      "https://www.instagram.com/moalfarras",
    ],
    jobTitle: locale === "ar" ? "مطور ويب ومصمم وصانع محتوى تقني" : "Web developer, designer, and Arabic tech creator",
    worksFor: { "@type": "Organization", name: "Freelance" },
    knowsLanguage: ["ar", "en", "de"],
    address: { "@type": "PostalAddress", addressCountry: "DE" },
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <div className="liquid-site relative min-h-screen">
        <LocaleDocumentSync locale={locale} />
        <AtmosphericBackground />
        <SiteNavbar locale={locale} links={navLinks} tagline={copy.tagline} logoSrc={portraitSrc} brandName={copy.brandName} />
        <main className="pb-dock lg:pb-0">{children}</main>
        <CookieBanner locale={locale} />
        <MobileDock locale={locale} />
        <HireMeFab locale={locale} />
        <SiteFooter locale={locale} logoSrc={portraitSrc} brandName={copy.brandName} tagline={copy.tagline} links={navLinks} footer={copy.footer} />
      </div>
    </>
  );
}
