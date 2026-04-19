import type { Metadata } from "next";

import type { Locale } from "@/types/cms";

const BASE_URL = "https://moalfarras.space";

const seoCopy = {
  ar: {
    home: {
      title: "محمد الفراس | موقع شخصي ومهني",
      description: "الموقع الشخصي والمهني لمحمد الفراس: تطوير ويب، تصميم، منتجات رقمية، ومحتوى تقني عربي من ألمانيا.",
      image: "/images/portrait.jpg",
    },
    cv: {
      title: "السيرة الذاتية | محمد الفراس",
      description: "الخبرة، طريقة العمل، وروابط تحميل السيرة الذاتية لمحمد الفراس في صفحة واحدة واضحة.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "الأعمال | محمد الفراس",
      description: "أعمال ودراسات حالة مختارة توضّح كيف تتحول المشاريع إلى واجهات أوضح وحضور رقمي أقوى.",
      image: "/images/seel-home-case.png",
    },
    youtube: {
      title: "يوتيوب | محمد الفراس",
      description: "المحتوى التقني العربي كجزء من البراند الشخصي لمحمد الفراس.",
      image: "/images/yt-hero-2026.png",
    },
    contact: {
      title: "تواصل | محمد الفراس",
      description: "تواصل مباشر لمشاريع الويب، إعادة الترتيب البصري، ودراسات الحالة والمنتجات الرقمية.",
      image: "/images/contact-hero-2026.png",
    },
    privacy: {
      title: "الخصوصية | محمد الفراس",
      description: "سياسة خصوصية واضحة ومباشرة لموقع moalfarras.space.",
      image: "/images/portrait.jpg",
    },
  },
  en: {
    home: {
      title: "Mohammad Alfarras | Personal and professional website",
      description: "Personal website for Mohammad Alfarras covering web development, digital products, interface design, and Arabic tech content.",
      image: "/images/portrait.jpg",
    },
    cv: {
      title: "CV | Mohammad Alfarras",
      description: "Professional experience, working principles, and downloadable CV versions for Mohammad Alfarras.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "Work | Mohammad Alfarras",
      description: "Selected case studies and product work showing clearer structure, stronger trust, and sharper digital presentation.",
      image: "/images/seel-home-case.png",
    },
    youtube: {
      title: "YouTube | Mohammad Alfarras",
      description: "Arabic tech content as part of Mohammad Alfarras' personal brand and product communication.",
      image: "/images/yt-hero-2026.png",
    },
    contact: {
      title: "Contact | Mohammad Alfarras",
      description: "Direct contact for web projects, redesigns, product presentation, and digital work.",
      image: "/images/contact-hero-2026.png",
    },
    privacy: {
      title: "Privacy | Mohammad Alfarras",
      description: "Clear privacy policy for moalfarras.space.",
      image: "/images/portrait.jpg",
    },
  },
} as const;

const keywordMap: Record<string, string[]> = {
  home: ["Mohammad Alfarras", "personal website", "frontend developer Germany", "محمد الفراس", "مطور ويب", "موقع شخصي"],
  about: ["Mohammad Alfarras CV", "professional profile", "محمد الفراس سيرة ذاتية", "السيرة الذاتية"],
  cv: ["Mohammad Alfarras CV", "professional profile", "محمد الفراس سيرة ذاتية", "السيرة الذاتية"],
  work: ["Mohammad Alfarras work", "case studies", "MoPlayer", "أعمال محمد الفراس", "دراسات حالة"],
  youtube: ["Mohammad Alfarras YouTube", "Arabic tech content", "يوتيوب محمد الفراس", "محتوى تقني عربي"],
  contact: ["contact Mohammad Alfarras", "hire web developer", "تواصل محمد الفراس"],
  privacy: ["moalfarras privacy", "سياسة الخصوصية محمد الفراس"],
};

export async function pageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const normalized = slug === "about" ? "cv" : slug === "projects" ? "work" : (slug || "home");
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
