"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownToLine,
  CheckCircle2,
  Cpu,
  Download,
  KeyRound,
  Layers,
  MonitorPlay,
  MousePointer2,
  ShieldCheck,
  Workflow,
  Zap
} from "lucide-react";
import { useRef } from "react";

import { normalizePublicImagePath } from "@/lib/asset-url";
import { moPlayerCopy } from "@/content/apps";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";
import type { WindowsRelease } from "@/lib/windows-release";

type GalleryShot = {
  id?: string;
  title?: string;
  alt_text?: string;
  src?: string;
  image?: string;
  image_path: string;
};

type ProductWithGallery = AppEcosystemData["product"] & {
  gallery_shots?: GalleryShot[];
};

/* ── Orange color tokens (same as Pro) ── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 18 } },
};

function formatBytes(size?: number | null) {
  if (!size || size <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

export function MoPlayerPcLanding({ ecosystem, locale, windowsRelease }: { ecosystem: AppEcosystemData; locale: Locale; windowsRelease?: WindowsRelease | null }) {
  const isAr = locale === "ar";
  const c = moPlayerCopy[locale];
  
  const hubCopy = locale === "ar" ? {
    headline: "مشغل مكتبي أنيق وسريع مصمم للكمبيوتر",
    primaryCta: "تحميل مثبت Windows",
    stats: ["Windows", "تثبيت أنيق", "ماوس وكيبورد"],
  } : {
    headline: "A polished desktop player made for your PC",
    primaryCta: "Download Windows Setup",
    stats: ["Windows", "Elegant setup", "Mouse and keyboard"],
  };
  
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  const productName = "MoPlayer PC";
  const downloadHref = "/api/app/download/latest?product=moplayer2&platform=windows";
  const portableHref = "/api/app/download/latest?product=moplayer2&platform=windows&portable=1";
  const activateHref = `/${locale}/activate?product=moplayer-pc&platform=windows`;
  const galleryShots = (ecosystem.product as ProductWithGallery).gallery_shots ?? [];
  const releaseStats = [
    windowsRelease?.version ? { label: isAr ? "الإصدار" : "Version", value: `v${windowsRelease.version}` } : null,
    windowsRelease?.fileSizeBytes ? { label: isAr ? "حجم المثبت" : "Setup size", value: formatBytes(windowsRelease.fileSizeBytes) } : null,
    windowsRelease?.systemRequirements ? { label: isAr ? "النظام" : "System", value: windowsRelease.systemRequirements } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const pcFeatures = isAr ? [
    { title: "تشغيل سريع على الكمبيوتر", body: "واجهة خفيفة تستفيد من شاشة الكمبيوتر بدون ازدحام.", icon: Zap },
    { title: "تحكم مريح", body: "تنقل واضح بالماوس والكيبورد واللمس عند الحاجة.", icon: MousePointer2 },
    { title: "ربط بين الشاشات", body: "فعّل الكمبيوتر من الموقع وابقَ ضمن نفس عائلة MoPlayer.", icon: Layers },
    { title: "خصوصية أولاً", body: "مصادرك تبقى عندك، والتطبيق لا يضيف أي محتوى من عنده.", icon: ShieldCheck },
  ] : [
    { title: "Fast PC playback", body: "A light interface that feels right on a desktop screen.", icon: Zap },
    { title: "Comfort controls", body: "Clear navigation with mouse, keyboard, and touch when you need it.", icon: MousePointer2 },
    { title: "Screen-to-screen flow", body: "Activate the PC from the website and keep it inside the MoPlayer family.", icon: Layers },
    { title: "Private by design", body: "Your sources stay with you, and the app never supplies content of its own.", icon: ShieldCheck },
  ];

  const detailCards = isAr ? {
    philosophyTitle: "مصمم للجلوس على الكمبيوتر",
    philosophy:
      "نسخة PC تضع البحث، المعاينة، القوائم، والتحكم اليومي في مساحة واحدة هادئة، بدون شكل تلفزيوني كبير داخل نافذة صغيرة.",
    privacyTitle: "خصوصية واضحة",
    privacyBullets: [
      "التطبيق لا يوفّر قنوات أو اشتراكات أو محتوى جاهز.",
      "المصادر التي تضيفها تبقى على جهازك بعد الاستيراد.",
      "التفعيل يربط الكمبيوتر بالموقع فقط لتسليم المصدر بشكل آمن.",
      "كل إصدار PC له رابط تحميل منفصل عن إصدارات Android.",
    ],
  } : {
    philosophyTitle: "Made for desktop sessions",
    philosophy:
      "The PC edition keeps search, preview, lists, and daily controls in one calm desktop surface instead of forcing a TV layout into a small window.",
    privacyTitle: "Clear privacy",
    privacyBullets: [
      "The app does not provide channels, subscriptions, or ready-made content.",
      "Sources you add stay on your computer after import.",
      "Activation pairs this PC with the website only for secure source delivery.",
      "The PC edition has its own download path separate from Android builds.",
    ],
  };

  const installGuide = isAr
    ? {
        eyebrow: "تثبيت آمن",
        title: "ظهر تحذير من Windows؟ هذا طبيعي — وإليك كيف تثبّت بأمان",
        body: "MoPlayer PC تطبيق مستقل لا يستخدم بعدُ شهادة ناشر مدفوعة، لذلك قد يُظهر Windows SmartScreen رسالة “Windows protected your PC”. الملف مستضاف على GitHub Releases الرسمي وآمن للتثبيت.",
        steps: [
          "اضغط “More info” (مزيد من المعلومات) في نافذة Windows الزرقاء.",
          "ثم اضغط “Run anyway” (تشغيل على أي حال) لإكمال التثبيت.",
          "إذا وضعه Microsoft Defender في الحجر، اختر “Allow on device” أو “Restore” لاستعادته.",
        ],
        verify:
          "للتحقّق من أصالة الملف (اختياري): افتح PowerShell ونفّذ Get-FileHash على الملف، ثم قارن النتيجة مع البصمة المنشورة في صفحة الإصدار.",
      }
    : {
        eyebrow: "Safe install",
        title: "Seeing a Windows warning? It’s normal — here’s how to install safely",
        body: "MoPlayer PC is an independent app that doesn’t yet use a paid publisher certificate, so Windows SmartScreen may show “Windows protected your PC”. The file is hosted on official GitHub Releases and is safe to install.",
        steps: [
          "Click “More info” in the blue Windows dialog.",
          "Then click “Run anyway” to finish installing.",
          "If Microsoft Defender quarantines it, choose “Allow on device” / “Restore”.",
        ],
        verify:
          "Verify authenticity (optional): open PowerShell and run Get-FileHash on the file, then compare the result with the checksum published on the release page.",
      };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#050505] overflow-hidden selection:bg-orange-600/30 selection:text-orange-200">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-0 w-full h-[80vh] z-0 opacity-30">
          <Image src="/images/moplayer_pc_bg.png" alt="" fill className="object-cover object-top mix-blend-screen" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/70 to-[#050505] z-10" />
        </div>
        <div className="absolute top-[-15%] left-[-5%] w-[40%] h-[40%] bg-[#E64A19]/10 blur-[120px] rounded-full mix-blend-screen z-10" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[35%] h-[35%] bg-[#D84315]/10 blur-[120px] rounded-full mix-blend-screen z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.01] z-20" />
      </div>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-28 pb-16 px-6 z-10">
        <motion.div style={{ y: yHero, opacity: opacityHero }} className="max-w-5xl mx-auto w-full text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mb-6 inline-block">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-600/30 bg-orange-600/8 text-orange-300 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
              <Cpu className="h-3.5 w-3.5" /> {isAr ? "نسخة الكمبيوتر" : "Windows Desktop Edition"}
            </span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="text-3xl md:text-4xl lg:text-5xl font-black mb-5 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
            {productName}
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-sm md:text-base text-orange-300/60 max-w-2xl mx-auto leading-relaxed mb-10">
            {hubCopy.headline}
          </motion.p>
          
          {windowsRelease?.maintenance ? (
            <div className="mb-5 mx-auto max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-amber-200 text-sm font-semibold">
              {isAr
                ? "MoPlayer PC قيد التحديث حالياً — التحميل سيعود قريباً جداً. شكراً لصبرك."
                : "MoPlayer PC is being updated right now — downloads will return shortly. Thanks for your patience."}
            </div>
          ) : null}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }} className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {windowsRelease?.maintenance ? (
              <span className="px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold text-sm flex items-center justify-center gap-2">
                {isAr ? "قيد الصيانة" : "Under maintenance"}
              </span>
            ) : downloadHref ? (
              <Link href={downloadHref} className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm overflow-hidden shadow-[0_4px_25px_rgba(230,74,25,0.3)] hover:shadow-[0_6px_35px_rgba(230,74,25,0.5)] transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <Download className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{hubCopy.primaryCta}</span>
              </Link>
            ) : (
              <span className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm backdrop-blur-sm">
                {c.releasePending}
              </span>
            )}
            <Link href={activateHref} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 hover:border-orange-600/30 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2">
              <KeyRound className="h-4 w-4 text-orange-300" />
              {isAr ? "تفعيل الكمبيوتر" : "Activate PC"}
            </Link>
          </motion.div>

          {releaseStats.length ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.32 }} className="mt-8 mx-auto grid max-w-3xl grid-cols-1 sm:grid-cols-3 gap-3">
              {releaseStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-orange-500/15 bg-white/[0.035] px-4 py-3 text-start backdrop-blur-md shadow-[0_16px_44px_rgba(0,0,0,0.28)]">
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-orange-300/60">{item.label}</span>
                  <strong className="mt-1 block text-sm text-white">{item.value}</strong>
                </div>
              ))}
            </motion.div>
          ) : null}
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-8 border-y border-white/5 bg-white/[0.01] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          {hubCopy.stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-orange-400 font-extrabold text-lg mb-1">{stat}</span>
              <span className="text-white/40 font-medium uppercase tracking-wider text-xs">{isAr ? "جاهز" : "Ready"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Interface Showcase */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(230,74,25,0.15)] group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
            <Image
              src="/images/moplayer-pc-desktop.png"
              alt="MoPlayer PC Interface"
              width={1400}
              height={900}
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-600/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-4 bg-orange-600/8">
            <MonitorPlay className="h-3 w-3" />
            {c.featuresEyebrow}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 text-white max-w-3xl mx-auto leading-tight">
            {isAr ? "تجربة متكاملة مصممة لنظام ويندوز" : "A seamless experience designed for Windows."}
          </h2>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pcFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <motion.article variants={itemVariants} key={f.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-600/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-orange-600/10 border border-orange-600/15 flex items-center justify-center mb-3 text-orange-400 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.body}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* Screenshots */}
      {galleryShots.length > 0 && (
        <section className="relative py-16 px-6 z-10 bg-white/[0.01] border-t border-white/5">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {galleryShots.slice(0, 4).map((shot, i) => (
               <div key={shot.id ?? shot.image_path} className={`relative rounded-xl overflow-hidden border border-white/5 bg-black group ${i === 0 ? "md:col-span-2" : ""}`}>
                 <Image src={normalizePublicImagePath(shot.image_path)} alt={shot.alt_text ?? shot.title ?? productName} width={i === 0 ? 1200 : 600} height={i === 0 ? 500 : 340} className="w-full h-auto object-cover opacity-75 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 <span className="absolute bottom-4 left-6 text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{shot.title}</span>
               </div>
            ))}
          </div>
        </section>
      )}

      {/* Philosophy & Privacy */}
      <section className="relative py-16 px-6 z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-600/20 transition-all duration-300">
            <Workflow className="h-6 w-6 text-orange-400 mb-4" />
            <h2 className="text-lg font-bold mb-3 text-white">{detailCards.philosophyTitle}</h2>
            <p className="text-white/60 text-sm leading-relaxed">{detailCards.philosophy}</p>
          </article>
          <article className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-600/20 transition-all duration-300">
            <ShieldCheck className="h-6 w-6 text-orange-400 mb-4" />
            <h2 className="text-lg font-bold mb-3 text-white">{detailCards.privacyTitle}</h2>
            <div className="space-y-2.5">
              {detailCards.privacyBullets.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-white/60 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-orange-400/60 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* Safe install guide */}
      <section className="relative py-16 px-6 z-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-600/30 text-orange-300 text-[10px] font-bold uppercase tracking-wider bg-orange-600/8 mb-4">
              <ShieldCheck className="h-3 w-3" /> {installGuide.eyebrow}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 max-w-2xl mx-auto">{installGuide.title}</h2>
            <p className="text-white/65 text-sm leading-relaxed max-w-2xl mx-auto">{installGuide.body}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {installGuide.steps.map((step, i) => (
              <article key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-600/20 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-orange-600/12 border border-orange-600/25 text-orange-300 flex items-center justify-center font-black text-sm mb-3">{i + 1}</div>
                <p className="text-white/75 text-sm leading-relaxed">{step}</p>
              </article>
            ))}
          </div>
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-white/55 text-xs leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-orange-400/60 shrink-0 mt-0.5" />
            <span>{installGuide.verify}</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-6 z-10 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider mb-5 bg-red-500/8">
            <ShieldCheck className="h-3 w-3" /> {c.disclaimerTitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">{c.finalTitle}</h2>
          <p className="text-sm text-white/40 mb-8 max-w-xl mx-auto leading-relaxed">{c.finalBody}</p>
          
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {downloadHref && (
              <a href={downloadHref} className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm transition-all duration-300 shadow-[0_4px_25px_rgba(230,74,25,0.3)] hover:-translate-y-0.5 flex items-center gap-2">
                <Download className="h-4 w-4" /> {hubCopy.primaryCta}
              </a>
            )}
            {windowsRelease?.portableFile ? (
              <a href={portableHref} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-orange-300" /> {isAr ? "نسخة محمولة" : "Portable version"}
              </a>
            ) : null}
            <Link href={activateHref} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-orange-300" /> {isAr ? "تفعيل الكمبيوتر" : "Activate PC"}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
