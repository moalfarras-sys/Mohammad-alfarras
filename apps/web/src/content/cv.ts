import type { Localized } from "./site";

export const cvPageCopy = {
  en: {
    eyebrow: "CV",
    title: "A profile built between logistics pressure, web execution, design, and Arabic tech storytelling.",
    body:
      "This is not only a resume. It is the practical story behind the work: Rhenus Home Delivery, disposition, TMS, driver coordination, customer service, Next.js, React, TypeScript, UI/UX, MoPlayer, and a YouTube channel built on clear Arabic product explanation.",
    downloadDesigned: "Download designed CV",
    downloadAts: "Download ATS CV",
    summaryTitle: "Professional summary",
    skillsTitle: "Core skills",
    experienceTitle: "Experience timeline",
    projectsTitle: "Selected projects",
    ownershipTitle: "What I can own",
    contactTitle: "For focused roles or projects",
    contactBody: "Use the contact page with the role, scope, timeline, and what needs to be proven.",
    contactCta: "Contact Mohammad",
    principles: [
      "Own the route from content structure to interface delivery.",
      "Build bilingual Arabic/English pages as first-class product surfaces.",
      "Keep claims, metadata, privacy, and support aligned with what is actually shipped.",
      "Translate operational pressure into clearer systems and calmer execution.",
    ],
    skillGroups: [
      {
        title: "Frontend and product UI",
        items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Responsive interfaces", "Design systems"],
      },
      {
        title: "Product and content architecture",
        items: ["Case studies", "Product pages", "Bilingual copy", "RTL/LTR structure", "SEO metadata", "JSON-LD"],
      },
      {
        title: "Operations and delivery",
        items: ["Disposition", "TMS", "Driver coordination", "Customer service", "Release surfaces", "Build verification"],
      },
    ],
    ownership: [
      "A personal or company website from positioning to launch-ready implementation.",
      "A product landing page with support, privacy, release, and case-study context.",
      "A bilingual Arabic/English content system with RTL-safe components.",
      "A recruiter-readable profile that connects logistics discipline with digital product execution.",
    ],
  },
  ar: {
    eyebrow: "السيرة الذاتية",
    title: "ملف مهني بين ضغط اللوجستيات، تنفيذ الويب، التصميم، والسرد التقني العربي.",
    body:
      "هذه ليست سيرة تقليدية فقط. هي القصة العملية خلف العمل: Rhenus Home Delivery، الديسبوزيشن، TMS، تنسيق السائقين، خدمة العملاء، Next.js، React، TypeScript، UI/UX، MoPlayer، وقناة يوتيوب مبنية على شرح عربي واضح للمنتجات.",
    downloadDesigned: "تنزيل السيرة المصممة",
    downloadAts: "تنزيل نسخة ATS",
    summaryTitle: "ملخص مهني",
    skillsTitle: "المهارات الأساسية",
    experienceTitle: "الخبرة العملية",
    projectsTitle: "مشاريع مختارة",
    ownershipTitle: "ما الذي أستطيع امتلاكه",
    contactTitle: "لأدوار أو مشاريع واضحة",
    contactBody: "استخدم صفحة التواصل مع الدور، النطاق، الزمن، وما الذي يجب أن يثبته العمل.",
    contactCta: "تواصل مع محمد",
    principles: [
      "امتلاك المسار من بنية المحتوى إلى تنفيذ الواجهة.",
      "بناء صفحات عربية/إنجليزية كواجهات منتج أساسية، لا كترجمة ثانوية.",
      "إبقاء الادعاءات والبيانات الوصفية والخصوصية والدعم منسجمة مع ما هو موجود فعلاً.",
      "تحويل ضغط التشغيل إلى أنظمة أوضح وتنفيذ أهدأ.",
    ],
    skillGroups: [
      {
        title: "Frontend وواجهات المنتجات",
        items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "واجهات متجاوبة", "أنظمة تصميم"],
      },
      {
        title: "بنية المنتج والمحتوى",
        items: ["دراسات حالة", "صفحات منتجات", "نص ثنائي اللغة", "بنية RTL/LTR", "SEO metadata", "JSON-LD"],
      },
      {
        title: "التشغيل والتسليم",
        items: ["Disposition", "TMS", "تنسيق السائقين", "خدمة العملاء", "أسطح إصدارات", "تحقق Build"],
      },
    ],
    ownership: [
      "موقع شخصي أو موقع شركة من التموضع حتى تنفيذ جاهز للإطلاق.",
      "صفحة منتج تجمع الدعم والخصوصية والإصدار ودراسة الحالة.",
      "نظام محتوى عربي/إنجليزي مع مكونات آمنة لاتجاه RTL.",
      "ملف مهني يربط الانضباط اللوجستي بتنفيذ المنتجات الرقمية بشكل واضح.",
    ],
  },
} satisfies Localized<{
  eyebrow: string;
  title: string;
  body: string;
  downloadDesigned: string;
  downloadAts: string;
  summaryTitle: string;
  skillsTitle: string;
  experienceTitle: string;
  projectsTitle: string;
  ownershipTitle: string;
  contactTitle: string;
  contactBody: string;
  contactCta: string;
  principles: string[];
  skillGroups: Array<{ title: string; items: string[] }>;
  ownership: string[];
}>;
