import type { Metadata } from "next";

import type { Locale } from "@/types/cms";

const BASE_URL = "https://moalfarras.space";

const seoCopy = {
  ar: {
    home: {
      title: "محمد الفراس | واجهات ومنتجات ومحتوى تقني عربي",
      description:
        "موقع محمد الفراس من ألمانيا: واجهات ويب أهدأ، صفحات تسويقية أوضح، ومنتجات رقمية ومحتوى تقني عربي يبني الثقة من أول شاشة.",
      image: "/images/portrait.jpg",
    },
    cv: {
      title: "السيرة الذاتية | محمد الفراس",
      description: "خبرة عملية تجمع اللوجستيات، تطوير الويب، وبناء المنتجات مع سرد بصري واضح بالعربية والإنجليزية.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "الأعمال | محمد الفراس",
      description: "دراسات حالة وصفحات عمل أعيد ترتيبها لتصبح أوضح، أهدأ، وأكثر إقناعًا من أول انطباع.",
      image: "/images/service_logistics.png",
    },
    youtube: {
      title: "يوتيوب | محمد الفراس",
      description: "قناة تقنية عربية تبني جمهورًا بالوضوح والشرح الهادئ، وتكمل نفس الهوية التي يقدمها الموقع والمنتج.",
      image: "/images/hero-profile-bg.png",
    },
    contact: {
      title: "تواصل | محمد الفراس",
      description: "تواصل مباشر لمواقع الويب، صفحات التعريف، المنتجات الرقمية، وإعادة صياغة الحضور البصري بشكل أوضح وأكثر ثقة.",
      image: "/images/hero_tech.png",
    },
    privacy: {
      title: "الخصوصية | محمد الفراس",
      description: "سياسة خصوصية واضحة ومباشرة لموقع moalfarras.space بلغة مفهومة وبأقل تعقيد ممكن.",
      image: "/images/portrait.jpg",
    },
    apps: {
      title: "التطبيقات والمنتجات | محمد الفراس",
      description: "صفحات ومنتجات رقمية مصممة بنفس مستوى الموقع، مع MoPlayer كأوضح مثال على منتج شخصي مكتمل الهوية.",
      image: "/images/moplayer-hero-3d-final.png",
    },
    about: {
      title: "عني | محمد الفراس — واجهات ومنتجات ومحتوى تقني من ألمانيا",
      description:
        "تعرّف على محمد الفراس: يبني واجهات ويب ومنتجات رقمية وتجارب ثنائية اللغة، ويقدّم محتوى تقني عربي من ألمانيا.",
      image: "/images/portrait.jpg",
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
      title: "Mohammad Alfarras | Interfaces, products, and Arabic tech storytelling",
      description:
        "Germany-based personal brand site for Mohammad Alfarras covering production-grade digital presence, product interfaces, Android media work, and Arabic tech storytelling.",
      image: "/images/portrait.jpg",
    },
    cv: {
      title: "CV | Mohammad Alfarras",
      description: "A practical profile spanning logistics discipline, frontend execution, product thinking, and bilingual communication.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "Work | Mohammad Alfarras",
      description:
        "Selected case studies showing how structure, image direction, and product clarity can make a digital presence feel stronger and calmer.",
      image: "/images/service_logistics.png",
    },
    youtube: {
      title: "YouTube | Mohammad Alfarras",
      description: "Arabic tech content that extends the same brand language: clearer explanation, stronger presence, and long-term audience trust.",
      image: "/images/hero-profile-bg.png",
    },
    contact: {
      title: "Contact | Mohammad Alfarras",
      description: "Direct contact for web projects, product pages, redesigns, and digital presentation work.",
      image: "/images/hero_tech.png",
    },
    privacy: {
      title: "Privacy | Mohammad Alfarras",
      description: "A clear privacy policy for moalfarras.space, written to stay readable and practical.",
      image: "/images/portrait.jpg",
    },
    apps: {
      title: "Apps & Products | Mohammad Alfarras",
      description: "A focused ecosystem of product surfaces built to the same standard as the site. MoPlayer is the flagship product today.",
      image: "/images/moplayer-hero-3d-final.png",
    },
    about: {
      title: "About | Mohammad Alfarras — Interfaces, products, and Arabic tech content from Germany",
      description:
        "Meet Mohammad Alfarras: a Germany-based builder working across web interfaces, digital products, Android media surfaces, and Arabic tech content.",
      image: "/images/portrait.jpg",
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
  const copy = seoCopy[locale][normalized as keyof typeof seoCopy.en] ?? seoCopy[locale].home;
  const localeTag = locale === "ar" ? "ar_SA" : "en_US";
  const altLocaleTag = locale === "ar" ? "en_US" : "ar_SA";

  return {
    title: copy.title,
    description: copy.description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}${localizedPath}`,
      languages: {
        ar: `${BASE_URL}${altAr}`,
        en: `${BASE_URL}${altEn}`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: localeTag,
      alternateLocale: [altLocaleTag],
      url: `${BASE_URL}${localizedPath}`,
      title: copy.title,
      description: copy.description,
      siteName: "Mohammad Alfarras | محمد الفراس",
      images: [
        {
          url: `${BASE_URL}${copy.image}`,
          width: 1200,
          height: 630,
          alt: copy.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: copy.title,
      description: copy.description,
      images: [{ url: `${BASE_URL}${copy.image}`, alt: copy.title }],
    },
    keywords: keywordMap[normalized] ?? keywordMap.home,
  };
}
