import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  KeyRound,
  MonitorPlay,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { normalizePublicImagePath } from "@/lib/asset-url";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { WindowsRelease } from "@/lib/windows-release";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

/* ── Brand SVGs ── */
const AndroidIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 576 512" fill="currentColor" className={className}>
    <path d="M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10l48,83.09C62.83,203.36,8.81,273.23,0,356.63h576C567.19,273.23,513.17,203.36,429.15,157.45Z" />
  </svg>
);

const WindowsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 448 512" fill="currentColor" className={className}>
    <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z" />
  </svg>
);

const AppleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 384 512" fill="currentColor" className={className}>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

/* ── Color Tokens ── */
const colors = {
  pro:     { primary: "#FF6A3D", light: "#FFB59E", bg: "#FF5722" },
  classic: { primary: "#3b82f6", light: "#93c5fd", bg: "#2563eb" },
  pc:      { primary: "#06b6d4", light: "#67e8f9", bg: "#0891b2" },
  ios:     { primary: "#f59e0b", light: "#fde68a", bg: "#d97706" },
} as const;

/* ── Downloader (Android TV) codes — single source of truth.
   gateway → opens the official chooser page (pick Pro / Classic / PC)
   pro     → opens the MoPlayer Pro download directly ── */
const DOWNLOADER_CODES = {
  gateway: "7876083",
  pro: "4608937",
} as const;

/* ── Copy ── */
const copy = {
  en: {
    badge: "MoPlayer Product Family",
    title: "One Player.\nEvery Screen.",
    body: "Choose the MoPlayer edition built for the screen in front of you.",
    products: {
      pro: {
        eyebrow: "Pro",
        headline: "The gold standard for cinematic TV",
        body: "Flagship Android TV player with a gold glass interface, quick phone activation, and a calm living-room experience.",
        primaryCta: "Open Pro",
        secondaryCta: "Download APK",
        stats: ["Golden Glass", "Phone Activation", "Smart Home"],
      },
      classic: {
        eyebrow: "Classic",
        headline: "Fast & lightweight for all Android",
        body: "A light, familiar Android player for simple installs, quick loading, and older TV boxes.",
        primaryCta: "Open Classic",
        secondaryCta: "Download APK",
        stats: ["Lightweight", "Older Devices", "Remote-ready"],
      },
      pc: {
        eyebrow: "PC",
        headline: "Native desktop player for Windows",
        body: "MoPlayer on Windows with a polished installer, desktop controls, and a private PC activation flow.",
        primaryCta: "Explore PC",
        secondaryCta: "Download Setup",
        stats: ["Windows", "Desktop", "Mouse + Keys"],
      },
      ios: {
        eyebrow: "iOS",
        headline: "A polished iPhone player prepared for App Store",
        body: "Touch-first MoPlayer for iPhone with QR activation, Xtream and M3U setup, legal demo mode, and a temporary store button until Apple publishing is complete.",
        primaryCta: "Open iOS",
        secondaryCta: "App Store soon",
        stats: ["iPhone", "QR Activation", "Legal Demo"],
      },
    },
    services: "Unified Services",
    activateCta: "Activate",
    servicesTitle: "One clear product flow across every edition.",
    servicesBody: "Activation, support, official downloads, and privacy stay consistent across every MoPlayer product.",
    servicesList: [
      ["Activation", "Each device opens the correct private pairing flow."],
      ["Support", "One clear route for product and setup questions."],
      ["Downloads", "Each edition opens the right official file."],
      ["Privacy", "Private sources remain under the user's control."],
    ],
    legalTitle: "Player-only legal notice",
    legalBody:
      "MoPlayer products are media players only. They do not sell or provide channels, playlists, subscriptions, or copyrighted media. Users must connect only sources they own or are legally authorized to access.",
    coming: "Expanding Ecosystem",
    comingBody: "Native builds for more screens are in active preparation.",
    futures: [
      { name: "MoPlayer iOS", platform: "iPhone + iPad", body: "Touch-first Apple app with clean source setup.", icon: "ios" as const },
      { name: "MoPlayer Apple TV", platform: "tvOS", body: "Siri Remote navigation with Apple-style restraint.", icon: "apple-tv" as const },
      { name: "MoPlayer LG TV", platform: "webOS", body: "Planned for the LG TV store with a native layout.", icon: "lg" as const },
      { name: "MoPlayer Samsung TV", platform: "Tizen", body: "Planned Samsung TV app — store metadata in progress.", icon: "samsung" as const },
    ],
  },
  ar: {
    badge: "عائلة تطبيقات MoPlayer",
    title: "مشغّل واحد.\nلكل شاشاتك.",
    body: "تجربة مشاهدة واحدة متقنة عبر أندرويد والتلفزيون وويندوز — سريعة، أنيقة، وخفيفة. اختر الإصدار الأنسب لشاشتك وابدأ خلال دقيقة.",
    products: {
      pro: {
        eyebrow: "Pro",
        headline: "المعيار الذهبي للترفيه السينمائي",
        body: "تطبيق Android TV بواجهة ذهبية فاخرة، تفعيل سريع من الهاتف، وتجربة هادئة للشاشة الكبيرة.",
        primaryCta: "افتح Pro",
        secondaryCta: "تحميل APK",
        stats: ["واجهة ذهبية", "تفعيل من الهاتف", "شاشة ذكية"],
      },
      classic: {
        eyebrow: "Classic",
        headline: "أداء فائق السرعة لأندرويد",
        body: "مشغل أندرويد خفيف ومألوف للتثبيت السريع والأجهزة القديمة وصناديق التلفزيون البسيطة.",
        primaryCta: "افتح Classic",
        secondaryCta: "تحميل APK",
        stats: ["خفيف", "أجهزة قديمة", "ريموت"],
      },
      pc: {
        eyebrow: "PC",
        headline: "مشغل مكتبي لنظام Windows",
        body: "تجربة MoPlayer على Windows مع مثبت أنيق، تحكم مكتبي، وتفعيل خاص للكمبيوتر.",
        primaryCta: "اكتشف PC",
        secondaryCta: "تحميل المثبت",
        stats: ["ويندوز", "مكتبي", "ماوس وكيبورد"],
      },
    },
    services: "خدمات موحدة",
    activateCta: "تفعيل",
    servicesTitle: "مسار منتج واحد وواضح في كل إصدار.",
    servicesBody: "التفعيل والدعم والتنزيلات الرسمية والخصوصية تبقى متناسقة في جميع منتجات MoPlayer.",
    servicesList: [
      ["التفعيل", "كل جهاز يفتح مسار الربط الخاص به."],
      ["الدعم", "مسار واضح لأسئلة المنتج والإعداد."],
      ["التنزيلات", "كل إصدار يفتح ملفه الرسمي الصحيح."],
      ["الخصوصية", "تبقى المصادر الخاصة تحت تحكم المستخدم."],
    ],
    legalTitle: "تنبيه قانوني خاص بالمشغل",
    legalBody:
      "منتجات MoPlayer هي مشغلات وسائط فقط. لا تبيع ولا توفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمياً بحقوق النشر. يجب على المستخدم ربط المصادر التي يملكها أو يملك تصريحاً قانونياً للوصول إليها فقط.",
    coming: "منظومة تتوسع",
    comingBody: "نسخ لأجهزة إضافية قيد التطوير.",
    futures: [
      { name: "MoPlayer iOS", platform: "iPhone + iPad", body: "تطبيق لمس لأجهزة Apple.", icon: "ios" as const },
      { name: "MoPlayer Apple TV", platform: "tvOS", body: "نسخة مع تنقل Siri Remote.", icon: "apple-tv" as const },
      { name: "MoPlayer LG TV", platform: "webOS", body: "قيد التطوير لمتجر LG TV.", icon: "lg" as const },
      { name: "MoPlayer Samsung TV", platform: "Tizen", body: "قيد التطوير لتلفزيونات Samsung.", icon: "samsung" as const },
    ],
  },
} as const;

function appHeroImage(app: AppEcosystemData | undefined, fallback: string) {
  return normalizePublicImagePath(app?.product.hero_image_path || app?.product.tv_banner_path || app?.screenshots[0]?.image_path || fallback);
}

function appGalleryImages(app: AppEcosystemData | undefined, fallback: string[]) {
  const images = app?.screenshots.map((shot) => normalizePublicImagePath(shot.image_path)).filter(Boolean) ?? [];
  return images.length ? images : fallback;
}

function windowsGalleryImages(release?: WindowsRelease | null) {
  const images = release?.screenshotItems?.length
    ? release.screenshotItems.map((item) => item.url)
    : release?.screenshots ?? [];
  return images.map((item) => normalizePublicImagePath(item)).filter(Boolean);
}

// Galleries must never repeat the hero (the hero already renders as the card's
// main image), and must be de-duplicated, so thumbnails are real extra shots.
function galleryWithoutHero(hero: string, gallery: string[]) {
  return Array.from(new Set(gallery.filter((image) => image && image !== hero)));
}

function localizedRuntimeHref(locale: Locale, value: string | undefined, fallback: string) {
  const href = String(value ?? "").trim() || fallback;
  if (href.startsWith("/en/") || href.startsWith("/ar/")) {
    return href.replace(/^\/(en|ar)\//, `/${locale}/`);
  }
  return href;
}

function iosRuntimeConfig(locale: Locale, pro?: AppEcosystemData) {
  const ios = pro?.runtimeConfig?.ios;
  const pageHref = withLocale(locale, "apps/moplayer-ios");
  return {
    enabled: ios?.enabled !== false,
    storeHref: localizedRuntimeHref(locale, ios?.storeUrl, `${pageHref}#app-store-coming-soon`),
    activationHref: localizedRuntimeHref(locale, ios?.activationUrl, `${withLocale(locale, "activate")}?product=moplayer2&platform=ios`),
    buttonLabel: ios?.buttonLabel?.trim(),
    heroImage: normalizePublicImagePath(ios?.heroImageUrl || appHeroImage(pro, "/images/moplayer-pro-home.webp")),
  };
}

function iosProductCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      eyebrow: "iOS",
      headline: "تطبيق iPhone مصقول وجاهز لمسار App Store",
      body: "نسخة MoPlayer للموبايل بواجهة لمس، تفعيل QR، إعداد Xtream و M3U، وضع demo قانوني، وزر متجر مؤقت إلى حين اكتمال نشر Apple.",
      primaryCta: "افتح iOS",
      secondaryCta: "App Store قريباً",
      stats: ["iPhone", "تفعيل QR", "Demo قانوني"],
    };
  }
  return copy.en.products.ios;
}

function getProducts(
  locale: Locale,
  data: {
    classic?: AppEcosystemData;
    pro?: AppEcosystemData;
    windowsRelease?: WindowsRelease | null;
  } = {},
) {
  const c = repairMojibakeDeep(copy[locale].products);
  const iosConfig = iosRuntimeConfig(locale, data.pro);
  const iosCopy = iosProductCopy(locale);
  const proGallery = appGalleryImages(data.pro, ["/images/moplayer-pro-showcase-1.png", "/images/moplayer-pro-home.webp", "/images/moplayer-pro-hero.webp", "/images/moplayer-pro-player.webp"]);
  const classicGallery = appGalleryImages(data.classic, ["/images/moplayer-classic-promo.png", "/images/moplayer_ui_playlist-final.png", "/images/moplayer-activation-flow.webp"]);
  const pcGallery = windowsGalleryImages(data.windowsRelease);
  const pcCardImage = normalizePublicImagePath(
    data.windowsRelease?.cardImage ||
      data.windowsRelease?.heroImage ||
      pcGallery[0] ||
      "/images/moplayer-pc-desktop.png",
  );
  const proHero = appHeroImage(data.pro, "/images/moplayer-pro-showcase-2.png");
  const classicHero = appHeroImage(data.classic, "/images/moplayer-tv-hero.png");
  const pcDownloadHref =
    data.windowsRelease?.maintenance || !data.windowsRelease?.file
      ? undefined
      : "/api/app/download/latest?product=moplayer-pc&platform=windows";
  return [
    {
      id: "pro", name: "MoPlayer Pro", tone: "pro" as const,
      heroImage: proHero,
      galleryImages: galleryWithoutHero(proHero, proGallery),
      href: withLocale(locale, "apps/moplayer2"),
      downloadHref: data.pro?.releases[0] ? "/api/app/download/latest?product=moplayer2" : undefined,
      activateHref: `${withLocale(locale, "activate")}?product=moplayer2`,
      platformIcon: <AndroidIcon className="w-4 h-4 text-[#FFB59E]" />,
      ...c.pro,
    },
    {
      id: "classic", name: "MoPlayer Classic", tone: "classic" as const,
      heroImage: classicHero,
      galleryImages: galleryWithoutHero(classicHero, classicGallery),
      href: withLocale(locale, "apps/moplayer/classic"),
      downloadHref: data.classic?.releases[0] ? "/api/app/download/latest?product=moplayer" : undefined,
      activateHref: `${withLocale(locale, "activate")}?product=moplayer`,
      platformIcon: <AndroidIcon className="w-4 h-4 text-[#93c5fd]" />,
      ...c.classic,
    },
    {
      id: "pc", name: "MoPlayer PC", tone: "pc" as const,
      heroImage: pcCardImage,
      galleryImages: galleryWithoutHero(pcCardImage, pcGallery),
      href: withLocale(locale, "apps/moplayer-pc"),
      downloadHref: pcDownloadHref,
      activateHref: `${withLocale(locale, "activate")}?product=moplayer-pc&platform=windows`,
      platformIcon: <WindowsIcon className="w-4 h-4 text-[#67e8f9]" />,
      ...c.pc,
    },
    ...(iosConfig.enabled
      ? [
          {
            id: "ios",
            name: "MoPlayer iOS",
            tone: "ios" as const,
            heroImage: iosConfig.heroImage,
            // iOS has no own screenshots yet — show only its hero rather than
            // borrowing (misplacing) Pro screenshots. Wire iOS shots in admin later.
            galleryImages: [],
            href: withLocale(locale, "apps/moplayer-ios"),
            downloadHref: iosConfig.storeHref,
            activateHref: iosConfig.activationHref,
            platformIcon: <AppleIcon className="w-4 h-4 text-[#fde68a]" />,
            ...iosCopy,
            secondaryCta: iosConfig.buttonLabel || iosCopy.secondaryCta,
          },
        ]
      : []),
  ];
}

/* Main component */
export function MoPlayerProductHub({
  locale,
  classic,
  pro,
  windowsRelease,
}: {
  locale: Locale;
  classic?: AppEcosystemData;
  pro?: AppEcosystemData;
  windowsRelease?: WindowsRelease | null;
}) {
  const isAr = locale === "ar";
  const c = repairMojibakeDeep(copy[locale]);
  const products = getProducts(locale, { classic, pro, windowsRelease });

  const downloader = isAr
    ? {
        eyebrow: "تثبيت على تلفزيون أندرويد",
        title: "حمّل MoPlayer على تلفزيونك عبر تطبيق Downloader",
        subtitle: "اكتب أحد الكودين في تطبيق Downloader على التلفزيون: كود البوابة يفتح صفحة الاختيار، وكود Pro يفتح MoPlayer Pro مباشرة.",
        codes: [
          { code: DOWNLOADER_CODES.gateway, label: "كود البوابة — كل تطبيقات MoPlayer", hint: "يفتح صفحة الاختيار: Pro أو Classic أو PC" },
          { code: DOWNLOADER_CODES.pro, label: "كود MoPlayer Pro المباشر", hint: "يفتح تحميل MoPlayer Pro مباشرة" },
        ],
        urlLabel: "الموقع الرسمي",
        url: "moalfarras.space/ar/apps/moplayer",
        steps: [
          "افتح تطبيق Downloader على التلفزيون",
          "اكتب أحد الكودين بالأعلى ثم اضغط Go",
          "كود البوابة يفتح صفحة الاختيار، وكود Pro يفتح Pro مباشرة",
          "اضغط تحميل APK وانتظر اكتمال التنزيل",
          "اضغط Install ثم Open",
        ],
        safetyTitle: "إذا ظهرت رسالة أثناء التثبيت",
        safetyBody:
          "حمّل الملف من صفحة MoPlayer الرسمية فقط، وتأكد من اسم المنتج والإصدار قبل التثبيت. قد يطلب Android إذناً للتثبيت من Downloader لأن الملف ليس من متجر التطبيقات.",
      }
    : {
        eyebrow: "Install on Android TV",
        title: "Get MoPlayer on your TV via the Downloader app",
        subtitle: "Type one of the two codes in the Downloader app on your TV: the gateway code opens the chooser page, the Pro code opens MoPlayer Pro directly.",
        codes: [
          { code: DOWNLOADER_CODES.gateway, label: "Gateway code — all MoPlayer apps", hint: "Opens the chooser: Pro, Classic, or PC" },
          { code: DOWNLOADER_CODES.pro, label: "MoPlayer Pro direct code", hint: "Opens the MoPlayer Pro download directly" },
        ],
        urlLabel: "Official site",
        url: "moalfarras.space/en/apps/moplayer",
        steps: [
          "Open the Downloader app on your TV",
          "Type one of the codes above, then press Go",
          "Gateway code opens the chooser; Pro code opens Pro directly",
          "Press Download APK and wait for it to finish",
          "Press Install, then Open",
        ],
        safetyTitle: "If an install message appears",
        safetyBody:
          "Download only from the official MoPlayer page, then check the product name and version before installing. Android may ask for permission because the file is installed through Downloader instead of an app store.",
      };

  return (
    <main className="min-h-screen bg-[#060606] text-white overflow-hidden font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Background — premium ambient, brand-integrated with the site */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* depth base */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#0c0a09_0%,#070707_55%,#040404_100%)]" />
        {/* fine dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:26px_26px] opacity-[0.015]" />
        {/* warm MoPlayer glow (top) */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] max-w-[140vw] h-[520px] bg-[radial-gradient(ellipse_at_center,rgba(255,87,34,0.16),transparent_70%)] blur-[100px]" />
        {/* cool site-accent glow ties it to the blue/cyan site theme */}
        <div className="absolute top-1/3 -right-32 w-[600px] max-w-[90vw] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.10),transparent_70%)] blur-[120px]" />
        {/* deep amber base glow (bottom) */}
        <div className="absolute bottom-0 left-0 w-[700px] max-w-[120vw] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(230,74,25,0.10),transparent_70%)] blur-[120px]" />
        {/* vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_30%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ─── Hero ─── */}
      <section className="relative z-10 pt-32 pb-12 md:pt-36 md:pb-16 px-6 max-w-5xl mx-auto text-center">
        <div>
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-bold tracking-widest uppercase text-white/60">
              <BadgeCheck className="h-3.5 w-3.5 text-amber-400" />
              {c.badge}
            </span>
          </div>

          <h1 className="critical-hero-title text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-[1.08] whitespace-pre-line">
            {c.title}
          </h1>

          <p className="text-base md:text-lg text-white/70 max-w-lg mx-auto mb-8 leading-relaxed">
            {c.body}
          </p>

          <div className="flex flex-wrap gap-2.5 justify-center">
            {products.map((p) => {
              const col = colors[p.tone];
              return (
                <a key={p.id} href={`#${p.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:-translate-y-0.5" style={{ color: col.light, borderColor: `${col.primary}25`, background: `${col.primary}08` }}>
                  {p.platformIcon}
                  {p.name}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Product Showcase Cards ─── */}
      <section className="relative z-10 px-6 pb-16 max-w-6xl mx-auto space-y-6">
        {products.map((product, idx) => {
          const col = colors[product.tone];
          const isReversed = idx % 2 === 1;

          return (
            <article
              key={product.id}
              id={product.id}
              className="moplayer-product-card relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm hover:border-white/15 transition-all duration-400"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(ellipse at ${isReversed ? "100%" : "0%"} 50%, ${col.primary}10, transparent 60%)` }} />

              <div className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
                {/* ── Text Side ── */}
                <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center border" style={{ background: `${col.primary}12`, borderColor: `${col.primary}25` }}>
                      {product.platformIcon}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ color: col.light, borderColor: `${col.primary}25`, background: `${col.primary}08` }}>
                      {product.eyebrow}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 leading-tight">{product.headline}</h2>
                  <p className="text-white/75 text-sm md:text-[15px] leading-relaxed mb-4 max-w-md">{product.body}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {product.stats.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-md text-[11px] font-semibold border" style={{ color: col.light, borderColor: `${col.primary}33`, background: `${col.primary}12` }}>{s}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {product.href && (
                      <Link href={product.href} prefetch={false} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${col.primary}, ${col.bg}cc)`, boxShadow: `0 4px 16px ${col.primary}25` }}>
                        {product.primaryCta} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {product.downloadHref && (
                      <a href={product.downloadHref} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white/70 bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-0.5">
                        <ArrowDownToLine className="h-3.5 w-3.5" /> {product.secondaryCta}
                      </a>
                    )}
                    {product.activateHref && (
                      <Link href={product.activateHref} prefetch={false} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white/70 bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-0.5">
                        <KeyRound className="h-3.5 w-3.5" /> {c.activateCta}
                      </Link>
                    )}
                  </div>
                </div>

                {/* ── Image Side — Hero + Gallery Mosaic ── */}
                <div className="flex-1 p-4 lg:p-5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Main hero image */}
                    <div className={`relative rounded-xl overflow-hidden ${product.galleryImages.length >= 2 ? "col-span-1 row-span-2" : "col-span-2"}`}>
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      <Image
                        src={product.heroImage}
                        alt={product.name}
                        width={600}
                        height={400}
                        sizes={
                          product.galleryImages.length >= 2
                            ? "(max-width: 640px) 44vw, (max-width: 1024px) 46vw, 520px"
                            : "(max-width: 640px) 88vw, (max-width: 1024px) 92vw, 520px"
                        }
                        quality={70}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700"
                      />
                    </div>

                    {/* Gallery thumbnails (right column) */}
                    {product.galleryImages.slice(0, 2).map((img, i) => (
                      <div key={img} className="relative rounded-xl overflow-hidden">
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <Image
                          src={img}
                          alt={`${product.name} screenshot ${i + 1}`}
                          width={300}
                          height={200}
                          sizes="(max-width: 640px) 44vw, (max-width: 1024px) 46vw, 260px"
                          quality={70}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ─── Install on Android TV via Downloader ─── */}
      <section className="relative z-10 px-6 pb-16 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-b from-orange-500/[0.06] to-white/[0.01] p-6 md:p-10">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] max-w-[120%] h-[300px] rounded-full blur-[100px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(255,120,40,0.18), transparent 70%)" }}
          />

          <div className="relative text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-[11px] font-bold uppercase tracking-wider mb-3">
              <MonitorPlay className="h-3.5 w-3.5" /> {downloader.eyebrow}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 max-w-2xl mx-auto leading-tight">{downloader.title}</h2>
            <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">{downloader.subtitle}</p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-2 items-stretch max-w-3xl mx-auto mb-6">
            {downloader.codes.map((entry, idx) => (
              <div
                key={entry.code}
                className={`rounded-2xl border px-6 py-4 text-center flex flex-col justify-center ${
                  idx === 0 ? "border-orange-500/40 bg-black/40" : "border-amber-400/40 bg-amber-500/[0.06]"
                }`}
                style={idx === 0 ? { boxShadow: "0 0 40px rgba(255,120,40,0.18)" } : undefined}
              >
                <div className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${idx === 0 ? "text-orange-300/80" : "text-amber-300/90"}`}>
                  {entry.label}
                </div>
                <div dir="ltr" className="text-3xl md:text-4xl font-black tracking-[0.15em] text-white tabular-nums">{entry.code}</div>
                <div className="text-[11px] text-white/55 mt-1.5 leading-snug">{entry.hint}</div>
              </div>
            ))}
          </div>
          <div className="relative max-w-3xl mx-auto mb-9 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-center flex flex-col justify-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">{downloader.urlLabel}</div>
            <div dir="ltr" className="text-sm md:text-base font-semibold text-cyan-300 break-all">{downloader.url}</div>
          </div>

          <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0 max-w-5xl mx-auto">
            {downloader.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <span className="shrink-0 grid place-items-center w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 font-black text-sm">{i + 1}</span>
                <span className="text-white/80 text-sm leading-relaxed pt-1">{step}</span>
              </li>
            ))}
          </ol>

          <div className="relative mt-6 max-w-5xl mx-auto flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 md:p-5">
            <div className="shrink-0 w-9 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 grid place-items-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">{downloader.safetyTitle}</h3>
              <p className="text-white/70 text-[13px] leading-relaxed">{downloader.safetyBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="moplayer-deferred-section relative z-10 px-6 pb-16 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 text-red-300 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white mb-2">{c.legalTitle}</h2>
              <p className="text-sm leading-relaxed text-white/70 max-w-4xl">{c.legalBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section className="moplayer-deferred-section relative z-10 py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/6 mb-3">
              <Zap className="h-3 w-3" /> {c.services}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">{c.servicesTitle}</h2>
            <p className="text-white/70 text-sm max-w-md mx-auto">{c.servicesBody}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {c.servicesList.map(([title, body], index) => {
              const Icon = [KeyRound, Zap, ArrowDownToLine, ShieldCheck][index] || Zap;
              return (
                <article key={title} className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-emerald-500/15 transition-all duration-300 group">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mb-2.5 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                  <p className="text-white/70 text-xs leading-relaxed">{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Future Platforms ─── */}
      <section className="moplayer-deferred-section relative z-10 py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/25 text-sky-400 text-[10px] font-bold uppercase tracking-wider bg-sky-500/6 mb-3">
              <MonitorPlay className="h-3 w-3" /> {c.coming}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 max-w-lg mx-auto">{c.comingBody}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {c.futures.filter((item) => item.icon !== "ios").map((item) => {
              const isApple = item.icon === "apple-tv";
              return (
                <article key={item.name} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-white/10 transition-all duration-300 group flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center mb-2.5 text-white/50 group-hover:text-white/80 transition-colors">
                    {isApple ? <AppleIcon className="h-4 w-4" /> : <MonitorPlay className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] font-bold text-white/65 uppercase tracking-widest mb-0.5">{item.platform}</span>
                  <h3 className="text-sm font-bold text-white mb-1.5">{item.name}</h3>
                  <p className="text-white/70 text-xs leading-relaxed flex-1 mb-2.5">{item.body}</p>
                  <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/8">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                    </span>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">
                      {isAr ? "قيد التطوير" : "In Dev"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
