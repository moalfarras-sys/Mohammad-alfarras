import type { Locale } from "@/types/cms";

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
    image: `${BASE_URL}/images/portrait.jpg`,
    jobTitle: locale === "ar" ? "مطور ويب، مصمم، صانع محتوى تقني" : "Web developer, designer, Arabic tech creator",
    knowsAbout: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Supabase",
      "Android",
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
  name: string;
  description: string;
  version: string;
  fileSize?: string;
  targetSdk?: string | number;
  downloadUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${BASE_URL}/${params.locale}/apps/moplayer#software`,
    name: params.name,
    description: params.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Android 7.0+, Android TV",
    softwareVersion: params.version,
    fileSize: params.fileSize,
    downloadUrl: params.downloadUrl,
    publisher: { "@id": `${BASE_URL}/#person` },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
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
    duration: video.duration,
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
  return JSON.stringify(data);
}
