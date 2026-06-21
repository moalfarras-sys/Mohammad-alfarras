"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownToLine,
  CheckCircle2,
  Download,
  Heart,
  KeyRound,
  Layers,
  List,
  MonitorPlay,
  Play,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tv2,
  Workflow,
  Zap,
} from "lucide-react";
import { useRef } from "react";

import { CoverflowGallery } from "@/components/site/coverflow-gallery";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { downloadSinceLabel, formatDownloadNumber, type DownloadStatsView } from "@/lib/download-display";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const t = {
  en: {
    badge: "Premium Android TV Media Player",
    heroTitle: "MoPlayer Pro",
    heroSub: "A warmer, faster, and more focused IPTV experience for Android TV and mobile.",
    heroBody:
      "A premium warm-glass interface, remote-first navigation, and a powerful playback engine bring live TV, movies, and series into one elegant surface — without clutter.",
    download: "Download APK",
    activate: "Activate / Control",
    releasePending: "Coming Soon",
    featuresTitle: "Built for the big screen",
    featuresSub: "Every detail is designed for Android TV navigation, long-session browsing, and a calm premium feel.",
    features: [
      { icon: "tv", title: "Android TV Optimized", body: "Full D-Pad navigation, large focus states, and a lean-back interface designed for remote control." },
      { icon: "list", title: "Private Playlist Support", body: "Add your own playlist link or file, then browse clean categories without clutter." },
      { icon: "key", title: "Provider Account Login", body: "Connect your provider details once and enjoy organized live TV, movies, and series." },
      { icon: "qr", title: "QR Code Activation", body: "Display a QR code on your TV and activate the app from your phone or computer." },
      { icon: "zap", title: "Smooth Playback", body: "A fast player surface with clear controls, stable playback, and a helpful external-player fallback." },
      { icon: "heart", title: "Favorites & Continue", body: "Save your favorite channels and pick up where you left off with continue watching." },
      { icon: "search", title: "Smart Search", body: "Find channels, movies, and series quickly with a TV-optimized search experience." },
      { icon: "layers", title: "Multi-Playlist", body: "Manage multiple playlists and switch between providers seamlessly." },
    ],
    loginTitle: "Multiple ways to connect",
    loginSub: "Choose the login method that works best for your setup.",
    loginMethods: [
      { title: "Playlist link", body: "Paste your private playlist link and keep categories easy to browse." },
      { title: "Provider account", body: "Enter your provider server, username, and password for an organized media library." },
      { title: "QR Code / Web Activation", body: "Display a code on your TV screen and activate from any phone or browser." },
    ],
    devicesTitle: "Works across your devices",
    devicesSub: "One app, optimized for every screen.",
    devices: [
      { icon: "tv", title: "Android TV", body: "Primary experience. Full remote control navigation with lean-back mode." },
      { icon: "phone", title: "Android Phone", body: "Touch-optimized interface with the same powerful features." },
      { icon: "monitor", title: "Fire TV / Stick", body: "Compatible with Amazon Fire TV devices." },
    ],
    galleryTitle: "App preview",
    gallerySub: "See MoPlayer Pro in action across different screens.",
    compareTitle: "MoPlayer vs MoPlayer Pro",
    compareSub: "MoPlayer Pro is the next-generation product line. It keeps the same trusted domain, but everything else is rebuilt for a calmer, richer experience.",
    compareOld: "MoPlayer Classic",
    compareNew: "MoPlayer Pro",
    compareOldPoints: ["Classic TV-first interface", "Reliable simple playback", "One familiar release path", "Standard dark theme"],
    compareNewPoints: ["Warm premium glass interface", "Richer playback controls", "Separate Pro download path", "Remote-first navigation and QR activation"],
    faqTitle: "Frequently asked questions",
    faqs: [
      { question: "Does MoPlayer Pro include channels or playlists?", answer: "No. MoPlayer Pro is a private player only. You connect your own authorized sources; the app does not provide channels or media." },
      { question: "How do I activate MoPlayer Pro?", answer: "Open the app on your TV, show the QR / activation code, then finish activation from your phone or from this website." },
      { question: "Which devices are supported?", answer: "Android TV (primary experience), Android phones, and Amazon Fire TV / Stick devices." },
      { question: "Is it on Google Play?", answer: "No public Google Play listing is shown. Download the official APK directly from this page." },
    ],
    ctaTitle: "Ready to try MoPlayer Pro?",
    ctaBody: "Download the latest APK or activate your device to get started.",
    disclaimer: "Legal notice",
    disclaimerBody:
      "MoPlayer Pro is a media player shell. It does not provide channels, playlists, subscriptions, or copyrighted media. Users connect only sources they are authorized to use.",
    support: "Get support",
    privacy: "Privacy policy",
    plannedBadge: "Coming Soon",
  },
  ar: {
    badge: "مشغل وسائط Android TV فاخر",
    heroTitle: "MoPlayer Pro",
    heroSub: "تجربة IPTV أدفأ وأسرع وأكثر تركيزاً لأجهزة Android TV والهواتف.",
    heroBody:
      "مبني بواجهة warm-glass فاخرة، تنقل أولاً بالريموت، ومحرك تشغيل قوي. يجمع MoPlayer Pro التلفزيون المباشر والأفلام والمسلسلات في واجهة أنيقة — بدون فوضى.",
    download: "تنزيل APK",
    activate: "التفعيل / التحكم",
    releasePending: "قريباً",
    featuresTitle: "مصمم للشاشة الكبيرة",
    featuresSub: "كل تفصيلة مصممة للتنقل على Android TV، جلسات المشاهدة الطويلة، وإحساس فاخر هادئ.",
    features: [
      { icon: "tv", title: "محسّن لـ Android TV", body: "تنقل كامل بالريموت، حالات تركيز واضحة، وواجهة مريحة للمشاهدة." },
      { icon: "list", title: "دعم القوائم الخاصة", body: "أضف رابطك أو ملفك الخاص وتصفح الفئات بوضوح وبدون ازدحام." },
      { icon: "key", title: "تسجيل حساب المزود", body: "اربط بيانات مزودك مرة واحدة واحصل على مكتبة منظمة للتلفزيون والأفلام والمسلسلات." },
      { icon: "qr", title: "تفعيل برمز QR", body: "اعرض رمز QR على تلفزيونك وفعّل التطبيق من هاتفك أو حاسوبك." },
      { icon: "zap", title: "تشغيل سلس", body: "سطح تشغيل سريع مع تحكم واضح وثبات أفضل وخيار تشغيل خارجي عند الحاجة." },
      { icon: "heart", title: "المفضلة والمتابعة", body: "احفظ قنواتك المفضلة وأكمل من حيث توقفت مع ميزة المتابعة." },
      { icon: "search", title: "بحث ذكي", body: "ابحث عن القنوات والأفلام والمسلسلات بسرعة بتجربة بحث محسّنة للتلفزيون." },
      { icon: "layers", title: "قوائم متعددة", body: "أدر قوائم تشغيل متعددة وانتقل بين المزودين بسلاسة." },
    ],
    loginTitle: "طرق متعددة للاتصال",
    loginSub: "اختر طريقة تسجيل الدخول الأنسب لإعدادك.",
    loginMethods: [
      { title: "رابط قائمة خاصة", body: "الصق رابطك الخاص وحافظ على الفئات مرتبة وسهلة التصفح." },
      { title: "حساب المزود", body: "أدخل رابط المزود واسم المستخدم وكلمة المرور للحصول على مكتبة منظمة." },
      { title: "رمز QR / تفعيل عبر الويب", body: "اعرض رمزاً على شاشة تلفزيونك وفعّل من أي هاتف أو متصفح." },
    ],
    devicesTitle: "يعمل على جميع أجهزتك",
    devicesSub: "تطبيق واحد، محسّن لكل شاشة.",
    devices: [
      { icon: "tv", title: "Android TV", body: "التجربة الأساسية. تنقل كامل بالريموت مع وضع الاسترخاء." },
      { icon: "phone", title: "هاتف Android", body: "واجهة محسّنة للمس بنفس الميزات القوية." },
      { icon: "monitor", title: "Fire TV / Stick", body: "متوافق مع أجهزة Amazon Fire TV." },
    ],
    galleryTitle: "معاينة التطبيق",
    gallerySub: "شاهد MoPlayer Pro على الشاشات المختلفة.",
    compareTitle: "MoPlayer مقابل MoPlayer Pro",
    compareSub: "MoPlayer Pro هو خط الإنتاج من الجيل الجديد. يبقى على نفس الدومين الموثوق، لكن كل شيء آخر أُعيد بناؤه لتجربة أغنى وأهدأ.",
    compareOld: "MoPlayer القديم",
    compareNew: "MoPlayer Pro",
    compareOldPoints: ["واجهة تلفزيونية كلاسيكية", "تشغيل بسيط وموثوق", "مسار تحميل مألوف", "ثيم داكن قياسي"],
    compareNewPoints: ["واجهة زجاجية دافئة وفاخرة", "تحكم أغنى أثناء التشغيل", "مسار تحميل خاص بإصدار Pro", "تنقل بالريموت وتفعيل عبر QR"],
    faqTitle: "الأسئلة الشائعة",
    faqs: [
      { question: "هل يتضمن MoPlayer Pro قنوات أو قوائم تشغيل؟", answer: "لا. MoPlayer Pro مشغل خاص فقط. تربط مصادرك المصرح لك بها، والتطبيق لا يوفّر قنوات أو محتوى." },
      { question: "كيف أفعّل MoPlayer Pro؟", answer: "افتح التطبيق على تلفزيونك، اعرض رمز QR / التفعيل، ثم أكمل التفعيل من هاتفك أو من هذا الموقع." },
      { question: "ما الأجهزة المدعومة؟", answer: "Android TV (التجربة الأساسية)، هواتف Android، وأجهزة Amazon Fire TV / Stick." },
      { question: "هل هو متوفر على Google Play؟", answer: "لا تُعرض صفحة Google Play عامة. نزّل ملف APK الرسمي مباشرة من هذه الصفحة." },
    ],
    ctaTitle: "جاهز لتجربة MoPlayer Pro؟",
    ctaBody: "نزّل أحدث ملف APK أو فعّل جهازك للبدء.",
    disclaimer: "تنبيه قانوني",
    disclaimerBody:
      "MoPlayer Pro واجهة تشغيل فقط. لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق. المستخدم يربط فقط المصادر التي يملك حق استخدامها.",
    support: "الحصول على الدعم",
    privacy: "سياسة الخصوصية",
    plannedBadge: "قريباً",
  },
};

const featureIcons: Record<string, React.ElementType> = {
  tv: Tv2, list: List, key: KeyRound, qr: QrCode, zap: Zap,
  heart: Heart, search: Search, layers: Layers,
};

const mp2Screenshots = [
  { id: "mp2-showcase-1", src: "/images/moplayer-pro-showcase-1.png", alt: "MoPlayer Pro complete IPTV showcase with features", label: "Showcase" },
  { id: "mp2-showcase-2", src: "/images/moplayer-pro-showcase-2.png", alt: "MoPlayer Pro premium viewing experience", label: "Experience" },
  { id: "mp2-home", src: "/images/moplayer-pro-home.webp", alt: "MoPlayer Pro warm gold Android TV home screen", label: "Home" },
  { id: "mp2-activation", src: "/images/moplayer-pro-activation.webp", alt: "MoPlayer Pro QR activation and website pairing flow", label: "Activation" },
  { id: "mp2-player", src: "/images/moplayer-pro-player.webp", alt: "MoPlayer Pro warm glass media player controls", label: "Player" },
  { id: "mp2-hero", src: "/images/moplayer-pro-hero.webp", alt: "MoPlayer Pro TV and phone setup", label: "Setup" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 70, damping: 15 } },
};

export function MoPlayer2Landing({
  ecosystem,
  locale = "en",
  downloadStats,
}: {
  ecosystem: AppEcosystemData;
  locale?: Locale;
  downloadStats?: DownloadStatsView;
}) {
  const isAr = locale === "ar";
  const c = repairMojibakeDeep(t[locale]);
  const latest = ecosystem.releases[0] ?? null;
  const primaryAsset = latest?.assets.find((a) => a.is_primary) ?? latest?.assets[0] ?? null;
  const appUnavailable =
    ecosystem.runtimeConfig?.enabled === false || ecosystem.runtimeConfig?.maintenanceMode === true;
  const unavailableMode = ecosystem.runtimeConfig?.enabled === false ? "disabled" : "maintenance";
  const unavailableMessage = ecosystem.runtimeConfig?.message?.trim();
  const hasDownload = !appUnavailable && latest && latest.assets.some((a) => a.external_url || a.storage_path);
  const downloadHref = hasDownload ? `/api/app/releases/${latest.slug}/download` : null;
  const downloadCount = formatDownloadNumber(downloadStats?.value ?? 0, locale);
  const downloadSince = downloadSinceLabel(downloadStats, locale);
  const activateHref = `/${locale}/activate?product=moplayer2`;
  const size = formatBytes(primaryAsset?.file_size_bytes);
  const downloaderCode = ecosystem.runtimeConfig?.downloaderCode || "4608937";
  const productName = ecosystem.product.product_name || c.heroTitle;
  const heroBadge = isAr ? c.badge : ecosystem.product.hero_badge || c.badge;
  const heroTitle = isAr ? c.heroTitle : productName;
  const heroSub = isAr ? c.heroSub : ecosystem.product.tagline || c.heroSub;
  const heroBody = isAr ? c.heroBody : ecosystem.product.long_description || ecosystem.product.short_description || c.heroBody;
  const heroImage = normalizePublicImagePath(ecosystem.product.hero_image_path || ecosystem.product.tv_banner_path || "/images/moplayer-pro-hero.webp");
  
  const galleryScreenshots = ecosystem.screenshots.length
    ? ecosystem.screenshots.map((shot, index) => ({
        id: shot.id,
        src: normalizePublicImagePath(shot.image_path),
        alt: shot.alt_text || shot.title || `${productName} screenshot`,
        label: shot.title || `${productName} ${index + 1}`,
      }))
    : mp2Screenshots.map((shot) => ({ ...shot, src: normalizePublicImagePath(shot.src) }));
    
  const featureList = isAr
    ? c.features
    : ecosystem.product.feature_highlights.length
      ? ecosystem.product.feature_highlights.map((item) => ({ icon: item.icon || "tv", title: item.title, body: item.body }))
      : c.features;

  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const yBg1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const yBg2 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  return (
    <main ref={containerRef} className="min-h-[150vh] bg-[#050505] text-white selection:bg-[#f4b860] selection:text-black overflow-hidden font-sans relative" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Textured Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] [background-size:40px_40px] opacity-20 pointer-events-none" />

      {/* Background Image */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[80vh] opacity-40">
          <Image src="/images/moplayer-pro-bg.png" alt="" fill sizes="100vw" className="object-cover object-top mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/70 to-[#050505] z-10" />
        </div>
      </div>

      {/* Animated Breathing Backgrounds - Gold / Warm theme for Pro */}
      <motion.div 
        style={{ y: yBg1 }}
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 inset-x-0 h-[900px] bg-gradient-to-b from-[#f4b860]/15 via-transparent to-transparent pointer-events-none blur-3xl z-0" 
      />
      <motion.div 
        style={{ y: yBg2 }}
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] right-[-300px] w-[1000px] h-[1000px] rounded-full bg-orange-600/8 blur-[150px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 -left-[200px] w-[800px] h-[800px] rounded-full bg-[#f4b860]/8 blur-[150px] pointer-events-none z-0" 
      />

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 px-6 sm:px-12 max-w-7xl mx-auto z-10 flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1 text-center lg:text-start z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: "spring" }} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#f4b860]/30 bg-[#f4b860]/10 backdrop-blur-md mb-5 md:mb-8 shadow-[0_0_20px_rgba(244,184,96,0.15)]">
            <Sparkles className="h-5 w-5 text-[#f4b860]" />
            <span className="text-sm font-bold tracking-widest uppercase text-[#f4b860]">{heroBadge}</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-[#fdf2e3] to-[#f4b860]/60 mb-4 md:mb-6 leading-[1.1] drop-shadow-sm">
            {heroTitle}
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-base md:text-xl text-white/90 mb-3 md:mb-4 font-semibold leading-relaxed">
            {heroSub}
          </motion.p>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-base md:text-lg text-white/60 mb-4 md:mb-6 max-w-2xl leading-relaxed font-light mx-auto lg:mx-0">
            {heroBody}
          </motion.p>

          {appUnavailable ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.34 }} className="mb-4 md:mb-6 max-w-2xl rounded-3xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-start text-amber-100 backdrop-blur-xl">
              <strong className="block text-sm font-black">
                {unavailableMode === "maintenance"
                  ? isAr ? "التطبيق قيد الصيانة" : "App under maintenance"
                  : isAr ? "التحميل متوقف مؤقتاً" : "Downloads temporarily disabled"}
              </strong>
              <span className="mt-1 block text-sm leading-6 text-amber-100/75">
                {unavailableMessage ||
                  (isAr
                    ? "نعمل على تحديث هذا الإصدار. زر التحميل متوقف حتى لا تحصل على ملف غير جاهز."
                    : "This release is being updated. The download button is paused so visitors do not receive a broken file.")}
              </span>
              <Link href={`/${locale}/support`} className="mt-3 inline-flex rounded-xl border border-amber-200/25 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-200/10">
                {isAr ? "تواصل مع الدعم" : "Contact support"}
              </Link>
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38 }} className="mb-4 md:mb-6 inline-flex items-center gap-4 rounded-3xl border border-[#f4b860]/25 bg-[#f4b860]/10 px-5 py-4 text-start backdrop-blur-xl shadow-[0_22px_68px_rgba(244,184,96,0.16)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4b860]/18 text-[#f4b860]">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#f4b860]/80">{isAr ? "تحميلات رسمية" : "Official downloads"}</span>
              <strong className="block text-3xl font-black text-white tabular-nums">{downloadCount}</strong>
              <span className="block text-xs font-semibold text-white/45">{downloadSince}</span>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-center justify-center lg:justify-start">
            {downloadHref ? (
              <a href={downloadHref} className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f4b860] to-[#e6a84f] text-black font-extrabold text-lg hover:from-white hover:to-white transition-all duration-300 shadow-[0_0_40px_rgba(244,184,96,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:-translate-y-1 flex items-center gap-3">
                <Download className="h-6 w-6" />
                {c.download}
              </a>
            ) : (
              <span className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm flex items-center gap-3 cursor-not-allowed">
                {c.releasePending}
              </span>
            )}
            <Link href={activateHref} className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300 backdrop-blur-md hover:-translate-y-1 flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <KeyRound className="h-6 w-6 text-white/80" />
              {c.activate}
            </Link>
          </motion.div>
        </div>
        
        <div className="flex-1 w-full relative">
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2, type: "spring" }} className="w-full relative z-10 rounded-xl overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(244,184,96,0.2)] bg-black">
              <Image src={heroImage} alt="MoPlayer Pro" width={1000} height={700} className="w-full h-auto object-cover" priority />
           </motion.div>
           <div className="absolute -inset-4 bg-gradient-to-r from-[#f4b860]/15 to-orange-500/15 rounded-2xl blur-xl z-0 pointer-events-none" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12 border-y border-white/10 bg-white/[0.02] backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-wrap justify-around items-center gap-8">
          {[
            { label: isAr ? "الإصدار" : "Version", value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
            { label: isAr ? "التحميلات" : "Downloads", value: downloadCount },
            { label: isAr ? "الحجم" : "Size", value: size ?? "APK" },
            { label: isAr ? "المنصة" : "Platform", value: "Android TV" },
            { label: isAr ? "الشاشة الكبيرة" : "Big Screen", value: ecosystem.product.android_tv_ready ? (isAr ? "جاهز" : "Ready") : "Android" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <span className="block text-white/50 text-sm font-bold uppercase tracking-widest mb-2">{s.label}</span>
              <strong className="block text-3xl font-black text-white">{s.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Universal Download Hero Card */}
      {latest && primaryAsset ? (
        <section className="relative py-16 px-6 sm:px-12 z-10">
          <div className="max-w-5xl mx-auto rounded-[3rem] overflow-hidden border border-[#f4b860]/30 bg-gradient-to-br from-[#f4b860]/10 to-black p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 shadow-[0_0_80px_rgba(244,184,96,0.15)] relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,184,96,0.15),transparent_50%)]" />
            <div className="flex-1 relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-6">
                <Download className="h-4 w-4" /> {isAr ? "تحميل رسمي" : "Official Download"}
              </span>
              <h2 className="text-3xl md:text-4xl font-black mb-6 text-white leading-tight">
                {isAr ? "ملف واحد لمعظم شاشات Android TV" : "One file for most Android TV screens"}
              </h2>
              <p className="text-white/70 text-lg leading-relaxed font-light mb-8">
                {isAr
                  ? "هذه النسخة هي الخيار الأسهل للتلفزيونات الحديثة وصناديق Android TV الشائعة."
                  : "This is the easiest option for modern televisions and common Android TV boxes."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <a href={`/api/app/releases/${latest.slug}/download`} className="px-6 py-3 rounded-xl bg-white text-black font-extrabold hover:bg-[#f4b860] hover:text-black transition-all shadow-lg flex items-center justify-center gap-3">
                   <Download className="h-5 w-5" />
                   {primaryAsset.label || (isAr ? "ملف APK موحد" : "Universal TV APK")}
                 </a>
              </div>
            </div>
            
            <div className="w-full md:w-auto min-w-[300px] p-8 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-xl relative z-10 flex flex-col items-center justify-center shadow-2xl">
               <QrCode className="h-12 w-12 text-[#f4b860] mb-4" />
               <span className="text-white/60 font-bold uppercase tracking-widest text-sm mb-2">{isAr ? "رمز التحميل" : "Download code"}</span>
               <span className="font-mono text-5xl font-black tracking-[0.2em] text-white">{downloaderCode}</span>
            </div>
          </div>
        </section>
      ) : null}

      {/* Bento Grid Features */}
      <section className="relative py-16 px-6 sm:px-12 z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f4b860]/40 text-[#f4b860] text-xs font-bold uppercase tracking-wider mb-8 bg-[#f4b860]/10 shadow-[0_0_15px_rgba(244,184,96,0.2)]">
            <MonitorPlay className="h-4 w-4" />
            {isAr ? "الميزات" : "Features"}
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-white max-w-4xl mx-auto leading-tight">{c.featuresTitle}</h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">{c.featuresSub}</p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureList.map((f) => {
            const Icon = featureIcons[f.icon] ?? CheckCircle2;
            return (
              <motion.article variants={itemVariants} key={f.title} className="p-8 rounded-[2rem] bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 hover:border-[#f4b860]/40 transition-all duration-500 group hover:-translate-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f4b860]/20 to-[#f4b860]/5 border border-[#f4b860]/20 flex items-center justify-center mb-6 text-[#f4b860] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{f.title}</h3>
                <p className="text-white/60 leading-relaxed font-light">{f.body}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* Screenshots Gallery */}
      <section className="relative py-16 px-6 sm:px-12 z-10 bg-white/[0.02] border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-4">
            <Play className="h-3.5 w-3.5" /> {isAr ? "معاينة" : "Preview"}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">{c.galleryTitle}</h2>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <CoverflowGallery
            locale={locale}
            images={galleryScreenshots.slice(0, 8).map((shot) => ({ id: String(shot.id), src: shot.src, alt: shot.alt, label: shot.label }))}
          />
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative py-16 px-6 sm:px-12 z-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 bg-blue-500/8">
            <Star className="h-3.5 w-3.5" /> {c.compareTitle}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-white leading-tight">{c.compareSub}</h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Classic Old */}
          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/8 flex flex-col items-center text-center">
             <div className="w-12 h-12 rounded-full bg-[#00e5ff]/15 flex items-center justify-center mb-4">
                <Tv2 className="h-6 w-6 text-[#00e5ff]" />
             </div>
             <h3 className="text-xl font-bold mb-5 text-white/70">{c.compareOld}</h3>
             <ul className="space-y-3 text-start w-full">
               {c.compareOldPoints.map((p) => (
                 <li key={p} className="flex items-start gap-3 text-white/50 text-sm">
                   <CheckCircle2 className="h-4 w-4 text-[#00e5ff]/50 shrink-0 mt-0.5" />
                   <span>{p}</span>
                 </li>
               ))}
             </ul>
          </div>
          
          {/* Pro New */}
          <div className="p-6 rounded-xl bg-gradient-to-b from-[#f4b860]/8 to-[#f4b860]/3 border border-[#f4b860]/25 flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_30px_rgba(244,184,96,0.1)]">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f4b86015,transparent)]" />
             <div className="w-12 h-12 rounded-full bg-[#f4b860] flex items-center justify-center mb-4 relative z-10 shadow-[0_0_15px_rgba(244,184,96,0.4)]">
                <Sparkles className="h-6 w-6 text-black" />
             </div>
             <h3 className="text-xl font-extrabold mb-5 text-white relative z-10">{c.compareNew}</h3>
             <ul className="space-y-3 text-start w-full relative z-10">
               {c.compareNewPoints.map((p) => (
                 <li key={p} className="flex items-start gap-3 text-white text-sm font-medium">
                   <Sparkles className="h-4 w-4 text-[#f4b860] shrink-0 mt-0.5" />
                   <span>{p}</span>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </section>

      {/* ── Device Support ── */}
      <section className="relative py-16 px-6 sm:px-12 z-10 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f4b860]/40 text-[#f4b860] text-xs font-bold uppercase tracking-wider mb-8 bg-[#f4b860]/10 shadow-[0_0_15px_rgba(244,184,96,0.2)]">
            <Smartphone className="h-4 w-4" /> {c.devicesTitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">{c.devicesSub}</h2>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {c.devices.map((d) => {
            const icons: Record<string, React.ElementType> = { tv: Tv2, phone: Smartphone, monitor: MonitorPlay };
            const Icon = icons[d.icon] ?? Tv2;
            return (
              <article key={d.title} className="p-10 rounded-[2rem] bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 hover:border-[#f4b860]/40 transition-all duration-500 group hover:-translate-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f4b860]/20 to-[#f4b860]/5 border border-[#f4b860]/20 flex items-center justify-center mb-8 text-[#f4b860] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg">
                  <Icon className="h-10 w-10" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">{d.title}</h3>
                <p className="text-white/60 leading-relaxed font-light">{d.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-16 px-6 sm:px-12 z-10 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-6">
              <Workflow className="h-4 w-4" /> {c.faqTitle}
            </span>
          </div>
          <div className="space-y-4">
            {(isAr ? c.faqs : ecosystem.faqs.length ? ecosystem.faqs : c.faqs).map((faq) => (
              <details key={faq.question} className="group rounded-2xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl open:bg-white/5 transition-colors overflow-hidden">
                <summary className="cursor-pointer p-6 font-bold text-xl text-white flex items-center justify-between list-none select-none hover:text-[#f4b860] transition-colors">
                  {faq.question}
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 group-open:rotate-180 transition-transform duration-300">
                    <ArrowDownToLine className="h-4 w-4" />
                  </span>
                </summary>
                <div className="p-6 pt-0 text-white/70 text-lg leading-relaxed font-light border-t border-white/5 mt-2">
                  <p className="pt-4">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-20 px-6 sm:px-12 z-10 border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4b860]/10 via-transparent to-transparent opacity-50 z-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider mb-8 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <ShieldCheck className="h-4 w-4" /> {c.disclaimer}
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-8 text-white">{c.ctaTitle}</h2>
          <p className="text-xl text-white/50 mb-8 max-w-2xl mx-auto leading-relaxed">{c.disclaimerBody}</p>
          
          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
            {downloadHref && (
              <a href={downloadHref} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f4b860] to-[#e6a84f] text-black font-extrabold text-lg hover:from-white hover:to-white transition-all duration-300 shadow-[0_0_40px_rgba(244,184,96,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:-translate-y-1 flex items-center gap-3">
                <Download className="h-6 w-6" /> {c.download}
              </a>
            )}
            <Link href={activateHref} className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300 backdrop-blur-md hover:-translate-y-1 flex items-center gap-3">
              <KeyRound className="h-6 w-6 text-white/80" /> {c.activate}
            </Link>
            <Link href={`/${locale}/support`} className="px-6 py-3 rounded-2xl bg-transparent border border-white/10 text-white/60 font-bold text-lg hover:bg-white/5 hover:text-white transition-all duration-300">
              {c.support}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
