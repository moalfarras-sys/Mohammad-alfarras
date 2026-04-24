import type { Locale } from "@/types/cms";

import type { Localized } from "./site";

export const appsPageCopy = {
  en: {
    eyebrow: "Apps and products",
    title: "MoPlayer is the flagship product inside the same engineering ecosystem.",
    body:
      "Products are not detached microsites here. They share the same trust model: product page, case study, releases, support, privacy, and bilingual documentation.",
    openProduct: "Open MoPlayer",
    viewCase: "Read case study",
    download: "Download APK",
    flagship: "Flagship product",
    philosophy: "Product discipline",
    specs: "Release facts",
    otherTitle: "Connected surfaces",
  },
  ar: {
    eyebrow: "التطبيقات والمنتجات",
    title: "MoPlayer هو المنتج الرئيسي داخل المنظومة الهندسية نفسها.",
    body:
      "المنتجات هنا ليست مواقع صغيرة منفصلة. كلها تعمل ضمن نموذج ثقة واحد: صفحة منتج، دراسة حالة، إصدارات، دعم، خصوصية، وتوثيق عربي/إنجليزي.",
    openProduct: "افتح MoPlayer",
    viewCase: "اقرأ دراسة الحالة",
    download: "تنزيل APK",
    flagship: "المنتج الرئيسي",
    philosophy: "انضباط المنتج",
    specs: "حقائق الإصدار",
    otherTitle: "أسطح مرتبطة",
  },
} satisfies Localized<Record<string, string>>;

export const moPlayerCopy = {
  en: {
    badge: "Android and Android TV media product",
    heroTitle: "MoPlayer is a focused media player surface for Android and Android TV.",
    heroBody:
      "A flagship product inside Mohammad Alfarras's unified site: product positioning, release downloads, installation guidance, support, privacy, and case-study context in one place.",
    download: "Download APK",
    support: "Get support",
    caseStudy: "Read case study",
    releasePending: "Release pending",
    specsLabels: {
      version: "Version",
      size: "Primary APK",
      minSdk: "Minimum SDK",
      targetSdk: "Target SDK",
      abi: "Architecture",
      tv: "Android TV",
    },
    featuresEyebrow: "Product decisions",
    featuresTitle: "Built around clarity, compatibility, and ownership.",
    features: [
      {
        title: "Android and Android TV context",
        body: "The product story covers both touch and remote-control surfaces without pretending the TV experience is a separate brand.",
      },
      {
        title: "Download flow under one site",
        body: "Release downloads, support, privacy, and disclaimers stay in the same trusted web property.",
      },
      {
        title: "No inflated comparison claims",
        body: "The page explains what is available and what is intentionally not provided, without unverifiable speed or competitor claims.",
      },
      {
        title: "Bilingual product documentation",
        body: "Arabic and English users get the same installation, FAQ, support, and legal clarity.",
      },
    ],
    philosophyTitle: "Product philosophy",
    philosophy:
      "MoPlayer is presented as a product Mohammad owns end to end: identity, product page, release packaging, support path, privacy language, and the surrounding case study. The goal is a calmer media experience, not a louder marketing claim.",
    privacyTitle: "Privacy and legal clarity",
    privacyBullets: [
      "MoPlayer does not provide channels, playlists, subscriptions, or copyrighted media.",
      "Users are responsible for the legality of the media sources they connect.",
      "The website support form stores only information intentionally submitted for follow-up.",
      "No ratings, reviews, awards, or performance numbers are shown unless they are verified in source content.",
    ],
    installTitle: "Installation steps",
    installSteps: [
      {
        title: "Download the APK",
        body: "Use the latest release link from this page. Choose the build that matches your device architecture when options are shown.",
      },
      {
        title: "Allow installation from this source",
        body: "Android may ask you to allow installation from the browser or file manager. Only enable it for sources you trust.",
      },
      {
        title: "Open MoPlayer",
        body: "Launch the app and connect only media sources you are allowed to use.",
      },
      {
        title: "Use support if needed",
        body: "For installation or compatibility issues, use the support page so the request stays connected to the product record.",
      },
    ],
    faqTitle: "FAQ",
    faqs: [
      {
        question: "Does MoPlayer include channels or playlists?",
        answer: "No. MoPlayer is a playback interface. It does not provide channels, playlists, subscriptions, or copyrighted media.",
      },
      {
        question: "Is MoPlayer made for Android TV?",
        answer: "The product is positioned for Android and Android TV, with release details shown from the current product data.",
      },
      {
        question: "Is the app on Google Play?",
        answer: "No public Google Play listing is shown unless a real listing exists.",
      },
      {
        question: "Where do support requests go?",
        answer: "Support requests are submitted through this site and stored only for follow-up and issue resolution.",
      },
    ],
    finalTitle: "Need help with MoPlayer?",
    finalBody: "Use the support route for installation, compatibility, or release questions.",
    disclaimerTitle: "Legal disclaimer",
  },
  ar: {
    badge: "منتج وسائط لـ Android و Android TV",
    heroTitle: "MoPlayer واجهة تشغيل وسائط مركّزة على Android و Android TV.",
    heroBody:
      "منتج رئيسي داخل موقع محمد الفراس الموحّد: تموضع المنتج، التنزيلات، إرشادات التثبيت، الدعم، الخصوصية، وسياق دراسة الحالة في مكان واحد.",
    download: "تنزيل APK",
    support: "الحصول على الدعم",
    caseStudy: "اقرأ دراسة الحالة",
    releasePending: "الإصدار غير متاح حالياً",
    specsLabels: {
      version: "الإصدار",
      size: "ملف APK الأساسي",
      minSdk: "الحد الأدنى SDK",
      targetSdk: "الهدف SDK",
      abi: "المعمارية",
      tv: "Android TV",
    },
    featuresEyebrow: "قرارات المنتج",
    featuresTitle: "مبني حول الوضوح، التوافق، وملكية المنتج.",
    features: [
      {
        title: "سياق Android و Android TV",
        body: "قصة المنتج تشمل الهاتف وتجربة الريموت من دون تحويل التلفاز إلى علامة منفصلة عن الموقع.",
      },
      {
        title: "مسار تنزيل داخل الموقع نفسه",
        body: "التنزيلات، الدعم، الخصوصية، والتنبيهات القانونية تبقى ضمن نفس الموقع الموثوق.",
      },
      {
        title: "بدون مقارنات مبالغ فيها",
        body: "الصفحة تشرح ما هو متاح وما لا يقدمه التطبيق، من دون وعود سرعة أو مقارنات غير قابلة للتحقق.",
      },
      {
        title: "توثيق منتج ثنائي اللغة",
        body: "المستخدم العربي والإنجليزي يحصلان على نفس الوضوح في التثبيت، الأسئلة، الدعم، والجانب القانوني.",
      },
    ],
    philosophyTitle: "فلسفة المنتج",
    philosophy:
      "MoPlayer يُعرض كمنتج يملكه محمد من البداية إلى النهاية: الهوية، صفحة المنتج، تجهيز الإصدارات، مسار الدعم، لغة الخصوصية، ودراسة الحالة المحيطة به. الهدف تجربة وسائط أهدأ، وليس ادعاءً تسويقياً أعلى صوتاً.",
    privacyTitle: "وضوح الخصوصية والقانون",
    privacyBullets: [
      "MoPlayer لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق.",
      "المستخدم مسؤول عن قانونية مصادر الوسائط التي يربطها بالتطبيق.",
      "نموذج الدعم في الموقع يخزّن فقط المعلومات التي يرسلها المستخدم عمداً للمتابعة.",
      "لا تُعرض تقييمات أو مراجعات أو جوائز أو أرقام أداء ما لم تكن موثقة في المصدر.",
    ],
    installTitle: "خطوات التثبيت",
    installSteps: [
      {
        title: "نزّل ملف APK",
        body: "استخدم رابط آخر إصدار من هذه الصفحة. اختر النسخة المناسبة لمعمارية جهازك عندما تظهر أكثر من نسخة.",
      },
      {
        title: "اسمح بالتثبيت من هذا المصدر",
        body: "قد يطلب Android السماح بالتثبيت من المتصفح أو مدير الملفات. فعّل ذلك فقط للمصادر التي تثق بها.",
      },
      {
        title: "افتح MoPlayer",
        body: "شغّل التطبيق واربط فقط مصادر الوسائط التي تملك حق استخدامها.",
      },
      {
        title: "استخدم الدعم عند الحاجة",
        body: "لمشكلات التثبيت أو التوافق، استخدم صفحة الدعم حتى تبقى الرسالة مرتبطة بسجل المنتج.",
      },
    ],
    faqTitle: "الأسئلة الشائعة",
    faqs: [
      {
        question: "هل يتضمن MoPlayer قنوات أو قوائم تشغيل؟",
        answer: "لا. MoPlayer واجهة تشغيل فقط. لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق.",
      },
      {
        question: "هل MoPlayer مخصص لـ Android TV؟",
        answer: "المنتج موجه لـ Android و Android TV، وتُعرض تفاصيل الإصدار من بيانات المنتج الحالية.",
      },
      {
        question: "هل التطبيق موجود على Google Play؟",
        answer: "لا تُعرض أي صفحة Google Play عامة إلا إذا وُجد رابط حقيقي وموثّق.",
      },
      {
        question: "إلى أين تذهب طلبات الدعم؟",
        answer: "طلبات الدعم تُرسل من هذا الموقع وتُخزّن فقط للمتابعة وحل المشكلة.",
      },
    ],
    finalTitle: "تحتاج مساعدة مع MoPlayer؟",
    finalBody: "استخدم صفحة الدعم لمشكلات التثبيت أو التوافق أو أسئلة الإصدارات.",
    disclaimerTitle: "تنبيه قانوني",
  },
} satisfies Localized<{
  badge: string;
  heroTitle: string;
  heroBody: string;
  download: string;
  support: string;
  caseStudy: string;
  releasePending: string;
  specsLabels: Record<"version" | "size" | "minSdk" | "targetSdk" | "abi" | "tv", string>;
  featuresEyebrow: string;
  featuresTitle: string;
  features: Array<{ title: string; body: string }>;
  philosophyTitle: string;
  philosophy: string;
  privacyTitle: string;
  privacyBullets: string[];
  installTitle: string;
  installSteps: Array<{ title: string; body: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  finalTitle: string;
  finalBody: string;
  disclaimerTitle: string;
}>;

export function getMoPlayerFaqs(locale: Locale) {
  return moPlayerCopy[locale].faqs;
}
