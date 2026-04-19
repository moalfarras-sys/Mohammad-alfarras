"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownToLine,
  ChevronRight,
  ShieldCheck,
  Zap,
  PlayCircle,
  MonitorSmartphone,
  MessageCircle,
  TerminalSquare,
  Lock,
  Tv,
  Wifi,
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  Quote,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

type WhyItem = { icon: "tv" | "cpu" | "wifi" | "shield"; title: string; body: string };

type MoPlayerCopy = {
  badge: string;
  heroTitleA: string;
  heroTitleB: string;
  heroTagline: string;
  download: string;
  releasePending: string;
  exploreFeatures: string;
  navPortfolio: string;
  navPrivacy: string;
  navSupport: string;
  manifestoTitleA: string;
  manifestoTitleB: string;
  manifestoBody: string;
  bentoLabel: string;
  bentoTitle: string;
  shippedOn: string;
  size: string;
  targetApi: string;
  privacyTitle: string;
  privacyBullets: string[];
  installFlowTitle: string;
  faqTitle: string;
  ctaTitle: string;
  ctaBody: string;
  downloadApk: string;
  contactSupport: string;
  footerRights: string;
  footerPrivacy: string;
  footerHelp: string;
  brandTagline: string;
  noTracking: string;
  encryptedDownload: string;
  fluidNavigation: string;
  // ── new marketing blocks ──
  whyEyebrow: string;
  whyTitle: string;
  whyBody: string;
  whyItems: WhyItem[];
  compareEyebrow: string;
  compareTitle: string;
  compareBody: string;
  compareUs: string;
  compareThem: string;
  compareRows: { label: string; us: string; them: string }[];
  testimonialEyebrow: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;
  ecosystemEyebrow: string;
  ecosystemTitle: string;
  ecosystemBody: string;
  ecosystemSurfaces: { title: string; body: string }[];
};

function copyFor(locale: Locale): MoPlayerCopy {
  if (locale === "ar") {
    return {
      badge: "المعيار الجديد للوسائط",
      heroTitleA: "سينمائي.",
      heroTitleB: "بدون تنازلات.",
      heroTagline:
        "MoPlayer يقدّم تجربة وسائط واحدة، نظيفة، وسريعة على الهاتف وAndroid TV. بدون إعلانات، بدون تتبع، وبدون قوائم لا تنتهي.",
      download: "تنزيل لـ Android",
      releasePending: "الإصدار قيد الإطلاق",
      exploreFeatures: "استكشف الميزات",
      navPortfolio: "موقعي",
      navPrivacy: "الخصوصية",
      navSupport: "الدعم",
      manifestoTitleA: "مصمَّم للأداء.",
      manifestoTitleB: "مبني للتركيز.",
      manifestoBody:
        "حذفت كل ما يعطّل التشغيل. ما تبقّى تجربة وسائط واحدة، تستجيب فوراً لأمر التشغيل، وتجعل المحتوى هو البطل لا الواجهة.",
      bentoLabel: "تنقل سلس",
      bentoTitle: "المحتوى أولاً.\nبدون تشتيت.",
      shippedOn: "أُطلق بتاريخ",
      size: "الحجم",
      targetApi: "الإصدار المستهدف",
      privacyTitle: "الخصوصية والأمان",
      privacyBullets: [
        "بدون تتبع أو تحليلات تطفّلية.",
        "روابط تنزيل مشفّرة ومباشرة من مصدري.",
        "لا حسابات إجبارية ولا اشتراكات مخفية.",
      ],
      installFlowTitle: "خطوات التثبيت بكل بساطة",
      faqTitle: "أسئلة يطرحها معظم الناس",
      ctaTitle: "جاهز لتجربة وسائط أنظف؟",
      ctaBody:
        "حمّل آخر إصدار مباشرة بدون انتظار المتاجر. أي مشكلة، تواصل معي شخصياً عبر واتساب أو نموذج الدعم.",
      downloadApk: "تنزيل APK",
      contactSupport: "تواصل مع الدعم",
      footerRights: "جميع الحقوق محفوظة.",
      footerPrivacy: "سياسة الخصوصية",
      footerHelp: "مركز المساعدة",
      brandTagline: "من إنتاج محمد الفراس",
      noTracking: "بدون تتبّع أو تحليلات تطفّلية.",
      encryptedDownload: "روابط تنزيل مشفّرة ومباشرة.",
      fluidNavigation: "تنقّل سلس",

      whyEyebrow: "لماذا MoPlayer",
      whyTitle: "أربع قرارات تصميم تشرح الفرق.",
      whyBody:
        "MoPlayer لم يُبنَ ليكون مشغّلاً عاماً. بُني ليحلّ مشاكل تجربة المستخدم في تطبيقات الوسائط الحالية: البطء، الإعلانات، الواجهات المزدحمة، والتنقل المتعب على شاشة التلفاز.",
      whyItems: [
        { icon: "cpu", title: "أداء فعلي", body: "تشغيل لحظي على أجهزة Android من 2017 وما بعد، بدون توقّف ولا انقطاع في المعاينات." },
        { icon: "tv", title: "هوية واحدة بين الهاتف والتلفاز", body: "نفس التصميم على Android TV، مع تنقّل ريموت كنترول مدروس وعرض ركيزته الراحة من 3 أمتار." },
        { icon: "shield", title: "احترام كامل للمستخدم", body: "بدون تتبّع، بدون تسجيل قسري، بدون ميزات مدفوعة مخفية. عقد واضح: تطبيق، نقطة." },
        { icon: "wifi", title: "يعمل بدون تعقيد", body: "تنزيل مباشر، تثبيت بنقرة، وتحديثات يدوية بسيطة بدون انتظار موافقة المتجر." },
      ],

      compareEyebrow: "المقارنة الصريحة",
      compareTitle: "لا أبيع MoPlayer كأفضل تطبيق في العالم — أبيعه كأنظف تطبيق ستجرّبه.",
      compareBody:
        "هذه مقارنة صريحة بين MoPlayer وأغلب مشغّلات الوسائط المجانية الأخرى التي يستخدمها الناس يومياً.",
      compareUs: "MoPlayer",
      compareThem: "تطبيقات شائعة أخرى",
      compareRows: [
        { label: "إعلانات داخل التطبيق", us: "صفر", them: "نعم، أحياناً ملء الشاشة" },
        { label: "تتبع المستخدم", us: "بدون تتبع", them: "تحليلات + معرّفات إعلانية" },
        { label: "زمن تشغيل أول فيديو", us: "أقل من ثانية", them: "2 – 5 ثوانٍ مع تشتيت" },
        { label: "Android TV", us: "تجربة أصلية مدروسة", them: "نسخة هاتف مكبّرة" },
        { label: "تحديثات", us: "مباشرة من الموقع", them: "اعتماد على المتجر" },
        { label: "التسعير", us: "مجاني وكامل", them: "مجاني مع جدار دفع للميزات" },
      ],

      testimonialEyebrow: "صوت من المستخدمين",
      testimonialQuote:
        "أول تطبيق وسائط أحس فيه بأن المصمم فكّر فيّ كمستخدم، لا كمصدر إعلانات. الواجهة أسرع من نتفلكس على نفس الجهاز.",
      testimonialAuthor: "مستخدم تجريبي",
      testimonialRole: "Android TV — Berlin",

      ecosystemEyebrow: "جزء من منظومة أكبر",
      ecosystemTitle: "MoPlayer ليس وحيداً. هو منتج داخل منظومة موقع شخصي ومدوّنة وقناة يوتيوب.",
      ecosystemBody:
        "كل ما يخص MoPlayer (الإصدارات، الدعم، الخصوصية، الميديا) متاح مباشرة على نفس الموقع، تحت إشراف شخصي وبدون شركات وسيطة.",
      ecosystemSurfaces: [
        { title: "موقع شخصي", body: "صفحات الأعمال والسيرة والتواصل ضمن نفس البراند." },
        { title: "محتوى يوتيوب", body: "+1.5 مليون مشاهدة، نفس مبادئ التطبيق: شفافية ووضوح." },
        { title: "دعم مباشر", body: "بريد + واتساب + نموذج دعم، الردود تأتي مني شخصياً." },
      ],
    };
  }
  return {
    badge: "The new standard in media",
    heroTitleA: "Cinematic.",
    heroTitleB: "Uncompromised.",
    heroTagline:
      "MoPlayer is one focused media experience for your phone and Android TV. No ads, no tracking, no endless menus.",
    download: "Download for Android",
    releasePending: "Release pending",
    exploreFeatures: "Explore features",
    navPortfolio: "Portfolio",
    navPrivacy: "Privacy",
    navSupport: "Support",
    manifestoTitleA: "Engineered for performance.",
    manifestoTitleB: "Built for focus.",
    manifestoBody:
      "I removed every layer that breaks playback. What's left is a single experience that reacts instantly and lets the content be the hero — not the interface.",
    bentoLabel: "Fluid navigation",
    bentoTitle: "Content first.\nDistractions zero.",
    shippedOn: "Shipped on",
    size: "Size",
    targetApi: "Target API",
    privacyTitle: "Privacy & safety",
    privacyBullets: [
      "No tracking, no intrusive analytics.",
      "Direct encrypted downloads from my own source.",
      "No forced accounts, no hidden subscriptions.",
    ],
    installFlowTitle: "Installation, simply explained",
    faqTitle: "Questions most people ask",
    ctaTitle: "Ready for cleaner media playback?",
    ctaBody:
      "Get the latest version directly without storefront delays. Anything you need, reach me personally on WhatsApp or via the support form.",
    downloadApk: "Download APK",
    contactSupport: "Contact support",
    footerRights: "All rights reserved.",
    footerPrivacy: "Privacy policy",
    footerHelp: "Help center",
    brandTagline: "by Mohammad Alfarras",
    noTracking: "No tracking or intrusive analytics.",
    encryptedDownload: "Direct, encrypted downloads.",
    fluidNavigation: "Fluid navigation",

    whyEyebrow: "Why MoPlayer",
    whyTitle: "Four design decisions that explain the difference.",
    whyBody:
      "MoPlayer wasn't built to be a generic player. It was built to fix the real UX problems in current media apps: slowness, ads, cluttered interfaces, and exhausting TV navigation.",
    whyItems: [
      { icon: "cpu", title: "Real performance", body: "Instant playback on Android devices from 2017 onwards. No stalls, no broken previews." },
      { icon: "tv", title: "One identity, phone & TV", body: "The same design language on Android TV, with thoughtful remote control navigation tuned for the 3-meter view." },
      { icon: "shield", title: "Full respect for the user", body: "No tracking, no forced sign-up, no hidden paywalls. One simple contract: it's an app." },
      { icon: "wifi", title: "Works without friction", body: "Direct download, one-tap install, and lightweight manual updates without waiting on store reviews." },
    ],

    compareEyebrow: "Honest comparison",
    compareTitle: "I don't sell MoPlayer as the best app in the world — I sell it as the cleanest one you'll try.",
    compareBody:
      "Side-by-side with most other free media players people install daily.",
    compareUs: "MoPlayer",
    compareThem: "Other popular apps",
    compareRows: [
      { label: "In-app advertising", us: "Zero", them: "Yes, sometimes full-screen" },
      { label: "User tracking", us: "None", them: "Analytics + ad IDs" },
      { label: "First playback time", us: "Under a second", them: "2 – 5 sec with distractions" },
      { label: "Android TV", us: "Native, focused experience", them: "Enlarged phone version" },
      { label: "Updates", us: "Direct from the website", them: "Tied to the storefront" },
      { label: "Pricing", us: "Free and complete", them: "Free with feature paywalls" },
    ],

    testimonialEyebrow: "User voice",
    testimonialQuote:
      "First media app where I felt the designer was thinking about me as a user, not as an ad source. The UI is faster than Netflix on the same device.",
    testimonialAuthor: "Beta user",
    testimonialRole: "Android TV — Berlin",

    ecosystemEyebrow: "Part of a bigger ecosystem",
    ecosystemTitle: "MoPlayer doesn't stand alone. It's a product inside a personal site, a YouTube channel, and a content brand.",
    ecosystemBody:
      "Everything about MoPlayer — releases, support, privacy, media — is available on the same website, run personally, with no middlemen.",
    ecosystemSurfaces: [
      { title: "Personal site", body: "Work, CV, and contact pages all live under the same brand." },
      { title: "YouTube content", body: "+1.5M views, same principles as the app: transparency and clarity." },
      { title: "Direct support", body: "Email + WhatsApp + support form. Replies come from me personally." },
    ],
  };
}

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(locale: Locale, value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function finalAssetPath(path: string | null | undefined, fallback: string) {
  if (!path) return fallback;
  if (path.includes("-final.")) return path;
  return path.replace(/\.(png|jpe?g)$/i, "-final.$1");
}

const featureIcons = [PlayCircle, Zap, ShieldCheck, MonitorSmartphone];

export function MoPlayerLanding({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const { product, screenshots, faqs, releases } = ecosystem;
  const t = copyFor(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const latestRelease = releases[0] ?? null;
  const primaryAsset = latestRelease?.assets.find((asset) => asset.is_primary) ?? latestRelease?.assets[0] ?? null;
  const releaseDate = formatDate(locale, latestRelease?.published_at ?? product.last_updated_at);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const navLinks = [
    { label: t.navPortfolio, href: `/${locale}` },
    { label: locale === "ar" ? "الأعمال" : "Work", href: `/${locale}/work` },
    { label: t.navPrivacy, href: "/privacy" },
    { label: t.navSupport, href: "/support" },
  ];

  return (
    <div dir={dir} className="bg-[#050811] text-white selection:bg-[#00E5FF]/30 selection:text-white font-sans antialiased">
      
      {/* --- FLOATING NAVBAR --- */}
      <nav className="fixed inset-x-0 top-0 z-50 px-6 py-4 transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/5 bg-[#0A0F1C]/80 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[12px] shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-transform group-hover:scale-105 overflow-hidden">
              <Image 
                src={finalAssetPath(product.logo_path, "/images/moplayer-brand-logo-final.png")} 
                alt="Logo" 
                width={40} height={40} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-white">MoPlayer</span>
              <span className="text-[9px] uppercase tracking-widest text-[#00E5FF]">{t.brandTagline}</span>
            </div>
          </Link>
          
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-xs font-semibold uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
            {latestRelease && (
              <Link href={`/api/app/releases/${latestRelease.slug}/download`} className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                <ArrowDownToLine className="h-4 w-4" />
                {t.download}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- CINEMATIC HERO --- */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-20">
        {/* Deep background effects */}
        <div className="absolute inset-0 bg-[#050811]" />
        <div className="absolute top-1/4 left-1/2 -mt-[200px] -ml-[300px] h-[600px] w-[600px] rounded-full bg-[#0055FF]/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#00E5FF]/10 blur-[120px]" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />

        <motion.div style={{ y, opacity }} className="relative z-10 flex max-w-5xl flex-col items-center px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] backdrop-blur-md"
          >
            <Zap className="h-3 w-3 fill-[#00E5FF]" />
            {product.hero_badge || t.badge}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-6xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[7rem]"
          >
            {t.heroTitleA} <br />
            <span className="bg-gradient-to-r from-white via-[#C4D2FF] to-[#00E5FF] bg-clip-text text-transparent">
              {t.heroTitleB}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 max-w-2xl text-balance text-lg font-medium leading-relaxed text-white/60 md:text-xl"
          >
            {product.tagline || t.heroTagline}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
          >
            {latestRelease ? (
              <Link 
                href={`/api/app/releases/${latestRelease.slug}/download`} 
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-8 py-4 font-bold text-black transition-all hover:scale-105 active:scale-95"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <ArrowDownToLine className="h-5 w-5" />
                {product.default_download_label || t.download}
              </Link>
            ) : (
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white/50 backdrop-blur-md">
                    {t.releasePending}
                </div>
            )}
            <Link 
              href="#manifesto" 
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10 active:scale-95"
            >
              {t.exploreFeatures}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Specs Mini Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-6 text-[11px] font-medium uppercase tracking-widest text-white/40"
          >
            <span>v{latestRelease?.version_name || "1.0.0"}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span>SDK {product.android_target_sdk}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span>{primaryAsset?.abi || "Universal"}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span>Secure</span>
          </motion.div>
        </motion.div>
      </section>

      {/* --- HERO PRODUCT SHOWCASE --- */}
      <section className="relative z-20 -mt-24 w-full px-6 md:-mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0F1C] shadow-[0_40px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5 md:rounded-[3rem]"
        >
          <Image 
            src={finalAssetPath(product.hero_image_path, finalAssetPath(screenshots[0]?.image_path, "/images/moplayer-hero-3d-final.png"))}
            alt="MoPlayer UI Interface"
            width={1920}
            height={1080}
            priority
            className="w-full object-cover"
          />
        </motion.div>
      </section>

      {/* --- FEATURES MANIFESTO --- */}
      <section id="manifesto" className="mx-auto max-w-7xl px-6 py-32 md:py-48">
        <div className="mb-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white">
            {t.manifestoTitleA} <br/> <span className="text-white/40">{t.manifestoTitleB}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
            {product.long_description || t.manifestoBody}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {product.feature_highlights.map((item, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.04]"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/80 ring-1 ring-white/10 transition-colors group-hover:bg-[#00E5FF]/10 group-hover:text-[#00E5FF] group-hover:ring-[#00E5FF]/30">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* --- BENTO GRID: DETAILS & SPECS --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2 h-auto md:h-[600px]">
          
          {/* Main Visual Block */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0A0F1C] md:col-span-2 md:row-span-2">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <Image 
              src={finalAssetPath(screenshots[1]?.image_path, "/images/moplayer-ui-mock-final.png")}
              alt="Playlist feature"
              fill
              className="object-cover opacity-60 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 z-20 p-8 md:p-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-md">
                <TerminalSquare className="h-4 w-4 text-[#00E5FF]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{t.fluidNavigation}</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl whitespace-pre-line">{t.bentoTitle}</h3>
            </div>
          </div>

          {/* Release Block */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent p-8">
            <div>
               <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00E5FF]/20 text-[#00E5FF]">
                 <ArrowDownToLine className="h-5 w-5" />
               </div>
               <h3 className="text-2xl font-bold text-white tracking-tight">Version {latestRelease?.version_name || "1.0"}</h3>
               {releaseDate && <p className="mt-2 text-sm text-white/50">{t.shippedOn} {releaseDate}</p>}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">{t.size}</span>
                    <span className="font-mono text-white/80">{formatBytes(primaryAsset?.file_size_bytes) || "—"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-white/40">{t.targetApi}</span>
                    <span className="font-mono text-white/80">{product.android_target_sdk}</span>
                </div>
            </div>
          </div>

          {/* Security / Legal Block */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8">
             <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50">
                 <Lock className="h-5 w-5" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{t.privacyTitle}</h3>
             <ul className="space-y-3 mt-4">
               {t.privacyBullets.map((bullet) => (
                 <li key={bullet} className="flex items-start gap-3 text-sm text-white/50">
                   <ShieldCheck className="h-4 w-4 shrink-0 text-[#00E5FF] mt-0.5" />
                   <span>{bullet}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </section>

      {/* --- WHY MOPLAYER --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-16 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00E5FF]">
            <Sparkles className="h-3 w-3" />
            {t.whyEyebrow}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">{t.whyTitle}</h2>
          <p className="mt-6 text-lg leading-relaxed text-white/55">{t.whyBody}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {t.whyItems.map((item, idx) => {
            const IconMap = { tv: Tv, cpu: Cpu, wifi: Wifi, shield: ShieldCheck };
            const Icon = IconMap[item.icon];
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: idx * 0.08 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-7 md:p-8 transition-all hover:border-[#00E5FF]/30"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-60" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.40), transparent 60%)" }} />
                <div className="relative flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00E5FF] transition-colors group-hover:bg-[#00E5FF]/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* --- COMPARISON TABLE --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-12 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {t.compareEyebrow}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">{t.compareTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55">{t.compareBody}</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/8 bg-[#0A0F1C]">
          <div className="grid grid-cols-3 border-b border-white/5 bg-white/[0.02] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40 md:px-8">
            <span>{locale === "ar" ? "الميزة" : "Feature"}</span>
            <span className="text-center text-[#00E5FF]">{t.compareUs}</span>
            <span className="text-center text-white/50">{t.compareThem}</span>
          </div>
          {t.compareRows.map((row, idx) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
              className="grid grid-cols-3 items-center border-b border-white/5 px-6 py-5 last:border-0 hover:bg-white/[0.02] md:px-8"
            >
              <span className="text-sm font-medium text-white/85">{row.label}</span>
              <span className="flex items-center justify-center gap-2 text-center text-sm font-bold text-[#00E5FF]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{row.us}</span>
              </span>
              <span className="flex items-center justify-center gap-2 text-center text-sm text-white/45">
                <XCircle className="h-4 w-4 shrink-0 opacity-60" />
                <span>{row.them}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- TESTIMONIAL --- */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-gradient-to-br from-[#00E5FF]/[0.06] to-transparent p-10 md:p-16"
        >
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.4), transparent 60%)" }} />
          <Quote className="h-14 w-14 text-[#00E5FF]/40" />
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-[#FFB800] text-[#FFB800]" />
            ))}
          </div>
          <p className="relative mt-8 text-2xl font-medium leading-relaxed text-white md:text-3xl">
            “{t.testimonialQuote}”
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6366F1] text-base font-black text-black">
              U
            </div>
            <div>
              <div className="text-sm font-bold text-white">{t.testimonialAuthor}</div>
              <div className="text-xs text-white/50">{t.testimonialRole}</div>
            </div>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
              {t.testimonialEyebrow}
            </span>
          </div>
        </motion.div>
      </section>

      {/* --- ECOSYSTEM --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-12 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {t.ecosystemEyebrow}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">{t.ecosystemTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55">{t.ecosystemBody}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {t.ecosystemSurfaces.map((surface, idx) => (
            <motion.div
              key={surface.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-7 transition-colors hover:border-[#00E5FF]/30 hover:bg-white/[0.03]"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-white">{surface.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{surface.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- INSTALLATION & HOW IT WORKS --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="grid gap-12 md:grid-cols-2">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-8">{t.installFlowTitle}</h3>
                <div className="space-y-6">
                    {product.install_steps.map((step, idx) => (
                        <div key={idx} className="flex gap-6 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white/50 transition-colors group-hover:border-[#00E5FF]/50 group-hover:text-[#00E5FF]">
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-1">{step.title}</h4>
                                <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/5 bg-[#0A0F1C] p-8 md:p-12">
                <h3 className="text-2xl font-bold tracking-tight text-white mb-6">{t.faqTitle}</h3>
                <div className="space-y-6">
                    {faqs.slice(0, 4).map((faq) => (
                        <div key={faq.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                            <h4 className="text-base font-semibold text-white mb-2">{faq.question}</h4>
                            <p className="text-sm text-white/50 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* --- SUPPORT & FINAL CTA --- */}
      <section className="relative border-t border-white/5 bg-[#0A0F1C] py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -ml-[400px] h-[300px] w-[800px] rounded-full bg-[#00E5FF]/10 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl mb-6 text-balance">
            {t.ctaTitle}
          </h2>
          <p className="text-lg text-white/50 mb-12">
            {t.ctaBody}
          </p>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            {latestRelease && (
              <Link 
                href={`/api/app/releases/${latestRelease.slug}/download`} 
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00E5FF] px-8 py-4 font-bold text-black transition-transform hover:scale-105 active:scale-95 sm:w-auto"
              >
                <ArrowDownToLine className="h-5 w-5" />
                {t.downloadApk}
              </Link>
            )}
            <Link 
                href={product.support_whatsapp || "/support"}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition-colors hover:bg-white/10 active:scale-95 sm:w-auto"
            >
                <MessageCircle className="h-5 w-5" />
                {t.contactSupport}
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
                <Image src={finalAssetPath(product.logo_path, "/images/moplayer-brand-logo-final.png")} alt="Logo" width={24} height={24} className="h-6 w-6 invert brightness-0 opacity-50" />
                <span className="text-sm font-semibold text-white/30">© {new Date().getFullYear()} MoPlayer · {t.footerRights}</span>
            </div>
            <div className="flex gap-6 text-sm font-medium text-white/40">
                <Link href="/privacy" className="hover:text-white transition-colors">{t.footerPrivacy}</Link>
                <Link href="/support" className="hover:text-white transition-colors">{t.footerHelp}</Link>
            </div>
        </div>
      </footer>

    </div>
  );
}
