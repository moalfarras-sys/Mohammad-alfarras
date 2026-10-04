import type { Locale } from "@/types/cms";

/**
 * Question/answer copy for the MoPlayer product pages. Plain strings, because
 * the same items feed the visible FAQ and the FAQPage JSON-LD.
 * Only claim what the apps really do (see the Android READMEs and the GitHub
 * release notes of the current versions).
 */
export type FaqEntry = { question: string; answer: string };

const classicFaqs: Record<Locale, FaqEntry[]> = {
  en: [
    {
      question: "Does MoPlayer include channels or playlists?",
      answer:
        "No. MoPlayer Classic is a player only. It includes no channels, playlists or subscriptions. You add your own Xtream Codes account or M3U playlist that you are legally allowed to use.",
    },
    {
      question: "Which devices does MoPlayer Classic run on?",
      answer:
        "Android TV, Google TV, Fire TV and Android TV boxes with Android 7.0 or newer, plus Android phones and tablets in landscape. One universal APK covers 64-bit and 32-bit ARM devices.",
    },
    {
      question: "How do I add my source?",
      answer:
        "Open the app and choose website activation. Scan the QR code on the TV with your phone and enter your Xtream or M3U details at moalfarras.space/activate; the TV continues on its own. You can also type the details directly on the TV.",
    },
    {
      question: "Does the TV guide (EPG) work with M3U playlists?",
      answer:
        "Yes. Since 2.5.0 the XMLTV link you add during activation, or the url-tvg link inside the playlist, fills the guide for M3U sources. Xtream accounts use the provider's own guide.",
    },
    {
      question: "Is my source stored on the website?",
      answer:
        "No. A source sent through QR activation is encrypted, delivered to your TV once and then removed from the website. It is saved only on your device.",
    },
    {
      question: "How do I update?",
      answer:
        "Settings › App update checks moalfarras.space for the latest version and verifies the file size and SHA-256 before installing. You can also download the newest APK from this page or moalfarras.space/mp at any time; it installs over the old version and keeps your source.",
    },
    {
      question: "Is MoPlayer on Google Play?",
      answer: "No. MoPlayer Classic is distributed as a signed APK from this website and its GitHub Releases only.",
    },
  ],
  ar: [
    {
      question: "هل يتضمن MoPlayer قنوات أو قوائم تشغيل؟",
      answer:
        "لا. MoPlayer Classic مشغّل فقط، لا يحتوي قنوات ولا قوائم تشغيل ولا اشتراكات. أنت من يضيف حساب Xtream Codes أو قائمة M3U يحق لك استخدامها قانونياً.",
    },
    {
      question: "على أي أجهزة يعمل MoPlayer Classic؟",
      answer:
        "على Android TV و Google TV و Fire TV وصناديق Android TV بنظام أندرويد 7.0 أو أحدث، وعلى هواتف وأجهزة أندرويد اللوحية بالوضع الأفقي. ملف APK واحد يدعم أجهزة ARM بنظامي 64 و32 بت.",
    },
    {
      question: "كيف أضيف مصدري؟",
      answer:
        "افتح التطبيق واختر التفعيل عبر الموقع. امسح رمز QR الظاهر على التلفزيون بهاتفك وأدخل بيانات Xtream أو M3U عبر moalfarras.space/activate، فيكمل التلفزيون وحده. ويمكنك أيضاً كتابة البيانات مباشرة على التلفزيون.",
    },
    {
      question: "هل يعمل دليل البرامج (EPG) مع قوائم M3U؟",
      answer:
        "نعم. منذ الإصدار 2.5.0 يملأ رابط XMLTV الذي تضيفه أثناء التفعيل، أو رابط url-tvg داخل القائمة، دليلَ البرامج لمصادر M3U. أما حسابات Xtream فتستخدم دليل المزوّد نفسه.",
    },
    {
      question: "هل يُحفظ مصدري على الموقع؟",
      answer:
        "لا. المصدر المرسل عبر تفعيل QR يُشفَّر ويصل إلى تلفزيونك مرة واحدة ثم يُحذف من الموقع، ويبقى محفوظاً على جهازك فقط.",
    },
    {
      question: "كيف أحدّث التطبيق؟",
      answer:
        "من الإعدادات › تحديث التطبيق يتحقق MoPlayer من أحدث إصدار على moalfarras.space ويتأكد من حجم الملف و SHA-256 قبل التثبيت. ويمكنك أيضاً تنزيل أحدث APK من هذه الصفحة أو من moalfarras.space/mp في أي وقت؛ فيُثبَّت فوق الإصدار القديم ويحتفظ بمصدرك.",
    },
    {
      question: "هل MoPlayer موجود على Google Play؟",
      answer: "لا. يُوزَّع MoPlayer Classic كملف APK موقّع من هذا الموقع ومن GitHub Releases فقط.",
    },
  ],
};

const proFaqs: Record<Locale, FaqEntry[]> = {
  en: [
    {
      question: "Does MoPlayer Pro include channels or playlists?",
      answer:
        "No. MoPlayer Pro is a player only. It includes no channels, playlists or subscriptions; you connect your own Xtream account or M3U playlist that you are allowed to use.",
    },
    {
      question: "Is MoPlayer Pro an upgrade of MoPlayer Classic?",
      answer:
        "No, it is a separate app with its own package, APK, activation and updates. Both are free and can be installed side by side. Classic suits older boxes; Pro is the newer app with a richer player.",
    },
    {
      question: "Which Android version do I need?",
      answer: "Android 6.0 or newer. MoPlayer Pro is built for Android TV, Google TV and Fire TV first and adapts to Android phones and tablets.",
    },
    {
      question: "How do I activate MoPlayer Pro?",
      answer:
        "Choose QR Code on the sign-in screen, scan it with your phone and add your source at moalfarras.space/activate. You can also sign in with M3U or Xtream directly on the TV.",
    },
    {
      question: "Is it on Google Play?",
      answer: "No. Download the signed APK from this page, moalfarras.space/mp2 or the GitHub Releases of the project.",
    },
  ],
  ar: [
    {
      question: "هل يتضمن MoPlayer Pro قنوات أو قوائم تشغيل؟",
      answer:
        "لا. MoPlayer Pro مشغّل فقط، لا يحتوي قنوات ولا قوائم تشغيل ولا اشتراكات. أنت من يربط حساب Xtream أو قائمة M3U يحق لك استخدامها.",
    },
    {
      question: "هل MoPlayer Pro ترقية لـ MoPlayer Classic؟",
      answer:
        "لا، هو تطبيق منفصل له حزمته وملف APK وتفعيله وتحديثاته. كلاهما مجاني ويمكن تثبيتهما معاً. Classic مناسب للصناديق القديمة، و Pro هو التطبيق الأحدث بمشغّل أغنى.",
    },
    {
      question: "ما إصدار أندرويد المطلوب؟",
      answer: "أندرويد 6.0 أو أحدث. صُمّم MoPlayer Pro أولاً لـ Android TV و Google TV و Fire TV، ويتكيّف مع هواتف وأجهزة أندرويد اللوحية.",
    },
    {
      question: "كيف أفعّل MoPlayer Pro؟",
      answer:
        "اختر QR Code في شاشة الدخول، وامسحه بهاتفك، ثم أضف مصدرك عبر moalfarras.space/activate. ويمكنك أيضاً الدخول بـ M3U أو Xtream مباشرة على التلفزيون.",
    },
    {
      question: "هل هو موجود على Google Play؟",
      answer: "لا. نزّل ملف APK الموقّع من هذه الصفحة أو من moalfarras.space/mp2 أو من GitHub Releases الخاص بالمشروع.",
    },
  ],
};

export function getMoPlayerFaqs(locale: Locale): FaqEntry[] {
  return classicFaqs[locale];
}

export function getMoPlayerProFaqs(locale: Locale): FaqEntry[] {
  return proFaqs[locale];
}
