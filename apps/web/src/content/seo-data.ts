import type { Locale } from "@/types/cms";

type SeoPage = {
  title: string;
  description: string;
  image: string;
};

export const seoData = {
  en: {
    home: {
      title: "Web, Apps & Digital Products",
      description: "Mohammad Alfarras builds bilingual websites, product interfaces, MoPlayer apps, and clear Arabic technology content from Germany.",
      image: "/images/protofeilnew.jpeg",
    },
    about: {
      title: "About",
      description: "Meet Mohammad Alfarras, a Germany-based builder working across web interfaces, digital products, logistics, and Arabic tech content.",
      image: "/images/protofeilnew.jpeg",
    },
    services: {
      title: "Web & Product Services",
      description: "Web design, Next.js development, bilingual RTL interfaces, product pages, UI/UX, and practical digital delivery.",
      image: "/images/service_web.png",
    },
    cv: {
      title: "CV",
      description: "Professional experience across logistics operations, web engineering, product delivery, and bilingual communication.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "Work & Case Studies",
      description: "Selected websites and product case studies shaped around clarity, trust, mobile usability, and direct conversion paths.",
      image: "/images/projects/adtransporte-home.png",
    },
    youtube: {
      title: "YouTube",
      description: "Arabic technology reviews, practical tutorials, Android TV experiments, and product stories with real publication dates.",
      image: "/images/yt-channel-hero.png",
    },
    contact: {
      title: "Contact",
      description: "Start a website, product page, redesign, MoPlayer support, or digital presentation project with Mohammad Alfarras.",
      image: "/images/service_tech.png",
    },
    privacy: {
      title: "Privacy",
      description: "How moalfarras.space handles contact requests, support messages, product data, downloads, and related services.",
      image: "/images/logo.png",
    },
    apps: {
      title: "Apps & Products",
      description: "Explore MoPlayer Classic, MoPlayer Pro, PC releases, activation, official downloads, support, and product updates.",
      image: "/images/moplayer-pro-hero.webp",
    },
  },
  ar: {
    home: {
      title: "ويب وتطبيقات ومنتجات رقمية",
      description: "يبني محمد الفراس مواقع ثنائية اللغة وواجهات منتجات وتطبيقات MoPlayer ومحتوى تقنياً عربياً واضحاً من ألمانيا.",
      image: "/images/protofeilnew.jpeg",
    },
    about: {
      title: "عن محمد الفراس",
      description: "تعرّف على محمد الفراس وخبرته في واجهات الويب والمنتجات الرقمية واللوجستيات وصناعة المحتوى التقني العربي.",
      image: "/images/protofeilnew.jpeg",
    },
    services: {
      title: "خدمات الويب والمنتجات",
      description: "تصميم وتطوير مواقع Next.js وواجهات عربية وإنجليزية وRTL وصفحات منتجات وتجارب UI/UX عملية.",
      image: "/images/service_web.png",
    },
    cv: {
      title: "السيرة الذاتية",
      description: "خبرة مهنية تجمع العمليات اللوجستية وهندسة الويب وتسليم المنتجات والتواصل بالعربية والألمانية والإنجليزية.",
      image: "/images/portrait.jpg",
    },
    work: {
      title: "الأعمال ودراسات الحالة",
      description: "مواقع ومنتجات رقمية مختارة مبنية على الوضوح والثقة وسهولة الاستخدام على الجوال ومسارات تواصل مباشرة.",
      image: "/images/projects/adtransporte-home.png",
    },
    youtube: {
      title: "يوتيوب",
      description: "مراجعات وشروحات تقنية عربية وتجارب Android TV وقصص منتجات مع تواريخ النشر الحقيقية.",
      image: "/images/yt-channel-hero.png",
    },
    contact: {
      title: "تواصل",
      description: "ابدأ مشروع موقع أو صفحة منتج أو إعادة تصميم أو اطلب دعم MoPlayer مباشرة من محمد الفراس.",
      image: "/images/service_tech.png",
    },
    privacy: {
      title: "الخصوصية",
      description: "كيفية تعامل moalfarras.space مع طلبات التواصل ورسائل الدعم وبيانات المنتجات والتنزيلات والخدمات المرتبطة.",
      image: "/images/logo.png",
    },
    apps: {
      title: "التطبيقات والمنتجات",
      description: "استكشف MoPlayer Classic وMoPlayer Pro وإصدارات الكمبيوتر والتفعيل والتنزيلات الرسمية والدعم والتحديثات.",
      image: "/images/moplayer-pro-hero.webp",
    },
  },
} satisfies Record<Locale, Record<string, SeoPage>>;
