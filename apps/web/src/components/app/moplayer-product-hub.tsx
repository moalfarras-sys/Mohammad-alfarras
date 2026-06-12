"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Bot,
  CloudSun,
  Gamepad2,
  KeyRound,
  MonitorPlay,
  Zap,
} from "lucide-react";

import { withLocale } from "@/lib/i18n";
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
  pro:     { primary: "#FF5722", light: "#FF8A65", bg: "#FF5722" },
  classic: { primary: "#1e3a8a", light: "#60a5fa", bg: "#2563eb" },
  pc:      { primary: "#E64A19", light: "#FF8A65", bg: "#E64A19" },
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
    },
    services: "Unified Services",
    activateCta: "Activate",
    servicesTitle: "Synchronized widgets across the ecosystem.",
    servicesBody: "Weather, matches, support, and downloads feel consistent across every edition.",
    servicesList: [
      ["Weather", "Clear daily context on supported screens."],
      ["Football", "Match cards stay familiar across web and players."],
      ["Mo Assistant", "One friendly help layer for support."],
      ["Downloads", "Each edition opens the right official file."],
    ],
    coming: "Expanding Ecosystem",
    comingBody: "Native builds for more screens are in active preparation.",
    futures: [
      { name: "MoPlayer iOS", platform: "iPhone + iPad", body: "Touch-first Apple app with clean source setup.", icon: "ios" as const },
      { name: "MoPlayer Apple TV", platform: "tvOS", body: "Siri Remote navigation with Apple-style restraint.", icon: "apple-tv" as const },
      { name: "MoPlayer LG TV", platform: "webOS", body: "LG TV store with native layout.", icon: "lg" as const },
      { name: "MoPlayer Samsung TV", platform: "Tizen", body: "Samsung TV app with store-ready metadata.", icon: "samsung" as const },
    ],
  },
  ar: {
    badge: "عائلة تطبيقات MoPlayer",
    title: "مشغل واحد.\nلكل شاشة.",
    body: "اختر إصدار MoPlayer المناسب لجهازك.",
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
    servicesTitle: "مزامنة الويدجت عبر المنظومة.",
    servicesBody: "الطقس والمباريات والدعم والتحميلات تظهر بروح واحدة في كل إصدار.",
    servicesList: [
      ["الطقس", "معلومة يومية واضحة على الشاشات المدعومة."],
      ["المباريات", "بطاقات مباريات مألوفة بين الموقع والمشغلات."],
      ["مساعد Mo", "مساعدة ودودة من مكان واحد."],
      ["التحميلات", "كل إصدار يفتح ملفه الرسمي الصحيح."],
    ],
    coming: "منظومة تتوسع",
    comingBody: "نسخ لأجهزة إضافية قيد التطوير.",
    futures: [
      { name: "MoPlayer iOS", platform: "iPhone + iPad", body: "تطبيق لمس لأجهزة Apple.", icon: "ios" as const },
      { name: "MoPlayer Apple TV", platform: "tvOS", body: "نسخة مع تنقل Siri Remote.", icon: "apple-tv" as const },
      { name: "MoPlayer LG TV", platform: "webOS", body: "جاهز لمتجر LG TV.", icon: "lg" as const },
      { name: "MoPlayer Samsung TV", platform: "Tizen", body: "جاهز لتلفزيونات Samsung.", icon: "samsung" as const },
    ],
  },
} as const;

function getProducts(locale: Locale) {
  const c = copy[locale].products;
  return [
    {
      id: "pro", name: "MoPlayer Pro", tone: "pro" as const,
      heroImage: "/images/moplayer-pro-showcase-2.png",
      galleryImages: ["/images/moplayer-pro-showcase-1.png", "/images/moplayer-pro-home.webp", "/images/moplayer-pro-hero.webp", "/images/moplayer-pro-player.webp"],
      href: withLocale(locale, "apps/moplayer2"),
      downloadHref: "/api/app/download/latest?product=moplayer2",
      activateHref: `${withLocale(locale, "activate")}?product=moplayer2`,
      platformIcon: <AndroidIcon className="w-4 h-4 text-[#FF8A65]" />,
      ...c.pro,
    },
    {
      id: "classic", name: "MoPlayer Classic", tone: "classic" as const,
      heroImage: "/images/moplayer-tv-hero.png",
      galleryImages: ["/images/moplayer-classic-promo.png", "/images/moplayer_ui_playlist-final.png", "/images/moplayer-activation-flow.webp"],
      href: withLocale(locale, "apps/moplayer/classic"),
      downloadHref: "/api/app/download/latest?product=moplayer",
      activateHref: `${withLocale(locale, "activate")}?product=moplayer`,
      platformIcon: <AndroidIcon className="w-4 h-4 text-[#60a5fa]" />,
      ...c.classic,
    },
    {
      id: "pc", name: "MoPlayer PC", tone: "pc" as const,
      heroImage: "/images/moplayer-pc-desktop.png",
      galleryImages: ["/images/moplayer-pc-interface.png"],
      href: withLocale(locale, "apps/moplayer-pc"),
      downloadHref: "/api/app/download/latest?product=moplayer2&platform=windows",
      activateHref: `${withLocale(locale, "activate")}?product=moplayer-pc&platform=windows`,
      platformIcon: <WindowsIcon className="w-4 h-4 text-[#FF8A65]" />,
      ...c.pc,
    },
  ];
}

/* ── Framer Motion ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

/* ── Main Component ── */
export function MoPlayerProductHub({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const c = copy[locale];
  const products = getProducts(locale);

  return (
    <main className="min-h-screen bg-[#060606] text-white overflow-hidden font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.012]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#FF5722]/6 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* ─── Hero ─── */}
      <section className="relative z-10 pt-32 pb-12 md:pt-36 md:pb-16 px-6 max-w-5xl mx-auto text-center">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-bold tracking-widest uppercase text-white/60">
              <BadgeCheck className="h-3.5 w-3.5 text-amber-400" />
              {c.badge}
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-[1.08] whitespace-pre-line">
            {c.title}
          </motion.h1>

          <motion.p variants={fadeUp} className="text-sm md:text-base text-white/45 max-w-lg mx-auto mb-8 leading-relaxed">
            {c.body}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 justify-center">
            {products.map((p) => {
              const col = colors[p.tone];
              return (
                <a key={p.id} href={`#${p.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:-translate-y-0.5" style={{ color: col.light, borderColor: `${col.primary}25`, background: `${col.primary}08` }}>
                  {p.platformIcon}
                  {p.name}
                </a>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Product Showcase Cards ─── */}
      <section className="relative z-10 px-6 pb-16 max-w-6xl mx-auto space-y-6">
        {products.map((product, idx) => {
          const col = colors[product.tone];
          const isReversed = idx % 2 === 1;

          return (
            <motion.article
              key={product.id}
              id={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
              className="relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm hover:border-white/15 transition-all duration-400"
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

                  <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2 leading-tight">{product.headline}</h3>
                  <p className="text-white/55 text-sm leading-relaxed mb-4 max-w-md">{product.body}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {product.stats.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] font-semibold border" style={{ color: col.light, borderColor: `${col.primary}18`, background: `${col.primary}06` }}>{s}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {product.href && (
                      <Link href={product.href} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${col.primary}, ${col.bg}cc)`, boxShadow: `0 4px 16px ${col.primary}25` }}>
                        {product.primaryCta} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    {product.downloadHref && (
                      <a href={product.downloadHref} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white/70 bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-0.5">
                        <ArrowDownToLine className="h-3.5 w-3.5" /> {product.secondaryCta}
                      </a>
                    )}
                    {product.activateHref && (
                      <Link href={product.activateHref} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white/70 bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-0.5">
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
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* ─── Services ─── */}
      <section className="relative z-10 py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/6 mb-3">
              <Zap className="h-3 w-3" /> {c.services}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">{c.servicesTitle}</h2>
            <p className="text-white/40 text-xs max-w-md mx-auto">{c.servicesBody}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {c.servicesList.map(([title, body], index) => {
              const Icon = [CloudSun, Gamepad2, Bot, MonitorPlay][index] || Zap;
              return (
                <article key={title} className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:border-emerald-500/15 transition-all duration-300 group">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mb-2.5 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">{title}</h3>
                  <p className="text-white/35 text-[11px] leading-relaxed">{body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Future Platforms ─── */}
      <section className="relative z-10 py-16 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/25 text-sky-400 text-[10px] font-bold uppercase tracking-wider bg-sky-500/6 mb-3">
              <MonitorPlay className="h-3 w-3" /> {c.coming}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 max-w-lg mx-auto">{c.comingBody}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {c.futures.map((item) => {
              const isApple = item.icon === "ios" || item.icon === "apple-tv";
              return (
                <article key={item.name} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:border-white/10 transition-all duration-300 group flex flex-col">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center mb-2.5 text-white/50 group-hover:text-white/80 transition-colors">
                    {isApple ? <AppleIcon className="h-4 w-4" /> : <MonitorPlay className="h-4 w-4" />}
                  </div>
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-0.5">{item.platform}</span>
                  <h3 className="text-xs font-bold text-white mb-1.5">{item.name}</h3>
                  <p className="text-white/35 text-[11px] leading-relaxed flex-1 mb-2.5">{item.body}</p>
                  <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/8">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                    </span>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
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
