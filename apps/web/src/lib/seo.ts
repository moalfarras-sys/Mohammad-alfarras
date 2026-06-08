import type { Metadata } from "next";

import { readPage } from "@/lib/content/store";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const BASE_URL = "https://moalfarras.space";
const BRAND = "Mohammad Alfarras";

/**
 * Title strings come from several sources (curated copy below, the CMS, Supabase).
 * Some already contain the brand, some don't. The root layout also applies a
 * `%s | Mohammad Alfarras` template. To avoid a doubled brand ("CV | Mohammad
 * Alfarras | Mohammad Alfarras") or a mixed AR/EN brand, we resolve the brand
 * exactly once here and emit an absolute title so the template never re-applies.
 */
function ensureBrandOnce(title: string): string {
  return /mohammad\s*alfarras|محمد\s*الفراس/i.test(title) ? title : `${title} | ${BRAND}`;
}

const seoCopy = {
  ar: {
    home: {
      title: "محمد الفراس | مطور ويب ومصمم واجهات وصانع MoPlayer في ألمانيا",
      description:
        "محمد الفراس: مطور ويب ومصمم UI/UX وباني MoPlayer وصانع محتوى تقني عربي في ألمانيا، يحوّل الخبرة اللوجستية إلى مواقع وتطبيقات واضحة وسريعة الثقة.",
      image: "/images/hero_tech.png",
    },
    cv: {
      title: "السيرة الذاتية | محمد الفراس",
      description: "خبرة عملية تجمع اللوجستيات، تطوير الويب، وبناء المنتجات مع سرد بصري واضح بالعربية والإنجليزية.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "الأعمال | محمد الفراس",
      description: "دراسات حالة لمواقع خدمات ومنتجات رقمية مثل MoPlayer وA&D Fahrzeugtransporte وIntelligent Umzüge، مبنية على وضوح الخدمة ومسار التواصل.",
      image: "/images/service_logistics.png",
    },
    youtube: {
      title: "يوتيوب | محمد الفراس",
      description: "قناة تقنية عربية تبني جمهورًا بالوضوح والشرح الهادئ، وتكمل نفس الهوية التي يقدمها الموقع والمنتج.",
      image: "/images/yt-channel-hero.png",
    },
    contact: {
      title: "تواصل | محمد الفراس",
      description: "تواصل مباشر لمواقع الويب، صفحات التعريف، المنتجات الرقمية، وإعادة صياغة الحضور البصري بشكل أوضح وأكثر ثقة.",
      image: "/images/service_tech.png",
    },
    privacy: {
      title: "الخصوصية | محمد الفراس",
      description: "سياسة خصوصية واضحة ومباشرة لموقع moalfarras.space بلغة مفهومة وبأقل تعقيد ممكن.",
      image: "/images/protofeilnew.jpeg",
    },
    apps: {
      title: "التطبيقات والمنتجات | محمد الفراس",
      description: "MoPlayer كمنتج Android TV رئيسي مع APK رسمي، تفعيل عبر الموقع، بيانات إصدار، checksum، دعم، وخصوصية واضحة.",
      image: "/images/moplayer-hero-3d-final.png",
    },
    about: {
      title: "عني | محمد الفراس — واجهات ومنتجات ومحتوى تقني من ألمانيا",
      description:
        "تعرّف على محمد الفراس: يبني واجهات ويب ومنتجات رقمية وتجارب ثنائية اللغة، ويقدّم محتوى تقني عربي من ألمانيا.",
      image: "/images/protofeilnew.jpeg",
    },
    services: {
      title: "الخدمات | تصميم وتطوير ويب، واجهات، ومواقع عربية/إنجليزية",
      description:
        "خدمات تصميم وتطوير الويب، الواجهات الأمامية، المواقع ثنائية اللغة وRTL، تصميم UI/UX، ودعم تطوير مدعوم بالذكاء الاصطناعي.",
      image: "/images/hero_tech.png",
    },
  },
  en: {
    home: {
      title: "Mohammad Alfarras | Web developer, UI/UX designer, and MoPlayer builder in Germany",
      description:
        "Syrian-German web developer, UI/UX designer, Android/MoPlayer builder, Arabic tech creator, and logistics professional turning real operations into clear digital experiences.",
      image: "/images/hero_tech.png",
    },
    cv: {
      title: "CV | Mohammad Alfarras",
      description: "A practical profile spanning logistics discipline, frontend execution, product thinking, and bilingual communication.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "Work | Mohammad Alfarras",
      description:
        "Case studies for MoPlayer, A&D Fahrzeugtransporte, Intelligent Umzüge, and service websites shaped around clarity, trust, and practical conversion paths.",
      image: "/images/service_logistics.png",
    },
    youtube: {
      title: "YouTube | Mohammad Alfarras",
      description: "Arabic tech content that extends the same brand language: clearer explanation, stronger presence, and long-term audience trust.",
      image: "/images/yt-channel-hero.png",
    },
    contact: {
      title: "Contact | Mohammad Alfarras",
      description: "Direct contact for web projects, product pages, redesigns, and digital presentation work.",
      image: "/images/service_tech.png",
    },
    privacy: {
      title: "Privacy | Mohammad Alfarras",
      description: "A clear privacy policy for moalfarras.space, written to stay readable and practical.",
      image: "/images/protofeilnew.jpeg",
    },
    apps: {
      title: "Apps & Products | Mohammad Alfarras",
      description: "MoPlayer as the flagship Android TV product with official APK download, activation, release metadata, checksum, support, and privacy.",
      image: "/images/moplayer-release-panel.webp",
    },
    about: {
      title: "About | Mohammad Alfarras — Interfaces, products, and Arabic tech content from Germany",
      description:
        "Meet Mohammad Alfarras: a Germany-based builder working across web interfaces, digital products, Android media surfaces, and Arabic tech content.",
      image: "/images/protofeilnew.jpeg",
    },
    services: {
      title: "Services | Web design, frontend, bilingual & RTL, UI/UX, AI-assisted delivery",
      description:
        "Web design and development, React/Next.js/TypeScript frontends, bilingual and RTL websites, UI/UX, and AI-assisted development workflows.",
      image: "/images/hero_tech.png",
    },
  },
} as const;

const keywordMap: Record<string, string[]> = {
  home: ["Mohammad Alfarras", "personal brand website", "frontend developer Germany", "محمد الفراس", "مطور ويب", "موقع شخصي"],
  about: ["Mohammad Alfarras about", "frontend developer Germany", "محمد الفراس عني", "مطور ويب ألمانيا"],
  cv: ["Mohammad Alfarras CV", "professional profile", "محمد الفراس سيرة ذاتية", "السيرة الذاتية"],
  work: ["Mohammad Alfarras work", "case studies", "MoPlayer", "أعمال محمد الفراس", "دراسات حالة"],
  services: ["web design services", "bilingual website", "RTL development", "خدمات تصميم مواقع"],
  youtube: ["Mohammad Alfarras YouTube", "Arabic tech content", "يوتيوب محمد الفراس", "محتوى تقني عربي"],
  contact: ["contact Mohammad Alfarras", "hire web developer", "تواصل محمد الفراس"],
  privacy: ["moalfarras privacy", "سياسة الخصوصية محمد الفراس"],
  apps: ["MoPlayer", "Mohammad Alfarras apps", "تطبيقات محمد الفراس", "MoPlayer Android", "MoPlayer TV"],
};

export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const normalized = slug === "projects" ? "work" : (slug || "home");
  const localizedPath = normalized === "home" ? `/${locale}` : `/${locale}/${normalized}`;
  const altAr = normalized === "home" ? "/ar" : `/ar/${normalized}`;
  const altEn = normalized === "home" ? "/en" : `/en/${normalized}`;
  const page = await readPage(locale, normalized).catch(() => null);
  const baseCopy = repairMojibakeDeep(seoCopy[locale][normalized as keyof typeof seoCopy.en] ?? seoCopy[locale].home);
  const cmsCopy = page?.seo
    ? {
        title: page.seo.title || baseCopy.title,
        description: page.seo.description || baseCopy.description,
        ogTitle: page.seo.ogTitle || page.seo.title || baseCopy.title,
        ogDescription: page.seo.ogDescription || page.seo.description || baseCopy.description,
        image: page.seo.image || baseCopy.image,
      }
    : null;
  const copy = cmsCopy ?? baseCopy;
  const localeTag = locale === "ar" ? "ar_SA" : "en_US";
  const altLocaleTag = locale === "ar" ? "en_US" : "ar_SA";

  // One resolved title shared across <title>, og:title, and twitter:title so the
  // page never shows three different titles (and never a doubled brand).
  const resolvedTitle = ensureBrandOnce(copy.title);
  const resolvedOgDescription = "ogDescription" in copy ? copy.ogDescription : copy.description;

  return {
    title: { absolute: resolvedTitle },
    description: copy.description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}${localizedPath}`,
      languages: {
        ar: `${BASE_URL}${altAr}`,
        en: `${BASE_URL}${altEn}`,
        "x-default": `${BASE_URL}${altEn}`,
      },
    },
    openGraph: {
      type: "website",
      locale: localeTag,
      alternateLocale: [altLocaleTag],
      url: `${BASE_URL}${localizedPath}`,
      title: resolvedTitle,
      description: resolvedOgDescription,
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [
        {
          url: absoluteImageUrl(copy.image),
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: resolvedTitle,
      description: resolvedOgDescription,
      images: [{ url: absoluteImageUrl(copy.image), alt: resolvedTitle }],
    },
    keywords: repairMojibakeDeep(keywordMap[normalized] ?? keywordMap.home),
  };
}

function absoluteImageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
