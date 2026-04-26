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
  telegram: "https://t.me/MoalFarras",
  facebook: "https://www.facebook.com/share/14TQSSocNQG/?mibextid=wwXIfr",
  email: "mohammad.alfarras@gmail.com",
} as const;

export const siteIdentity = {
  name: {
    en: "Mohammad Alfarras",
    ar: "محمد الفراس",
  },
  tagline: {
    en: "Logistics-born digital products, websites, and Arabic tech storytelling",
    ar: "منتجات رقمية ومواقع ومحتوى تقني عربي بعقلية لوجستية عملية",
  },
  shortPositioning: {
    en: "Syrian-German web developer, UI/UX designer, MoPlayer builder, and Arabic tech creator based in Germany.",
    ar: "مطوّر ويب ومصمم واجهات وباني MoPlayer وصانع محتوى تقني عربي سوري/ألماني مقيم في ألمانيا.",
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
    eyebrow: "Syrian roots · German discipline · digital execution",
    title: "I turn real-world operations into clear digital experiences.",
    body:
      "I am Mohammad Alfarras: a web developer, UI/UX designer, Android app builder, logistics/disposition professional, and Arabic tech creator in Germany. I build websites, product pages, apps, and content that explain value faster and make trust easier.",
    primaryCta: "View the work",
    secondaryCta: "Explore MoPlayer",
    proof: [
      { value: "Germany", label: "Based and working" },
      { value: "Syria", label: "Al-Hasakah roots" },
      { value: "Rhenus", label: "Logistics discipline" },
      { value: "MoPlayer", label: "Android TV product" },
    ],
    youtubeProof: [
      { value: "1.5M+", label: "YouTube views" },
      { value: "6.1K+", label: "Subscribers" },
      { value: "162", label: "Videos" },
    ],
    capabilitiesEyebrow: "What I build",
    capabilities: [
      {
        title: "Business websites that make trust faster",
        body: "Service websites, landing pages, and bilingual brand surfaces for transport, moving, local services, and creators who need visitors to understand the offer quickly.",
      },
      {
        title: "Product interfaces with real structure",
        body: "Next.js, React, TypeScript, Tailwind, Supabase, release flows, admin dashboards, and interfaces that can grow without becoming visually messy.",
      },
      {
        title: "Android and Android TV app experience",
        body: "MoPlayer anchors the product side: app UI, activation, APK release metadata, Android TV focus, support, privacy, and product storytelling.",
      },
      {
        title: "Arabic product storytelling",
        body: "YouTube reviews, SaaS and AI tools, electronics, design tools, and tutorials shaped as honest explanations, not empty promotion.",
      },
    ],
    flagshipEyebrow: "Flagship product",
    flagshipTitle: "MoPlayer is the product proof: Android TV, activation, releases, and support in one ecosystem.",
    flagshipBody:
      "MoPlayer is not a small side page. It is a real product surface with Android TV positioning, APK download, version metadata, checksum, activation, installation guidance, privacy notes, and support.",
    workEyebrow: "Selected engineering work",
    workTitle: "Work that connects operations, design, content, and business clarity.",
    proofEyebrow: "Why the mix is different",
    process: [
      "Logistics taught me sequence, pressure, timing, and customer reality.",
      "Design turns that discipline into pages people can understand fast.",
      "Content gives products a voice that normal visitors trust.",
      "Code ties the promise to a working system, not just a pretty screen.",
    ],
    finalTitle: "Have a business, product, or idea that needs to be understood faster?",
    finalBody: "Send the project as it is. I will map the real goal, the audience, the constraints, and the first useful digital move.",
    finalCta: "Start a serious conversation",
  },
  ar: {
    eyebrow: "جذور سورية · انضباط ألماني · تنفيذ رقمي",
    title: "أحوّل العمليات الواقعية إلى تجارب رقمية واضحة.",
    body:
      "أنا محمد الفراس: مطوّر ويب، مصمم واجهات، باني تطبيقات Android، أعمل في اللوجستيات/الديسبوزيشن، وصانع محتوى تقني عربي في ألمانيا. أبني مواقع وتطبيقات وصفحات منتجات ومحتوى يشرح القيمة بسرعة ويجعل الثقة أسهل.",
    primaryCta: "شاهد الأعمال",
    secondaryCta: "استكشف MoPlayer",
    proof: [
      { value: "ألمانيا", label: "الإقامة والعمل" },
      { value: "سوريا", label: "جذور من الحسكة" },
      { value: "Rhenus", label: "انضباط لوجستي" },
      { value: "MoPlayer", label: "منتج Android TV" },
    ],
    youtubeProof: [
      { value: "+1.5M", label: "مشاهدة على يوتيوب" },
      { value: "+6.1K", label: "مشترك" },
      { value: "162", label: "فيديو" },
    ],
    capabilitiesEyebrow: "ماذا أبني",
    capabilities: [
      {
        title: "مواقع أعمال تجعل الثقة أسرع",
        body: "مواقع خدمية وصفحات هبوط وحضور ثنائي اللغة لشركات النقل، الانتقال، الخدمات المحلية، وصناع المحتوى الذين يريدون من الزائر فهم العرض بسرعة.",
      },
      {
        title: "واجهات منتجات ببنية حقيقية",
        body: "Next.js وReact وTypeScript وTailwind وSupabase ولوحات تحكم ومسارات إصدار وواجهات تكبر بدون أن تفقد وضوحها البصري.",
      },
      {
        title: "تجربة Android وAndroid TV",
        body: "MoPlayer يثبت جانب المنتج: واجهة التطبيق، التفعيل، بيانات إصدار APK، تركيز الريموت في Android TV، الدعم، الخصوصية، وسرد المنتج.",
      },
      {
        title: "سرد منتجات تقني بالعربية",
        body: "مراجعات يوتيوب، أدوات SaaS وAI، إلكترونيات، أدوات تصميم، وشروحات تُبنى كشرح صادق لا كترويج فارغ.",
      },
    ],
    flagshipEyebrow: "المنتج الرئيسي",
    flagshipTitle: "MoPlayer هو دليل المنتج: Android TV، التفعيل، الإصدارات، والدعم ضمن منظومة واحدة.",
    flagshipBody:
      "MoPlayer ليس صفحة صغيرة جانبية. هو سطح منتج حقيقي فيه تموضع Android TV، تنزيل APK، بيانات الإصدار، checksum، التفعيل، إرشادات التثبيت، الخصوصية، والدعم.",
    workEyebrow: "أعمال هندسية مختارة",
    workTitle: "أعمال تربط التشغيل، التصميم، المحتوى، ووضوح القرار التجاري.",
    proofEyebrow: "لماذا هذا المزيج مختلف",
    process: [
      "اللوجستيات علمتني التسلسل، الضغط، الوقت، وواقع العميل.",
      "التصميم يحوّل هذا الانضباط إلى صفحات تُفهم بسرعة.",
      "المحتوى يعطي المنتج صوتاً يثق به الزائر العادي.",
      "الكود يربط الوعد بنظام يعمل، لا بصورة جميلة فقط.",
    ],
    finalTitle: "لديك عمل أو منتج أو فكرة تحتاج أن تُفهم أسرع؟",
    finalBody: "أرسل المشروع كما هو. سأرتب الهدف الحقيقي، الجمهور، القيود، وأول خطوة رقمية مفيدة.",
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
