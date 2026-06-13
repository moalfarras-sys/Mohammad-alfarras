import type { Locale } from "@/types/cms";

import {
  compactMetric,
  siteIdentity,
  socialLinks,
  youtubeChannel,
  type Localized,
} from "./site-data";

export { siteIdentity, socialLinks };

export const SITE_URL = "https://moalfarras.space";

export type { Localized };

export function localized<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

export const navigationItems = {
  en: [
    { id: "home", label: "Home", slug: "" },
    { id: "work", label: "Work", slug: "work" },
    { id: "services", label: "Services", slug: "services" },
    { id: "apps", label: "MoPlayer", slug: "apps/moplayer" },
    { id: "youtube", label: "YouTube", slug: "youtube" },
    { id: "cv", label: "CV", slug: "cv" },
    { id: "contact", label: "Contact", slug: "contact" },
  ],
  ar: [
    { id: "home", label: "الرئيسية", slug: "" },
    { id: "work", label: "الأعمال", slug: "work" },
    { id: "services", label: "الخدمات", slug: "services" },
    { id: "apps", label: "MoPlayer", slug: "apps/moplayer" },
    { id: "youtube", label: "يوتيوب", slug: "youtube" },
    { id: "cv", label: "السيرة الذاتية", slug: "cv" },
    { id: "contact", label: "تواصل", slug: "contact" },
  ],
} satisfies Localized<Array<{ id: string; label: string; slug: string }>>;

export const homeContent = {
  en: {
    eyebrow: "Syrian roots · German discipline · digital execution",
    title: "I design and build premium digital experiences that make your project look professional.",
    body:
      "Websites, interfaces, apps, and technical content shaped with clear structure, strong visuals, and a practical understanding of how real customers decide.",
    primaryCta: "Start your project",
    secondaryCta: "View the work",
    proof: [
      { value: "Germany", label: "Based and working" },
      { value: "Syria", label: "Al-Hasakah roots" },
      { value: "Rhenus", label: "Operations mindset" },
      { value: "MoPlayer", label: "Android TV product" },
    ],
    youtubeProof: [
      { value: compactMetric(youtubeChannel.fallback.views), label: "YouTube views" },
      { value: compactMetric(youtubeChannel.fallback.subscribers), label: "Subscribers" },
      { value: String(youtubeChannel.fallback.videos), label: "Videos" },
    ],
    capabilitiesEyebrow: "What I can help with",
    capabilities: [
      {
        title: "Professional business websites",
        body: "Clear service pages and bilingual websites that make visitors understand the offer and trust the next step faster.",
      },
      {
        title: "Landing pages for products and campaigns",
        body: "Focused pages for launches, services, and offers with strong hierarchy, persuasive copy, and direct conversion paths.",
      },
      {
        title: "Web apps and product interfaces",
        body: "Next.js, React, TypeScript, Tailwind, Supabase, admin dashboards, and user interfaces designed to scale cleanly.",
      },
      {
        title: "MoPlayer and Android TV product support",
        body: "Product positioning, activation flows, APK release metadata, support pages, privacy surfaces, and TV-first presentation.",
      },
    ],
    flagshipEyebrow: "Flagship product",
    flagshipTitle: "MoPlayer is the product proof: Android TV, activation, releases, and support in one ecosystem.",
    flagshipBody:
      "MoPlayer connects the app, website, APK releases, activation, and remote configuration into one product surface built for Android and Android TV users.",
    workEyebrow: "Selected work",
    workTitle: "Projects that connect design, operations, content, and business clarity.",
    proofEyebrow: "Why the mix is different",
    process: [
      "Logistics taught me sequence, pressure, timing, and customer reality.",
      "Design turns that discipline into pages people understand fast.",
      "Content gives products a voice normal visitors can trust.",
      "Code ties the promise to a working system, not just a pretty screen.",
    ],
    finalTitle: "Have a business, product, or idea that needs a stronger digital presence?",
    finalBody: "Send the project as it is. I will map the goal, audience, constraints, and the first useful digital move.",
    finalCta: "Start a serious conversation",
  },
  ar: {
    eyebrow: "جذور سورية · انضباط ألماني · تنفيذ رقمي",
    title: "أصمم وأبني مواقع وتجارب رقمية تساعد مشروعك على الظهور باحتراف.",
    body:
      "مواقع ويب، واجهات استخدام، تطبيقات، ومحتوى تقني — بتنفيذ واضح، تجربة سلسة، وهوية بصرية تترك أثراً وتساعد الزائر أن يفهم ويتخذ الخطوة التالية.",
    primaryCta: "ابدأ مشروعك",
    secondaryCta: "شاهد الأعمال",
    proof: [
      { value: "ألمانيا", label: "الإقامة والعمل" },
      { value: "سوريا", label: "الجذور: الحسكة" },
      { value: "Rhenus", label: "عقلية تشغيلية" },
      { value: "MoPlayer", label: "منتج Android TV" },
    ],
    youtubeProof: [
      { value: compactMetric(youtubeChannel.fallback.views), label: "مشاهدة على يوتيوب" },
      { value: compactMetric(youtubeChannel.fallback.subscribers), label: "مشترك" },
      { value: String(youtubeChannel.fallback.videos), label: "فيديو" },
    ],
    capabilitiesEyebrow: "كيف أستطيع مساعدتك",
    capabilities: [
      {
        title: "موقع تعريفي احترافي",
        body: "صفحات واضحة لشركتك أو خدمتك تجعل الزائر يفهم العرض بسرعة ويثق بالتواصل معك.",
      },
      {
        title: "صفحة هبوط لحملة أو منتج",
        body: "صفحة مركزة لإطلاق منتج أو خدمة، بنص مقنع، ترتيب بصري قوي، وخطوة واضحة للعميل.",
      },
      {
        title: "واجهة أو تطبيق ويب",
        body: "واجهات مبنية بـ Next.js وReact وTypeScript وSupabase مع بنية قابلة للتوسع ولوحات تحكم عملية.",
      },
      {
        title: "MoPlayer ودعم تجربة المنتج",
        body: "تموضع المنتج، التفعيل، بيانات الإصدارات، صفحات الدعم والخصوصية، وتجربة عرض مناسبة لـ Android TV.",
      },
    ],
    flagshipEyebrow: "المنتج الرئيسي",
    flagshipTitle: "MoPlayer هو دليل المنتج: Android TV، التفعيل، الإصدارات، والدعم ضمن منظومة واحدة.",
    flagshipBody:
      "MoPlayer يربط التطبيق والموقع وإصدارات APK والتفعيل والإعدادات عن بعد في تجربة منتج واضحة لمستخدمي Android وAndroid TV.",
    workEyebrow: "أعمال مختارة",
    workTitle: "مشاريع تربط التصميم، التشغيل، المحتوى، ووضوح القرار التجاري.",
    proofEyebrow: "لماذا هذا المزيج مختلف",
    process: [
      "اللوجستيات علمتني التسلسل، الضغط، الوقت، وواقع العميل.",
      "التصميم يحول هذا الانضباط إلى صفحات تُفهم بسرعة.",
      "المحتوى يعطي المنتج صوتاً يثق به الزائر العادي.",
      "الكود يربط الوعد بنظام يعمل، لا بصورة جميلة فقط.",
    ],
    finalTitle: "لديك مشروع أو منتج يحتاج حضوراً رقمياً أقوى؟",
    finalBody: "أرسل الفكرة كما هي. سأرتب الهدف والجمهور والقيود وأول خطوة رقمية مفيدة.",
    finalCta: "ابدأ محادثة جدية",
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
