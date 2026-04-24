import type { Localized } from "./site";

export const cvPageCopy = {
  en: {
    eyebrow: "CV",
    title: "Practical product engineer profile for web, product surfaces, and bilingual execution.",
    body:
      "A recruiter-friendly view of what Mohammad can own: structured frontend delivery, product presentation, Android media product surfaces, and Arabic/English technical communication.",
    downloadDesigned: "Download designed CV",
    downloadAts: "Download ATS CV",
    summaryTitle: "Above-the-fold summary",
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
        title: "Operational delivery",
        items: ["Release surfaces", "Support flows", "Privacy notes", "Supabase-backed forms", "Accessibility", "Build verification"],
      },
    ],
    ownership: [
      "A personal or company website from positioning to launch-ready implementation.",
      "A product landing page with support, privacy, release, and case-study context.",
      "A bilingual Arabic/English content system with RTL-safe components.",
      "A recruiter-readable CV/profile surface with clear ownership and selected outcomes.",
    ],
  },
  ar: {
    eyebrow: "السيرة الذاتية",
    title: "ملف مهني عملي لواجهات الويب، أسطح المنتجات، والتنفيذ العربي/الإنجليزي.",
    body:
      "عرض مناسب للتوظيف يوضح ما الذي يستطيع محمد امتلاكه: تنفيذ واجهات منظم، تقديم منتجات، أسطح Android media، وتواصل تقني عربي/إنجليزي.",
    downloadDesigned: "تنزيل السيرة المصممة",
    downloadAts: "تنزيل نسخة ATS",
    summaryTitle: "ملخص سريع",
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
        title: "التنفيذ التشغيلي",
        items: ["أسطح إصدارات", "مسارات دعم", "ملاحظات خصوصية", "نماذج Supabase", "إتاحة", "تحقق Build"],
      },
    ],
    ownership: [
      "موقع شخصي أو موقع شركة من التموضع حتى تنفيذ جاهز للإطلاق.",
      "صفحة منتج تجمع الدعم والخصوصية والإصدار ودراسة الحالة.",
      "نظام محتوى عربي/إنجليزي مع مكونات آمنة لاتجاه RTL.",
      "صفحة CV أو ملف مهني قابل للقراءة من مسؤول توظيف مع ملكية واضحة ونتائج مختارة.",
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
