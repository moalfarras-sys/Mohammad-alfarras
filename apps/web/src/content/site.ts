import type { Locale } from "@/types/cms";

export const SITE_URL = "https://moalfarras.space";

export type Localized<T> = Record<Locale, T>;

export function localized<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

export const socialLinks = {
  youtube: "https://www.youtube.com/@Moalfarras",
  github: "https://github.com/moalfarras-sys",
  linkedin: "https://de.linkedin.com/in/mohammad-alfarras-525531262",
  instagram: "https://www.instagram.com/moalfarras",
  whatsapp: "https://wa.me/4917623419358",
  email: "mohammad.alfarras@gmail.com",
} as const;

export const siteIdentity = {
  name: {
    en: "Mohammad Alfarras",
    ar: "محمد الفراس",
  },
  tagline: {
    en: "Digital presence · product interfaces · Arabic tech storytelling",
    ar: "حضور رقمي · واجهات منتجات · سرد تقني عربي",
  },
  shortPositioning: {
    en: "Production-grade digital presence, interface systems, Android media products, and Arabic technical storytelling from Germany.",
    ar: "حضور رقمي جاد، أنظمة واجهات، منتجات وسائط على Android، وسرد تقني عربي من ألمانيا.",
  },
  origin: {
    en: "From Al-Hasakah, Syria",
    ar: "من الحسكة، سوريا",
  },
  location: {
    en: "Based in Germany",
    ar: "مقيم في ألمانيا",
  },
} satisfies Record<string, Localized<string>>;

export const navigationItems = {
  en: [
    { id: "home", label: "Home", slug: "" },
    { id: "work", label: "Work", slug: "work" },
    { id: "apps", label: "Apps", slug: "apps" },
    { id: "youtube", label: "YouTube", slug: "youtube" },
    { id: "cv", label: "CV", slug: "cv" },
    { id: "contact", label: "Contact", slug: "contact" },
  ],
  ar: [
    { id: "home", label: "الرئيسية", slug: "" },
    { id: "work", label: "الأعمال", slug: "work" },
    { id: "apps", label: "التطبيقات", slug: "apps" },
    { id: "youtube", label: "يوتيوب", slug: "youtube" },
    { id: "cv", label: "السيرة", slug: "cv" },
    { id: "contact", label: "تواصل", slug: "contact" },
  ],
} satisfies Localized<Array<{ id: string; label: string; slug: string }>>;

export const homeContent = {
  en: {
    eyebrow: "Unified engineering identity",
    title: "Mohammad Alfarras builds serious digital presence, product interfaces, and Arabic technical stories.",
    body:
      "A single ecosystem for personal authority, product-building credibility, Android media work, and bilingual publishing maturity. Built from Germany with a practical engineering rhythm.",
    primaryCta: "Explore the work",
    secondaryCta: "Open MoPlayer",
    proof: [
      { value: "Germany", label: "Operational base" },
      { value: "Al-Hasakah", label: "Syrian origin" },
      { value: "MoPlayer", label: "Flagship product" },
      { value: "AR · EN", label: "Publishing system" },
    ],
    youtubeProof: [
      { value: "1.5M+", label: "YouTube views" },
      { value: "6.1K+", label: "Subscribers" },
      { value: "162", label: "Videos" },
    ],
    capabilitiesEyebrow: "Signature capabilities",
    capabilities: [
      {
        title: "Digital presence that explains value",
        body: "Landing pages, personal sites, and service surfaces with clear hierarchy, bilingual structure, and a practical conversion path.",
      },
      {
        title: "Interface systems for real products",
        body: "Reusable UI patterns, product pages, case-study flows, and frontends that can grow without becoming visually fragmented.",
      },
      {
        title: "Android and Android TV product work",
        body: "MoPlayer anchors the product side of the site: app positioning, release flows, support, privacy, and technical documentation in one system.",
      },
      {
        title: "Arabic technical storytelling",
        body: "Arabic tech content is treated as proof of communication quality, not as a detached social channel.",
      },
    ],
    flagshipEyebrow: "Flagship product",
    flagshipTitle: "MoPlayer connects product thinking, Android execution, and support discipline.",
    flagshipBody:
      "MoPlayer is presented as part of the same professional identity: a media player surface for Android and Android TV, with releases, installation guidance, privacy notes, support, and a case study under one roof.",
    workEyebrow: "Selected engineering work",
    workTitle: "Case studies with clear problems, roles, decisions, and outcomes.",
    proofEyebrow: "Operating system",
    process: [
      "Clarify the real job before decoration.",
      "Shape the route from first impression to action.",
      "Use bilingual content as architecture, not a late translation pass.",
      "Keep product, support, privacy, and case studies inside one trust story.",
    ],
    finalTitle: "Need a clearer technical presence or product surface?",
    finalBody: "Send the project as it is. I will map the goal, the constraints, and the first useful execution step.",
    finalCta: "Start a focused conversation",
  },
  ar: {
    eyebrow: "هوية هندسية واحدة",
    title: "محمد الفراس يبني حضوراً رقمياً جدياً، واجهات منتجات، وسرداً تقنياً عربياً واضحاً.",
    body:
      "منظومة واحدة تجمع السلطة الشخصية، مصداقية بناء المنتجات، العمل على Android وAndroid TV، والنشر العربي/الإنجليزي بنضج مهني. كل ذلك من ألمانيا وبإيقاع تنفيذ عملي.",
    primaryCta: "استكشف الأعمال",
    secondaryCta: "افتح MoPlayer",
    proof: [
      { value: "ألمانيا", label: "قاعدة العمل" },
      { value: "الحسكة", label: "الأصل السوري" },
      { value: "MoPlayer", label: "المنتج الرئيسي" },
      { value: "AR · EN", label: "نظام نشر ثنائي" },
    ],
    youtubeProof: [
      { value: "+1.5M", label: "مشاهدة على يوتيوب" },
      { value: "+6.1K", label: "مشترك" },
      { value: "162", label: "فيديو" },
    ],
    capabilitiesEyebrow: "قدرات أساسية",
    capabilities: [
      {
        title: "حضور رقمي يشرح القيمة بسرعة",
        body: "صفحات إطلاق، مواقع شخصية وخدمية، وبنية محتوى ثنائية اللغة تقود الزائر من الانطباع الأول إلى الخطوة التالية.",
      },
      {
        title: "أنظمة واجهات لمنتجات حقيقية",
        body: "أنماط UI قابلة لإعادة الاستخدام، صفحات منتجات، دراسات حالة، وواجهات يمكن تطويرها من دون أن تتفكك بصرياً.",
      },
      {
        title: "عمل منتجي على Android وAndroid TV",
        body: "MoPlayer يثبت جانب المنتج: تموضع التطبيق، الإصدارات، التثبيت، الخصوصية، الدعم، والتوثيق ضمن منظومة واحدة.",
      },
      {
        title: "سرد تقني عربي",
        body: "المحتوى التقني العربي هنا طبقة ثقة وقدرة شرح، وليس قناة منفصلة عن الهوية المهنية.",
      },
    ],
    flagshipEyebrow: "المنتج الرئيسي",
    flagshipTitle: "MoPlayer يربط التفكير المنتجي، تنفيذ Android، وانضباط الدعم.",
    flagshipBody:
      "MoPlayer جزء من الهوية نفسها: تجربة وسائط على Android وAndroid TV، مع إصدارات، إرشادات تثبيت، ملاحظات خصوصية، دعم، ودراسة حالة في مكان واحد.",
    workEyebrow: "أعمال هندسية مختارة",
    workTitle: "دراسات حالة تعرض المشكلة، الدور، القرارات، وما تغيّر بدون أرقام مخترعة.",
    proofEyebrow: "طريقة العمل",
    process: [
      "توضيح الهدف الحقيقي قبل أي زخرفة.",
      "بناء مسار واضح من أول انطباع إلى الفعل المطلوب.",
      "التعامل مع العربية والإنجليزية كبنية محتوى، لا كترجمة متأخرة.",
      "إبقاء المنتج والدعم والخصوصية ودراسات الحالة ضمن قصة ثقة واحدة.",
    ],
    finalTitle: "تحتاج حضوراً تقنياً أو صفحة منتج أوضح؟",
    finalBody: "أرسل المشروع كما هو. سأرتب الهدف، القيود، وأول خطوة تنفيذ مفيدة.",
    finalCta: "ابدأ محادثة مركّزة",
  },
} satisfies Localized<{
  eyebrow: string;
  title: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  proof: Array<{ value: string; label: string }>;
  youtubeProof: Array<{ value: string; label: string }>;
  capabilitiesEyebrow: string;
  capabilities: Array<{ title: string; body: string }>;
  flagshipEyebrow: string;
  flagshipTitle: string;
  flagshipBody: string;
  workEyebrow: string;
  workTitle: string;
  proofEyebrow: string;
  process: string[];
  finalTitle: string;
  finalBody: string;
  finalCta: string;
}>;
