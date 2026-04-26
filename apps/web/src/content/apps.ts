import type { Locale } from "@/types/cms";

import type { Localized } from "./site";

export const appsPageCopy = {
  en: {
    eyebrow: "Apps and products",
    title: "MoPlayer is the flagship Android TV product inside this ecosystem.",
    body:
      "The Apps section is built around a real product surface: activation, release metadata, APK download, Android TV positioning, support, privacy, and bilingual documentation.",
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
    title: "MoPlayer هو منتج Android TV الرئيسي داخل هذه المنظومة.",
    body:
      "قسم التطبيقات مبني حول سطح منتج حقيقي: تفعيل، بيانات إصدار، تنزيل APK، تموضع Android TV، دعم، خصوصية، وتوثيق عربي/إنجليزي.",
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
    heroTitle: "MoPlayer is a cinematic Android TV-first media player shell.",
    heroBody:
      "Built as a serious product surface: remote-friendly TV UI, source setup, website activation, release downloads, installation guidance, support, privacy, and case-study context in one trusted place.",
    download: "Download APK",
    support: "Get support",
    caseStudy: "Read case study",
    releasePending: "Release pending",
    specsLabels: {
      version: "Version",
      versionCode: "Version code",
      size: "Primary APK",
      minSdk: "Minimum SDK",
      targetSdk: "Target SDK",
      abi: "Architecture",
      checksum: "SHA-256",
      tv: "Android TV",
    },
    featuresEyebrow: "Product decisions",
    featuresTitle: "Built around TV clarity, safe setup, and product ownership.",
    features: [
      {
        title: "TV-first product direction",
        body: "The experience is designed around remote control, focus visibility, readable TV spacing, and adaptive phone layouts.",
      },
      {
        title: "Official release path",
        body: "APK download, version data, checksum, support, privacy, and disclaimers stay inside moalfarras.space.",
      },
      {
        title: "Legal source clarity",
        body: "MoPlayer is a player shell. Users connect only media sources they are allowed to use; the app does not provide channels.",
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
    heroTitle: "MoPlayer واجهة وسائط سينمائية موجهة أولاً لـ Android TV.",
    heroBody:
      "منتج جدي بواجهة تلفزيون مناسبة للريموت، إعداد مصادر، تفعيل عبر الموقع، تنزيل APK، إرشادات تثبيت، دعم، خصوصية، وسياق دراسة حالة داخل مكان موثوق واحد.",
    download: "تنزيل APK",
    support: "الحصول على الدعم",
    caseStudy: "اقرأ دراسة الحالة",
    releasePending: "الإصدار غير متاح حالياً",
    specsLabels: {
      version: "الإصدار",
      versionCode: "رقم الإصدار",
      size: "ملف APK الأساسي",
      minSdk: "الحد الأدنى SDK",
      targetSdk: "الهدف SDK",
      abi: "المعمارية",
      checksum: "SHA-256",
      tv: "Android TV",
    },
    featuresEyebrow: "قرارات المنتج",
    featuresTitle: "مبني حول وضوح التلفزيون، الإعداد الآمن، وملكية المنتج.",
    features: [
      {
        title: "توجه تلفزيون أولاً",
        body: "التجربة مصممة حول الريموت، وضوح التركيز، مسافات قابلة للقراءة من بعيد، وتخطيط مناسب للهاتف أيضاً.",
      },
      {
        title: "مسار إصدار رسمي",
        body: "تنزيل APK، بيانات النسخة، checksum، الدعم، الخصوصية، والتنبيه القانوني تبقى داخل moalfarras.space.",
      },
      {
        title: "وضوح قانوني للمصادر",
        body: "MoPlayer واجهة تشغيل فقط. المستخدم يربط فقط المصادر التي يملك حق استخدامها، والتطبيق لا يوفّر قنوات.",
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
  specsLabels: Record<"version" | "versionCode" | "size" | "minSdk" | "targetSdk" | "abi" | "checksum" | "tv", string>;
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
