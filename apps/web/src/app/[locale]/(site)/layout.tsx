import { notFound } from "next/navigation";

import { CookieBanner } from "@/components/layout/cookie-banner";
import { DigitalOsClientEffects } from "@/components/layout/digital-os-client-effects";
import { LocaleDocumentSync } from "@/components/layout/locale-document-sync";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { getNavigation } from "@/content/navigation";
import { resolveBrandAssetPaths } from "@/lib/cms-documents";
import { getSiteSetting, readSnapshot } from "@/lib/content/store";
import { isLocale, withLocale } from "@/lib/i18n";

function siteCopy(locale: "ar" | "en") {
  if (locale === "ar") {
    return {
      brandName: "\u0645\u062d\u0645\u062f \u0627\u0644\u0641\u0631\u0627\u0633",
      tagline: "\u0648\u064a\u0628 | \u062a\u0637\u0628\u064a\u0642\u0627\u062a | \u0645\u062d\u062a\u0648\u0649 | \u0644\u0648\u062c\u0633\u062a\u064a\u0627\u062a",
      links: [
        { id: "home", label: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", href: withLocale(locale, "") },
        { id: "work", label: "\u0627\u0644\u0623\u0639\u0645\u0627\u0644", href: withLocale(locale, "work") },
        { id: "apps", label: "\u0627\u0644\u062a\u0637\u0628\u064a\u0642\u0627\u062a", href: withLocale(locale, "apps") },
        { id: "youtube", label: "\u064a\u0648\u062a\u064a\u0648\u0628", href: withLocale(locale, "youtube") },
        { id: "cv", label: "\u0627\u0644\u0633\u064a\u0631\u0629", href: withLocale(locale, "cv") },
        { id: "contact", label: "\u062a\u0648\u0627\u0635\u0644", href: withLocale(locale, "contact") },
      ],
      footer: {
        title: "\u0644\u062f\u064a\u0643 \u0645\u0634\u0631\u0648\u0639 \u064a\u062d\u062a\u0627\u062c \u0623\u0646 \u064a\u064f\u0641\u0647\u0645 \u0623\u0633\u0631\u0639 \u0648\u064a\u064f\u0648\u062b\u0642 \u0628\u0647 \u0623\u0643\u062b\u0631\u061f",
        body: "\u0645\u0648\u0627\u0642\u0639\u060c \u062a\u0637\u0628\u064a\u0642\u0627\u062a\u060c MoPlayer\u060c \u0645\u062d\u062a\u0648\u0649 \u062a\u0642\u0646\u064a\u060c \u0648\u0633\u0631\u062f \u0639\u0645\u0644\u064a \u0645\u0628\u0646\u064a \u0639\u0644\u0649 \u062e\u0628\u0631\u0629 \u0644\u0648\u062c\u0633\u062a\u064a\u0629 \u062d\u0642\u064a\u0642\u064a\u0629.",
        cta: "\u0627\u0628\u062f\u0623 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629",
      },
      portfolioDescription:
        "\u0623\u0639\u0645\u0627\u0644 \u0645\u062d\u0645\u062f \u0627\u0644\u0641\u0631\u0627\u0633: \u0645\u0634\u0627\u0631\u064a\u0639\u060c \u062f\u0631\u0627\u0633\u0627\u062a \u062d\u0627\u0644\u0629\u060c \u0648\u0645\u0646\u062a\u062c\u0627\u062a \u0631\u0642\u0645\u064a\u0629 \u062f\u0627\u062e\u0644 \u0645\u0648\u0642\u0639 \u0634\u062e\u0635\u064a \u0648\u0645\u0647\u0646\u064a \u0648\u0627\u0636\u062d \u0627\u0644\u0628\u0646\u064a\u0629.",
    };
  }

  return {
    brandName: "Mohammad Alfarras",
    tagline: "Web | Apps | Content | Logistics",
    links: [
      { id: "home", label: "Home", href: withLocale(locale, "") },
      { id: "work", label: "Work", href: withLocale(locale, "work") },
      { id: "apps", label: "Apps", href: withLocale(locale, "apps") },
      { id: "youtube", label: "YouTube", href: withLocale(locale, "youtube") },
      { id: "cv", label: "CV", href: withLocale(locale, "cv") },
      { id: "contact", label: "Contact", href: withLocale(locale, "contact") },
    ],
    footer: {
      title: "Have a project that needs to be understood faster and trusted sooner?",
      body: "Websites, apps, MoPlayer, Arabic tech content, and practical business storytelling shaped by real logistics experience.",
      cta: "Start the conversation",
    },
    portfolioDescription:
      "Selected work by Mohammad Alfarras: websites, case studies, and product surfaces inside a personal professional website.",
  };
}

function safePortraitSrc(path: string | null | undefined) {
  if (!path) return "/images/protofeilnew.jpeg";
  const value = path.trim().toLowerCase();
  if (!value) return "/images/protofeilnew.jpeg";
  if (value.includes("service_") || value.includes("moplayer") || value.includes("logo")) {
    return "/images/protofeilnew.jpeg";
  }
  return path;
}

function safeLogoSrc(path: string | null | undefined) {
  if (!path) return "/images/logo.png";
  const value = path.trim().toLowerCase();
  if (!value) return "/images/logo.png";
  if (value.includes("portrait") || value.includes("protofeil") || value.includes("profile")) {
    return "/images/logo.png";
  }
  return path;
}

type YoutubeMetricsSetting = { views?: number; subscribers?: number; videos?: number };

const youtubeMetricsFallback: YoutubeMetricsSetting = {
  views: 1494029,
  subscribers: 6130,
  videos: 162,
};

function formatYoutubeViewsLabel(n: number | undefined): string {
  const v = typeof n === "number" && n > 0 ? n : youtubeMetricsFallback.views!;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M+`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K+`;
  return String(v);
}

function formatYoutubeSubsLabel(n: number | undefined): string {
  const v = typeof n === "number" && n > 0 ? n : youtubeMetricsFallback.subscribers!;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K+`;
  return String(v);
}

function buildFooterQuickFacts(locale: "ar" | "en", yt: YoutubeMetricsSetting) {
  const videoCount =
    typeof yt.videos === "number" && yt.videos > 0 ? yt.videos : youtubeMetricsFallback.videos!;
  const viewsLabel = formatYoutubeViewsLabel(yt.views);
  const arViewsCore = viewsLabel.replace(/\+$/, "").trim();
  if (locale === "ar") {
    return [
      { label: "\u0645\u0642\u064a\u0645 \u0641\u064a", value: "\u0623\u0644\u0645\u0627\u0646\u064a\u0627" },
      { label: "\u0627\u0644\u062c\u0630\u0648\u0631", value: "\u0627\u0644\u062d\u0633\u0643\u0629\u060c \u0633\u0648\u0631\u064a\u0627" },
      { label: "\u0627\u0644\u0644\u063a\u0627\u062a", value: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629 / \u0627\u0644\u0623\u0644\u0645\u0627\u0646\u064a\u0629 / \u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629" },
      { label: "\u064a\u0648\u062a\u064a\u0648\u0628", value: `+${arViewsCore} \u0645\u0634\u0627\u0647\u062f\u0629 \u0639\u0644\u0649 \u064a\u0648\u062a\u064a\u0648\u0628` },
      { label: "\u0627\u0644\u0645\u0634\u062a\u0631\u0643\u0648\u0646", value: formatYoutubeSubsLabel(yt.subscribers) },
      { label: "\u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a", value: String(videoCount) },
      { label: "\u0627\u0644\u0645\u0646\u062a\u062c", value: "MoPlayer" },
    ];
  }
  if (String(locale) === "__legacy_ar_fallback__") {
    return [
      { label: "مقيم في", value: "ألمانيا" },
      { label: "الجذور", value: "الحسكة، سوريا" },
      { label: "اللغات", value: "العربية / الألمانية / الإنجليزية" },
      { label: "يوتيوب", value: `+${arViewsCore} مشاهدة على يوتيوب` },
      { label: "المشتركون", value: formatYoutubeSubsLabel(yt.subscribers) },
      { label: "الفيديوهات", value: String(videoCount) },
      { label: "المنتج", value: "MoPlayer" },
    ];
  }
  return [
    { label: "Based in", value: "Germany" },
    { label: "Roots", value: "Al-Hasakah, Syria" },
    { label: "Languages", value: "Arabic / German / English" },
    { label: "YouTube", value: `${viewsLabel} YouTube views` },
    { label: "Subscribers", value: formatYoutubeSubsLabel(yt.subscribers) },
    { label: "Videos", value: String(videoCount) },
    { label: "Product", value: "MoPlayer" },
  ];
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
  const logoSrc = safeLogoSrc(brandMedia.logo);
  const ytMetrics = getSiteSetting(snapshot, "youtube_channel", youtubeMetricsFallback);
  const footerQuickFacts = buildFooterQuickFacts(locale, ytMetrics);
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
    jobTitle:
      locale === "ar"
        ? "\u0645\u0637\u0648\u0631 \u0648\u064a\u0628 \u0648\u0645\u0635\u0645\u0645 \u0648\u0635\u0627\u0646\u0639 \u0645\u062d\u062a\u0648\u0649 \u062a\u0642\u0646\u064a"
        : "Web developer, designer, and Arabic tech creator",
    worksFor: { "@type": "Organization", name: "Freelance" },
    knowsLanguage: ["ar", "en", "de"],
    address: { "@type": "PostalAddress", addressCountry: "DE" },
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />

      <div className="liquid-site relative min-h-screen" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        <LocaleDocumentSync locale={locale} />
        <div className="noise-overlay" />
        <DigitalOsClientEffects />

        <SiteNavbar locale={locale} links={navLinks} tagline={copy.tagline} logoSrc={logoSrc} brandName={copy.brandName} />
        <main>{children}</main>
        <CookieBanner locale={locale} />
        <SiteFooter
          locale={locale}
          logoSrc={logoSrc}
          brandName={copy.brandName}
          links={navLinks}
          quickFacts={footerQuickFacts}
        />
      </div>
    </>
  );
}
