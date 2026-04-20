"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownToLine,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Lock,
  MessageCircle,
  MonitorSmartphone,
  PlayCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  TerminalSquare,
  Tv,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

/* ─────────────────────────────────────────────────────────────────────────────
 * MoPlayer landing — Apple-cinematic INSIDE the unified SiteNavbar + SiteFooter.
 * All content wraps in .cinematic-section so colors stay product-dark no matter
 * which theme the rest of the site is in.
 * Navigation is handled by the parent shell; this component only renders content.
 * ─────────────────────────────────────────────────────────────────────────── */

type WhyIcon = "tv" | "cpu" | "wifi" | "shield";
type WhyItem = { icon: WhyIcon; title: string; body: string };
type CompareRow = { label: string; us: string; them: string };
type EcosystemSurface = { title: string; body: string };

type MoPlayerCopy = {
  badge: string;
  heroTitleA: string;
  heroTitleB: string;
  heroTagline: string;
  download: string;
  releasePending: string;
  exploreFeatures: string;
  manifestoTitleA: string;
  manifestoTitleB: string;
  manifestoBody: string;
  fluidNavigation: string;
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
  whyEyebrow: string;
  whyTitle: string;
  whyBody: string;
  whyItems: WhyItem[];
  compareEyebrow: string;
  compareTitle: string;
  compareBody: string;
  compareUs: string;
  compareThem: string;
  compareRows: CompareRow[];
  testimonialEyebrow: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;
  ecosystemEyebrow: string;
  ecosystemTitle: string;
  ecosystemBody: string;
  ecosystemSurfaces: EcosystemSurface[];
};

function copyFor(locale: Locale): MoPlayerCopy {
  if (locale === "ar") {
    return {
      badge: "المعيار الجديد للوسائط",
      heroTitleA: "سينمائي.",
      heroTitleB: "بدون تنازلات.",
      heroTagline:
        "MoPlayer يقدّم تجربة وسائط واحدة، نظيفة، وسريعة على الهاتف و Android TV. بدون إعلانات، بدون تتبع، وبدون قوائم لا تنتهي.",
      download: "تنزيل لـ Android",
      releasePending: "الإصدار قيد الإطلاق",
      exploreFeatures: "استكشف الميزات",
      manifestoTitleA: "مصمَّم للأداء.",
      manifestoTitleB: "مبني للتركيز.",
      manifestoBody:
        "حذفت كل ما يعطّل التشغيل. ما تبقّى تجربة وسائط واحدة تستجيب فوراً لأمر التشغيل، وتجعل المحتوى هو البطل لا الواجهة.",
      fluidNavigation: "تنقّل سلس",
      bentoTitle: "المحتوى أولاً.\nبدون تشتيت.",
      shippedOn: "أُطلق بتاريخ",
      size: "الحجم",
      targetApi: "الإصدار المستهدف",
      privacyTitle: "الخصوصية والأمان",
      privacyBullets: [
        "بدون تتبع أو تحليلات تطفلية.",
        "روابط تنزيل مشفّرة ومباشرة.",
        "لا حسابات إجبارية ولا اشتراكات مخفية.",
      ],
      installFlowTitle: "خطوات التثبيت ببساطة",
      faqTitle: "أسئلة يطرحها الناس",
      ctaTitle: "جاهز لتجربة وسائط أنظف؟",
      ctaBody:
        "حمّل آخر إصدار مباشرة بدون انتظار المتاجر. أي مشكلة، تواصل معي شخصياً عبر واتساب أو نموذج الدعم.",
      downloadApk: "تنزيل APK",
      contactSupport: "تواصل مع الدعم",
      whyEyebrow: "لماذا MoPlayer",
      whyTitle: "أربع قرارات تصميم تشرح الفرق.",
      whyBody:
        "لم يُبنَ MoPlayer ليكون مشغّلاً عاماً. بُني ليحلّ مشاكل تطبيقات الوسائط الحالية: البطء، الإعلانات، الواجهات المزدحمة، والتنقل المتعب على التلفاز.",
      whyItems: [
        { icon: "cpu", title: "أداء فعلي", body: "تشغيل لحظي على أجهزة Android من 2017 فما بعد، بدون توقف ولا انقطاع في المعاينات." },
        { icon: "tv", title: "هوية واحدة بين الهاتف والتلفاز", body: "نفس التصميم على Android TV، مع تنقّل ريموت مدروس وعرض ركيزته الراحة من 3 أمتار." },
        { icon: "shield", title: "احترام كامل للمستخدم", body: "بدون تتبع، بدون تسجيل قسري، بدون ميزات مدفوعة مخفية. عقد واضح: تطبيق — نقطة." },
        { icon: "wifi", title: "يعمل بدون تعقيد", body: "تنزيل مباشر، تثبيت بنقرة، وتحديثات يدوية خفيفة بدون انتظار موافقة المتجر." },
      ],
      compareEyebrow: "المقارنة الصريحة",
      compareTitle: "لا أبيع MoPlayer كأفضل تطبيق — أبيعه كأنظف تطبيق ستجرّبه.",
      compareBody: "هذه مقارنة مباشرة بين MoPlayer وأغلب مشغّلات الوسائط المجانية الأخرى.",
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
      ecosystemTitle: "MoPlayer ليس وحيداً. هو منتج داخل موقع شخصي، مدوّنة، وقناة يوتيوب.",
      ecosystemBody:
        "كل ما يخص MoPlayer (الإصدارات، الدعم، الخصوصية، الميديا) متاح مباشرة على نفس الموقع، بإشراف شخصي وبدون شركات وسيطة.",
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
    manifestoTitleA: "Engineered for performance.",
    manifestoTitleB: "Built for focus.",
    manifestoBody:
      "I removed every layer that breaks playback. What's left is a single experience that reacts instantly and lets the content be the hero — not the interface.",
    fluidNavigation: "Fluid navigation",
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
    compareTitle: "I don't sell MoPlayer as the best — I sell it as the cleanest you'll try.",
    compareBody: "Side-by-side with most other free media players people install daily.",
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

const whyIconMap: Record<WhyIcon, typeof Tv> = {
  tv: Tv,
  cpu: Cpu,
  wifi: Wifi,
  shield: ShieldCheck,
};

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
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <div dir={dir} className="cinematic-section font-sans antialiased">
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative flex min-h-[88svh] flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-14 sm:pt-20 md:pt-28"
      >
        <div className="absolute inset-0" style={{ background: "#050507" }} />
        <div className="absolute left-1/2 top-1/4 -mt-[180px] -ml-[260px] h-[520px] w-[520px] rounded-full bg-[#0055FF]/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[#00E5FF]/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />

        <motion.div style={{ y, opacity }} className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] backdrop-blur-md"
          >
            <Zap className="h-3 w-3 fill-[#00E5FF]" />
            {product.hero_badge || t.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-[clamp(3rem,9vw,7.5rem)] font-extrabold leading-[0.98] tracking-tight"
          >
            {t.heroTitleA}
            <br />
            <span className="bg-gradient-to-r from-white via-[#C4D2FF] to-[#00E5FF] bg-clip-text text-transparent">{t.heroTitleB}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-2xl text-balance text-base font-medium leading-relaxed text-white/65 md:mt-8 md:text-lg"
          >
            {product.tagline || t.heroTagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            {latestRelease ? (
              <Link
                href={`/api/app/releases/${latestRelease.slug}/download`}
                className="group relative inline-flex min-h-12 items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-7 py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
              >
                <ArrowDownToLine className="h-5 w-5" />
                {product.default_download_label || t.download}
              </Link>
            ) : (
              <div className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-4 font-semibold text-white/60 backdrop-blur-md">
                {t.releasePending}
              </div>
            )}
            <Link
              href="#manifesto"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-4 font-semibold transition-colors hover:bg-white/10"
            >
              {t.exploreFeatures}
              <ChevronRight className={`h-4 w-4 ${dir === "rtl" ? "-scale-x-100" : ""}`} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-widest text-white/45"
          >
            <span>v{latestRelease?.version_name || "1.0.0"}</span>
            <span className="hidden sm:inline">·</span>
            <span>SDK {product.android_target_sdk}</span>
            <span className="hidden sm:inline">·</span>
            <span>{primaryAsset?.abi || "Universal"}</span>
            <span className="hidden sm:inline">·</span>
            <span>Secure</span>
          </motion.div>
        </motion.div>
      </section>

      {/* HERO SHOWCASE */}
      <section className="relative z-20 -mt-16 w-full px-4 md:-mt-28 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0A0F1C] shadow-[0_40px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5 md:rounded-[2.5rem]"
        >
          <Image
            src={finalAssetPath(
              product.hero_image_path,
              finalAssetPath(screenshots[0]?.image_path, "/images/moplayer-hero-3d-final.png"),
            )}
            alt="MoPlayer interface preview"
            width={1920}
            height={1080}
            priority
            className="w-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
          />
        </motion.div>
      </section>

      {/* MANIFESTO + feature grid */}
      <section id="manifesto" className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-36">
        <div className="mb-16 md:mb-24 md:text-center">
          <h2 className="text-[clamp(1.75rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight">
            {t.manifestoTitleA} <br />
            <span className="text-white/40">{t.manifestoTitleB}</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 md:mx-auto md:text-lg">
            {product.long_description || t.manifestoBody}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {product.feature_highlights.map((item, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-7 transition-colors hover:bg-white/[0.04]"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-white/80 ring-1 ring-white/10 transition-colors group-hover:bg-[#00E5FF]/10 group-hover:text-[#00E5FF] group-hover:ring-[#00E5FF]/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight md:text-xl">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* WHY MOPLAYER */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6 md:pb-32">
        <div className="mb-14 max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#00E5FF]">
            <Sparkles className="h-3 w-3" />
            {t.whyEyebrow}
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight">{t.whyTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55 md:text-lg">{t.whyBody}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {t.whyItems.map((item, idx) => {
            const Icon = whyIconMap[item.icon];
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: idx * 0.06 }}
                className="group relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6 transition-all hover:border-[#00E5FF]/30 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00E5FF] transition-colors group-hover:bg-[#00E5FF]/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold md:text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* COMPARE */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6 md:pb-32">
        <div className="mb-10 max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {t.compareEyebrow}
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight">{t.compareTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55">{t.compareBody}</p>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0A0F1C]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-white/45 md:grid-cols-3 md:px-8 md:text-xs">
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
              className="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-3 border-b border-white/5 px-4 py-4 text-sm last:border-0 hover:bg-white/[0.02] md:grid-cols-3 md:px-8 md:py-5"
            >
              <span className="font-medium text-white/85">{row.label}</span>
              <span className="flex items-center justify-center gap-2 text-center font-bold text-[#00E5FF]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-xs md:text-sm">{row.us}</span>
              </span>
              <span className="flex items-center justify-center gap-2 text-center text-white/45">
                <XCircle className="h-4 w-4 shrink-0 opacity-60" />
                <span className="text-xs md:text-sm">{row.them}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="mx-auto max-w-5xl px-4 pb-24 md:px-6 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#00E5FF]/[0.06] to-transparent p-8 md:p-14"
        >
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#00E5FF]/25 blur-[90px]" />
          <Quote className="h-10 w-10 text-[#00E5FF]/40 md:h-12 md:w-12" />
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-[#FFB800] text-[#FFB800]" />
            ))}
          </div>
          <p className="relative mt-6 text-xl font-medium leading-relaxed md:text-2xl">“{t.testimonialQuote}”</p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6366F1] text-sm font-black text-black">U</div>
            <div>
              <div className="text-sm font-bold">{t.testimonialAuthor}</div>
              <div className="text-xs text-white/50">{t.testimonialRole}</div>
            </div>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/55">
              {t.testimonialEyebrow}
            </span>
          </div>
        </motion.div>
      </section>

      {/* BENTO DETAILS */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6 md:pb-32">
        <div className="grid gap-5 md:grid-cols-3 md:grid-rows-2 md:h-[560px]">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0A0F1C] md:col-span-2 md:row-span-2">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <Image
              src={finalAssetPath(screenshots[1]?.image_path, "/images/moplayer-ui-mock-final.png")}
              alt="MoPlayer playlist"
              fill
              className="object-cover opacity-60 transition-transform duration-700 hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
            <div className="absolute bottom-0 left-0 z-20 p-6 md:p-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-md">
                <TerminalSquare className="h-4 w-4 text-[#00E5FF]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{t.fluidNavigation}</span>
              </div>
              <h3 className="whitespace-pre-line text-[clamp(1.5rem,3vw,2.75rem)] font-bold tracking-tight">{t.bentoTitle}</h3>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00E5FF]/20 text-[#00E5FF]">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight md:text-2xl">Version {latestRelease?.version_name || "1.0"}</h3>
              {releaseDate ? <p className="mt-2 text-sm text-white/50">{t.shippedOn} {releaseDate}</p> : null}
            </div>
            <div className="mt-6 border-t border-white/5 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/40">{t.size}</span>
                <span className="font-mono text-white/80">{formatBytes(primaryAsset?.file_size_bytes) || "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-white/40">{t.targetApi}</span>
                <span className="font-mono text-white/80">{product.android_target_sdk}</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/55">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="mb-1 text-lg font-bold tracking-tight md:text-xl">{t.privacyTitle}</h3>
            <ul className="mt-3 space-y-2.5">
              {t.privacyBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-white/55">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00E5FF]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* INSTALL + FAQ */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6 md:pb-32">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="mb-6 text-xl font-bold tracking-tight md:mb-8 md:text-2xl">{t.installFlowTitle}</h3>
            <div className="space-y-5 md:space-y-6">
              {product.install_steps.map((step, idx) => (
                <div key={idx} className="group flex gap-5 md:gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white/55 transition-colors group-hover:border-[#00E5FF]/50 group-hover:text-[#00E5FF]">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="mb-1 text-base font-bold md:text-lg">{step.title}</h4>
                    <p className="text-sm leading-relaxed text-white/55">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-[#0A0F1C] p-6 md:p-10">
            <h3 className="mb-6 text-xl font-bold tracking-tight md:text-2xl">{t.faqTitle}</h3>
            <div className="space-y-5 md:space-y-6">
              {faqs.slice(0, 4).map((faq) => (
                <div key={faq.id} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                  <h4 className="mb-2 text-sm font-semibold md:text-base">{faq.question}</h4>
                  <p className="text-sm leading-relaxed text-white/55">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6 md:pb-32">
        <div className="mb-10 max-w-3xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {t.ecosystemEyebrow}
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight">{t.ecosystemTitle}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/55">{t.ecosystemBody}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {t.ecosystemSurfaces.map((surface, idx) => (
            <motion.div
              key={surface.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-[#00E5FF]/30 hover:bg-white/[0.03]"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold">{surface.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{surface.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-white/5 bg-[#0A0F1C] py-24 md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -ml-[400px] h-[240px] w-[800px] rounded-full bg-[#00E5FF]/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center md:px-6">
          <h2 className="text-balance text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.1] tracking-tight">
            {t.ctaTitle}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/55 md:text-lg">{t.ctaBody}</p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {latestRelease ? (
              <Link
                href={`/api/app/releases/${latestRelease.slug}/download`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00E5FF] px-7 py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
              >
                <ArrowDownToLine className="h-5 w-5" />
                {t.downloadApk}
              </Link>
            ) : null}
            <Link
              href={product.support_whatsapp || "/support"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-4 font-bold transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-5 w-5" />
              {t.contactSupport}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
