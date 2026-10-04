import type { Locale } from "@/types/cms";

import type { Localized } from "./site";

export const appsPageCopy = {
  en: {
    eyebrow: "Apps and products",
    title: "MoPlayer is the flagship Android TV product inside this ecosystem.",
    body:
      "The Apps section is built around real product journeys: activation, official downloads, TV positioning, support, privacy, and bilingual guidance.",
    openProduct: "Open MoPlayer",
    viewCase: "Read case study",
    download: "Download APK",
    flagship: "Flagship product",
    philosophy: "Product discipline",
    specs: "Release details",
    otherTitle: "Connected surfaces",
  },
  ar: {
    eyebrow: "التطبيقات والمنتجات",
    title: "MoPlayer هو منتج Android TV الرئيسي داخل هذه المنظومة.",
    body:
      "قسم التطبيقات مبني حول رحلات منتج حقيقية: تفعيل، تحميلات رسمية، تجربة التلفزيون، دعم، خصوصية، وإرشاد عربي/إنجليزي.",
    openProduct: "افتح MoPlayer",
    viewCase: "اقرأ دراسة الحالة",
    download: "تنزيل APK",
    flagship: "المنتج الرئيسي",
    philosophy: "انضباط المنتج",
    specs: "تفاصيل الإصدار",
    otherTitle: "أسطح مرتبطة",
  },
} satisfies Localized<Record<string, string>>;

export const moPlayerCopy = {
  en: {
    badge: "Android TV + Android media player",
    heroTitle: "MoPlayer Classic: a lightweight player for Android TV and Android.",
    heroBody:
      "MoPlayer Classic plays your own Xtream Codes or M3U source on Android TV boxes, TVs, phones and tablets in landscape: Live TV with an EPG guide, Movies, Series, Favorites and Search. Add your source by scanning a QR code with your phone at moalfarras.space/activate.",
    download: "Download APK",
    support: "Get support",
    caseStudy: "Read case study",
    releasePending: "Release pending",
    specsLabels: {
      version: "Version",
      versionCode: "Version code",
      size: "Primary APK",
      minSdk: "Minimum Android",
      targetSdk: "Optimized for",
      abi: "Device support",
      checksum: "File check",
      tv: "Android TV",
    },
    featuresEyebrow: "Features",
    featuresTitle: "Live TV, movies and series from your own source, built for the remote.",
    features: [
      {
        title: "Live TV with EPG",
        body: "Channel groups, quick zapping and a programme guide for your Xtream or M3U source.",
      },
      {
        title: "Movies and Series",
        body: "Browse your provider's video library with posters, details, seasons and episodes.",
      },
      {
        title: "QR activation",
        body: "Scan the QR code on the TV and add your source from your phone at moalfarras.space/activate instead of typing long links with the remote.",
      },
      {
        title: "Favorites and Search",
        body: "Pin channels and titles to Favorites and search across Live TV, Movies and Series.",
      },
    ],
    philosophyTitle: "What MoPlayer Classic does",
    philosophy:
      "MoPlayer Classic is a player only: it reads the Xtream Codes account or M3U link you already have and organises it into Live TV, Movies and Series. It runs on Android 7.0 or newer and keeps your source on the device.",
    privacyTitle: "Privacy and legal clarity",
    privacyBullets: [
      "MoPlayer does not provide channels, playlists, subscriptions, or copyrighted media.",
      "Users are responsible for the legality of the media sources they connect.",
      "A source added through QR activation is delivered to your TV once and is not kept on the website.",
      "The website support form stores only information intentionally submitted for follow-up.",
    ],
    installTitle: "Installation steps",
    installSteps: [
      {
        title: "Download the APK",
        body: "Download the latest universal APK from this page. It runs on Android 7.0 or newer.",
      },
      {
        title: "Allow installation",
        body: "If Android asks, allow installs from your browser or file manager for this download.",
      },
      {
        title: "Activate with QR (recommended)",
        body: "Open MoPlayer Classic, scan the QR code on screen with your phone and add your Xtream or M3U source at moalfarras.space/activate. The source is sent to the TV once and saved only on the device.",
      },
      {
        title: "Or sign in on the TV",
        body: "You can also type your Xtream details or M3U link directly in the app.",
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
        answer: "Yes. MoPlayer Classic is built for Android TV and remote navigation, and also runs on Android phones and tablets in landscape. It needs Android 7.0 or newer.",
      },
      {
        question: "How do I add my Xtream or M3U source?",
        answer: "Open the app, scan the QR code on the TV with your phone and enter your source at moalfarras.space/activate. You can also type it directly in the app.",
      },
      {
        question: "Is the app on Google Play?",
        answer: "No. MoPlayer Classic is distributed as an APK from this page only.",
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
    badge: "مشغّل وسائط لـ Android TV وأندرويد",
    heroTitle: "MoPlayer Classic: مشغّل خفيف لـ Android TV وأندرويد.",
    heroBody:
      "يشغّل MoPlayer Classic مصدرك الخاص من Xtream Codes أو M3U على أجهزة وصناديق Android TV والهواتف والأجهزة اللوحية بالوضع الأفقي: بث مباشر مع دليل البرامج EPG، أفلام، مسلسلات، مفضلة وبحث. أضف مصدرك بمسح رمز QR من هاتفك عبر moalfarras.space/activate.",
    download: "تنزيل APK",
    support: "الحصول على الدعم",
    caseStudy: "اقرأ دراسة الحالة",
    releasePending: "الإصدار غير متاح حالياً",
    specsLabels: {
      version: "الإصدار",
      versionCode: "رقم الإصدار",
      size: "ملف APK الأساسي",
      minSdk: "أقل إصدار Android",
      targetSdk: "محسّن لـ",
      abi: "دعم الأجهزة",
      checksum: "فحص الملف",
      tv: "Android TV",
    },
    featuresEyebrow: "الميزات",
    featuresTitle: "بث مباشر وأفلام ومسلسلات من مصدرك الخاص، مصمم للتحكم بالريموت.",
    features: [
      {
        title: "بث مباشر مع EPG",
        body: "مجموعات القنوات، تنقّل سريع بين القنوات، ودليل برامج لمصدر Xtream أو M3U الخاص بك.",
      },
      {
        title: "أفلام ومسلسلات",
        body: "تصفّح مكتبة الفيديو لدى مزوّدك مع الملصقات والتفاصيل والمواسم والحلقات.",
      },
      {
        title: "تفعيل عبر QR",
        body: "امسح رمز QR الظاهر على التلفزيون وأضف مصدرك من هاتفك عبر moalfarras.space/activate بدل كتابة الروابط الطويلة بالريموت.",
      },
      {
        title: "المفضلة والبحث",
        body: "أضف القنوات والعناوين إلى المفضلة وابحث في البث المباشر والأفلام والمسلسلات.",
      },
    ],
    philosophyTitle: "ماذا يقدّم MoPlayer Classic",
    philosophy:
      "MoPlayer Classic مشغّل فقط: يقرأ حساب Xtream Codes أو رابط M3U الذي تملكه أصلاً وينظّمه في بث مباشر وأفلام ومسلسلات. يعمل على Android 7.0 أو أحدث، ويبقى مصدرك محفوظاً على الجهاز.",
    privacyTitle: "وضوح الخصوصية والقانون",
    privacyBullets: [
      "MoPlayer لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق.",
      "المستخدم مسؤول عن قانونية مصادر الوسائط التي يربطها بالتطبيق.",
      "المصدر المُضاف عبر تفعيل QR يُرسَل إلى تلفزيونك مرة واحدة ولا يُحفظ على الموقع.",
      "نموذج الدعم في الموقع يخزّن فقط المعلومات التي يرسلها المستخدم عمداً للمتابعة.",
    ],
    installTitle: "خطوات التثبيت",
    installSteps: [
      {
        title: "نزّل ملف APK",
        body: "نزّل أحدث ملف APK موحّد من هذه الصفحة. يعمل على Android 7.0 أو أحدث.",
      },
      {
        title: "اسمح بالتثبيت",
        body: "إذا طلب Android ذلك، اسمح بالتثبيت من المتصفح أو مدير الملفات لهذا الملف.",
      },
      {
        title: "فعّل عبر QR (الطريقة الموصى بها)",
        body: "افتح MoPlayer Classic، امسح رمز QR الظاهر على الشاشة بهاتفك، ثم أضف مصدر Xtream أو M3U عبر moalfarras.space/activate. يُرسَل المصدر إلى التلفزيون مرة واحدة ويُحفظ على الجهاز فقط.",
      },
      {
        title: "أو سجّل الدخول من التلفزيون",
        body: "يمكنك أيضاً كتابة بيانات Xtream أو رابط M3U مباشرة داخل التطبيق.",
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
        answer: "نعم. صُمّم MoPlayer Classic لـ Android TV والتنقل بالريموت، ويعمل أيضاً على هواتف وأجهزة أندرويد اللوحية بالوضع الأفقي. يحتاج إلى Android 7.0 أو أحدث.",
      },
      {
        question: "كيف أضيف مصدر Xtream أو M3U؟",
        answer: "افتح التطبيق، امسح رمز QR الظاهر على التلفزيون بهاتفك، ثم أدخل مصدرك عبر moalfarras.space/activate. يمكنك أيضاً كتابته مباشرة داخل التطبيق.",
      },
      {
        question: "هل التطبيق موجود على Google Play؟",
        answer: "لا. يُوزَّع MoPlayer Classic كملف APK من هذه الصفحة فقط.",
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
