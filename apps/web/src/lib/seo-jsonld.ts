import type { Locale } from "@/types/cms";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

const BASE_URL = "https://moalfarras.space";
const SITE_NAME = "Mohammad Alfarras";

export function breadcrumbJsonLd(
  locale: Locale,
  trail: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${BASE_URL}${item.path.startsWith("/") ? item.path : `/${locale}/${item.path}`}`,
    })),
  };
}

export function profilePageJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${BASE_URL}/${locale}/#profile`,
    url: `${BASE_URL}/${locale}`,
    name: locale === "ar" ? "محمد الفراس — موقع شخصي" : `${SITE_NAME} — Personal site`,
    inLanguage: locale === "ar" ? "ar-SA" : "en-US",
    mainEntity: { "@id": `${BASE_URL}/#person` },
    about: { "@id": `${BASE_URL}/#person` },
  };
}

export function personExpandedJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${BASE_URL}/#person`,
    name: SITE_NAME,
    alternateName: "محمد الفراس",
    url: `${BASE_URL}/${locale}`,
    image: `${BASE_URL}/images/protofeilnew.jpeg`,
    jobTitle: locale === "ar" ? "مطور ويب، مصمم، صانع محتوى تقني" : "Web developer, designer, Arabic tech creator",
    knowsAbout: [
      "Business websites",
      "Digital products",
      "Interface design",
      "Content management",
      "Android apps",
      "Product design",
      "YouTube content",
    ],
    knowsLanguage: ["ar", "en", "de"],
    worksFor: { "@type": "Organization", name: "Freelance" },
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
      "https://de.linkedin.com/in/mohammad-alfarras-525531262",
      "https://www.instagram.com/moalfarras",
    ],
    address: { "@type": "PostalAddress", addressCountry: "DE" },
  };
}

/**
 * ProfessionalService entity for the home page: tells search engines the site
 * offers website design/development, in which languages, and for which regions
 * (Arabic-speaking markets + Germany/Europe).
 */
export function professionalServiceJsonLd(locale: Locale) {
  const isAr = locale === "ar";
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${BASE_URL}/#service`,
    name: isAr ? "محمد الفراس — تصميم وتطوير مواقع" : `${SITE_NAME} — Website Design & Development`,
    url: `${BASE_URL}/${locale}`,
    image: `${BASE_URL}/images/protofeilnew.jpeg`,
    description: isAr
      ? "تصميم مواقع احترافية، صفحات هبوط، متاجر إلكترونية وتطبيقات ويب سريعة بالعربية والإنجليزية والألمانية."
      : "Professional website design, landing pages, online stores, and fast web apps in Arabic, English, and German.",
    founder: { "@id": `${BASE_URL}/#person` },
    availableLanguage: ["ar", "en", "de"],
    areaServed: [
      { "@type": "Country", name: "Syria" },
      { "@type": "Country", name: "Germany" },
      { "@type": "AdministrativeArea", name: isAr ? "الوطن العربي" : "Middle East & North Africa" },
      { "@type": "AdministrativeArea", name: "Europe" },
    ],
    address: { "@type": "PostalAddress", addressCountry: "DE" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: isAr ? "خدمات الويب" : "Web services",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: isAr ? "تصميم موقع تعريفي احترافي" : "Professional business website design" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: isAr ? "تصميم صفحة هبوط" : "Landing page design" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: isAr ? "متجر إلكتروني أو تطبيق ويب" : "Online store or web app" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: isAr ? "صفحات منتجات ودعم التطبيقات" : "Product pages and app support flows" } },
      ],
    },
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
      "https://de.linkedin.com/in/mohammad-alfarras-525531262",
    ],
  };
}

export function collectionPageJsonLd(
  locale: Locale,
  slug: string,
  name: string,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE_URL}/${locale}/${slug}#collection`,
    url: `${BASE_URL}/${locale}/${slug}`,
    name,
    description,
    inLanguage: locale === "ar" ? "ar-SA" : "en-US",
    author: { "@id": `${BASE_URL}/#person` },
    isPartOf: { "@id": `${BASE_URL}/#website` },
  };
}

export function creativeWorkJsonLd(project: {
  title: string;
  slug: string;
  summary: string;
  image: string;
  locale: Locale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${BASE_URL}/${project.locale}/work/${project.slug}#work`,
    url: `${BASE_URL}/${project.locale}/work/${project.slug}`,
    name: project.title,
    description: project.summary,
    image: project.image.startsWith("http") ? project.image : `${BASE_URL}${project.image}`,
    author: { "@id": `${BASE_URL}/#person` },
    inLanguage: project.locale === "ar" ? "ar-SA" : "en-US",
  };
}

export function softwareApplicationJsonLd(params: {
  locale: Locale;
  /** Page path under the locale root, e.g. "apps/moplayer/classic" — keeps each product's @id unique. */
  path: string;
  name: string;
  description: string;
  version: string;
  fileSize?: string;
  targetSdk?: string | number;
  downloadUrl?: string;
  featureList?: string[];
}) {
  const defaults = ["Kotlin", "Android TV", "Room", "Retrofit", "libVLC"];
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/${params.locale}/${params.path}#software`,
    url: `${BASE_URL}/${params.locale}/${params.path}`,
    name: params.name,
    description: params.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Android 7.0+, Android TV",
    softwareVersion: params.version,
    fileSize: params.fileSize,
    downloadUrl: params.downloadUrl,
    softwareRequirements: params.targetSdk ? `Android SDK ${params.targetSdk}+` : "Android 7.0+",
    featureList: params.featureList?.length ? params.featureList : defaults,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    publisher: { "@id": `${BASE_URL}/#person` },
  };
}

export function faqPageJsonLd(qas: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: { "@type": "Answer", text: qa.answer },
    })),
  };
}

/**
 * Schema.org VideoObject.duration must be an ISO 8601 duration (e.g. PT5M30S).
 * Our videos store a display clock ("MM:SS" / "HH:MM:SS"), so convert it here.
 * Returns undefined for unknown/zero durations so the field is omitted entirely
 * (an invalid duration is what Google Search Console flags).
 */
function toIsoDuration(value?: string): string | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (/^P/i.test(raw)) return raw; // already ISO 8601
  const parts = raw.split(":").map((part) => Number(part));
  if (!parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return undefined;
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else if (parts.length === 1) [s] = parts;
  else return undefined;
  if (h === 0 && m === 0 && s === 0) return undefined;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
}

export function videoObjectJsonLd(video: {
  locale: Locale;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadDate?: string;
  duration?: string;
  youtubeId: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: toIsoDuration(video.duration),
    embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    inLanguage: video.locale === "ar" ? "ar-SA" : "en-US",
    author: { "@id": `${BASE_URL}/#person` },
    publisher: { "@id": `${BASE_URL}/#organization` },
  };
}

export function contactPageJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${BASE_URL}/${locale}/contact#contact`,
    url: `${BASE_URL}/${locale}/contact`,
    name: locale === "ar" ? "تواصل مع محمد الفراس" : "Contact Mohammad Alfarras",
    inLanguage: locale === "ar" ? "ar-SA" : "en-US",
    about: { "@id": `${BASE_URL}/#person` },
  };
}

export function webPageJsonLd(params: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}${params.path}#webpage`,
    url: `${BASE_URL}${params.path}`,
    name: params.name,
    description: params.description,
    inLanguage: params.locale === "ar" ? "ar-SA" : "en-US",
    isPartOf: { "@id": `${BASE_URL}/#website` },
  };
}

/**
 * Serialize a single schema or an array of schemas into a string ready for a
 * <script type="application/ld+json"> tag. Use with dangerouslySetInnerHTML.
 */
export function jsonLdString(data: Record<string, unknown> | Record<string, unknown>[]) {
  // Escape the characters that could break out of the <script> tag when the
  // output is injected via dangerouslySetInnerHTML. A CMS-sourced string
  // containing "</script>" would otherwise close the tag early (stored XSS).
  return JSON.stringify(repairMojibakeDeep(data)).replace(
    /[<>&]/g,
    (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
