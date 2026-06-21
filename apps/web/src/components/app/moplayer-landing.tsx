"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  CheckCircle2,
  Download,
  KeyRound,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Tv2,
  Workflow,
} from "lucide-react";

import { CoverflowGallery } from "@/components/site/coverflow-gallery";
import { moPlayerCopy } from "@/content/apps";
import { normalizePublicImagePath } from "@/lib/asset-url";
import { downloadSinceLabel, formatDownloadNumber, type DownloadStatsView } from "@/lib/download-display";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

/* ── Classic color tokens (navy blue) ── */
const ACCENT = "#2563eb";
const ACCENT_DARK = "#1e3a8a";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export function MoPlayerLanding({
  ecosystem,
  locale = "en",
  downloadStats,
}: {
  ecosystem: AppEcosystemData;
  locale?: Locale;
  downloadStats?: DownloadStatsView;
}) {
  const isAr = locale === "ar";
  const t = repairMojibakeDeep(moPlayerCopy[locale]);
  const text = (en: string | undefined | null, ar: string) => (isAr ? ar : en?.trim() || ar);
  const list = <T,>(en: T[] | undefined | null, ar: T[]) => (isAr ? ar : en && en.length ? en : ar);
  const productName = ecosystem.product.product_name || "MoPlayer Classic";
  const productHero = text(ecosystem.product.long_description || ecosystem.product.short_description, t.heroBody);
  const heroImage = normalizePublicImagePath(ecosystem.product.hero_image_path || ecosystem.product.tv_banner_path || "/images/moplayer-tv-hero.png");
  
  const latest = ecosystem.releases[0] ?? null;
  const appUnavailable =
    ecosystem.runtimeConfig?.enabled === false || ecosystem.runtimeConfig?.maintenanceMode === true;
  const unavailableMode = ecosystem.runtimeConfig?.enabled === false ? "disabled" : "maintenance";
  const unavailableMessage = ecosystem.runtimeConfig?.message?.trim();
  const downloadHref =
    !appUnavailable && latest && latest.assets.some((asset) => asset.external_url || asset.storage_path)
      ? `/api/app/releases/${latest.slug}/download`
      : null;
  const downloadCount = formatDownloadNumber(downloadStats?.value ?? 0, locale);
  const downloadSince = downloadSinceLabel(downloadStats, locale);
  const proHref = `/${locale}/apps/moplayer2`;
  const activateHref = `/${locale}/activate?product=moplayer`;
  const legalDisclaimer = isAr
    ? "MoPlayer مشغل وسائط فقط. لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمياً بحقوق النشر. تقع مسؤولية إضافة المصادر والتأكد من امتلاك حق استخدامها على المستخدم وحده."
    : "MoPlayer is a media player only. It does not provide channels, playlists, subscriptions, or copyrighted media. Users are solely responsible for adding sources they are legally authorized to use.";
  
  const fallbackGalleryShots = [
    { id: "classic-promo", title: isAr ? "عرض MoPlayer Classic" : "MoPlayer Classic Showcase", alt_text: "MoPlayer Classic promotional showcase", image_path: "/images/moplayer-classic-promo.png", product_slug: "moplayer", device_frame: "tv", sort_order: 0, is_featured: true, created_at: "" },
    { id: "hero", title: "MoPlayer", alt_text: "MoPlayer Android TV product", image_path: "/images/moplayer-tv-hero.png", product_slug: "moplayer", device_frame: "tv", sort_order: 1, is_featured: false, created_at: "" },
    { id: "visual-cinema", title: isAr ? "واجهة تلفزيونية" : "TV showcase", alt_text: "MoPlayer cinematic TV visual", image_path: "/images/moplayer_ui_playlist-final.png", product_slug: "moplayer", device_frame: "tv", sort_order: 10, is_featured: false, created_at: "" },
    { id: "visual-activation", title: isAr ? "تفعيل واضح" : "Guided activation", alt_text: "MoPlayer activation flow visual", image_path: "/images/moplayer-activation-flow.webp", product_slug: "moplayer", device_frame: "phone", sort_order: 11, is_featured: false, created_at: "" },
    { id: "visual-release", title: isAr ? "مركز التحميل" : "Release center", alt_text: "MoPlayer APK release visual", image_path: "/images/moplayer-release-panel.webp", product_slug: "moplayer", device_frame: "tv", sort_order: 12, is_featured: false, created_at: "" },
  ];
  const galleryShots = ecosystem.screenshots.length ? ecosystem.screenshots : fallbackGalleryShots;

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden font-sans relative" dir={isAr ? "rtl" : "ltr"}>
      
      {/* Background effects - Navy Blue */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[80vh] opacity-35">
          <Image src="/images/moplayer-classic-bg.png" alt="" fill sizes="100vw" className="object-cover object-top mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/70 to-[#050505] z-10" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.02]" />
        {/* Brand glows with inline styles and gentle breathing motion */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.55, scale: 0.96 }}
          animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.96, 1.06, 0.96] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-90px] left-1/2 -translate-x-1/2 w-[860px] max-w-[140vw] h-[560px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT}40, transparent 70%)` }}
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.72, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="absolute bottom-[-140px] right-[-90px] w-[580px] max-w-[100vw] h-[580px] rounded-full blur-[150px]"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT_DARK}55, transparent 70%)` }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[480px] max-w-[90vw] h-[480px] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT}26, transparent 70%)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_25%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 px-6 sm:px-12 max-w-6xl mx-auto z-10 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-start z-10">
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/8 backdrop-blur-sm mb-4 md:mb-6">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-blue-400">{text(ecosystem.product.hero_badge, t.badge)}</span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-blue-300/60 mb-4 md:mb-5 leading-[1.1]">
            {productName}
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="text-sm md:text-base text-white/60 mb-5 md:mb-8 max-w-lg leading-relaxed mx-auto lg:mx-0">
            {productHero}
          </motion.p>

          {appUnavailable ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-4 md:mb-5 max-w-lg rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-4 text-start text-amber-100">
              <strong className="block text-sm font-black">
                {unavailableMode === "maintenance"
                  ? isAr ? "التطبيق قيد الصيانة" : "App under maintenance"
                  : isAr ? "التحميل متوقف مؤقتاً" : "Downloads temporarily disabled"}
              </strong>
              <span className="mt-1 block text-sm leading-6 text-amber-100/75">
                {unavailableMessage ||
                  (isAr
                    ? "نعمل على تحديث هذا الإصدار. زر التحميل متوقف حتى لا يصل للزائر ملف غير جاهز."
                    : "This release is being updated. The download button is paused so visitors do not receive a broken file.")}
              </span>
              <Link href={`/${locale}/support`} className="mt-3 inline-flex rounded-xl border border-amber-200/25 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-200/10">
                {isAr ? "تواصل مع الدعم" : "Contact support"}
              </Link>
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }} className="mb-4 md:mb-5 inline-flex items-center gap-4 rounded-2xl border border-blue-400/20 bg-blue-400/[0.07] px-5 py-4 text-start backdrop-blur-md shadow-[0_18px_52px_rgba(37,99,235,0.12)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/70">{isAr ? "تحميلات رسمية" : "Official downloads"}</span>
              <strong className="block text-3xl font-black text-white tabular-nums">{downloadCount}</strong>
              <span className="block text-xs font-semibold text-white/45">{downloadSince}</span>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start">
            {downloadHref ? (
              <a href={downloadHref} className="group px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 flex items-center gap-2">
                <Download className="h-4 w-4" />
                {t.download}
              </a>
            ) : (
              <span className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm flex items-center gap-2 cursor-not-allowed">
                {t.releasePending}
              </span>
            )}
            <Link href={activateHref} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-white/60" />
              {isAr ? "تفعيل Classic" : "Activate Classic"}
            </Link>
          </motion.div>
        </div>

        <div className="flex-1 w-full relative flex justify-center lg:justify-end">
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative z-10 w-full max-w-sm aspect-square flex items-center justify-center">
              <Image src={heroImage} alt="MoPlayer Classic" width={500} height={500} className="w-[85%] h-auto object-contain drop-shadow-[0_20px_60px_rgba(37,99,235,0.2)]" priority />
           </motion.div>
           <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-900/10 rounded-full blur-[80px] z-0 pointer-events-none w-[70%] h-[70%] m-auto opacity-50" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-8 border-y border-white/5 bg-white/[0.02] z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-around items-center gap-6">
          {[
            { label: isAr ? "أحدث إصدار" : "Latest", value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
            { label: isAr ? "التحميلات" : "Downloads", value: downloadCount },
            { label: isAr ? "التجربة" : "Experience", value: isAr ? "كلاسيك" : "Classic" },
            { label: isAr ? "التثبيت" : "Install", value: isAr ? "خفيف" : "Light" },
            { label: isAr ? "التلفزيون" : "TV", value: ecosystem.product.android_tv_ready ? (isAr ? "جاهز" : "Ready") : "Android" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <span className="block text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</span>
              <strong className="block text-lg font-extrabold text-white">{s.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Pro Switch Card */}
      <section className="relative py-16 px-6 z-10">
         <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-r from-black via-amber-500/5 to-black p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 relative z-10 text-center md:text-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="h-3 w-3" /> {isAr ? "النسخة الجديدة" : "New product line"}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold mb-4 text-white leading-tight">
                {isAr ? "تريد تجربة أدفأ وأحدث؟ انتقل إلى MoPlayer Pro." : "Want the warmer next-gen app? Try MoPlayer Pro."}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {isAr
                  ? "MoPlayer يبقى التطبيق الأزرق الكلاسيكي. MoPlayer Pro تطبيق منفصل بالهوية الذهبية وتحميل مستقل."
                  : "MoPlayer stays the blue classic app. MoPlayer Pro is a separate warm-gold app with its own APK and release channel."}
              </p>
              <Link href={proHref} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all hover:-translate-y-0.5">
                <Sparkles className="h-4 w-4" />
                {isAr ? "افتح MoPlayer Pro" : "Open MoPlayer Pro"}
              </Link>
            </div>
            
            <div className="w-full md:w-auto">
               <div className="w-full max-w-[280px] mx-auto rounded-xl overflow-hidden shadow-lg border border-amber-500/15">
                  <Image src="/images/moplayer-pro-home.webp" alt="Pro Preview" width={400} height={280} className="w-full h-auto object-cover" />
               </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-16 px-6 z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-4 bg-blue-500/8">
            <MonitorPlay className="h-3 w-3" />
            {t.featuresEyebrow}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 text-white max-w-3xl mx-auto leading-tight">{text(ecosystem.product.tagline, t.featuresTitle)}</h2>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {list(ecosystem.product.feature_highlights, t.features).map((f, i) => {
            const icons = [Tv2, MonitorPlay, ShieldCheck, CheckCircle2];
            const Icon = icons[i] ?? CheckCircle2;
            return (
              <motion.article variants={itemVariants} key={f.title} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-3 text-blue-400 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.body}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* Screenshots Gallery */}
      <section className="relative py-16 px-6 z-10 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <CoverflowGallery
            locale={locale}
            images={galleryShots.slice(0, 8).map((shot) => ({
              id: String(shot.id),
              src: normalizePublicImagePath(shot.image_path),
              alt: shot.alt_text,
              label: shot.title,
            }))}
          />
        </div>
      </section>

      {/* Philosophy & Privacy */}
      <section className="relative py-16 px-6 z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all duration-300">
            <Workflow className="h-6 w-6 text-blue-400 mb-4" />
            <h2 className="text-lg font-bold mb-3 text-white">{t.philosophyTitle}</h2>
            <p className="text-white/60 text-sm leading-relaxed">{text(ecosystem.product.short_description, t.philosophy)}</p>
          </article>
          <article className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all duration-300">
            <ShieldCheck className="h-6 w-6 text-blue-400 mb-4" />
            <h2 className="text-lg font-bold mb-3 text-white">{t.privacyTitle}</h2>
            <div className="space-y-2.5">
              {list(ecosystem.product.legal_notes, t.privacyBullets).map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-white/60 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-400/60 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* Install & FAQ */}
      <section className="relative py-16 px-6 z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-4 bg-blue-500/8">
              {isAr ? "خطوات التثبيت" : "Install steps"}
            </span>
            <h2 className="text-2xl font-extrabold mb-8 text-white">{t.installTitle}</h2>
            <div className="space-y-4">
              {list(ecosystem.product.install_steps, t.installSteps).map((step, index) => (
                <article key={step.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-blue-500/20 bg-blue-500/8 flex items-center justify-center text-blue-400 text-xs font-bold">
                    {`0${index + 1}`}
                  </div>
                  <div className="flex-1 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h3 className="font-bold text-white mb-1 text-sm">{step.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 text-white/60 text-[10px] font-bold uppercase tracking-wider mb-4 bg-white/5">
              {t.faqTitle}
            </span>
            <div className="space-y-3 mt-8">
              {list(ecosystem.faqs, t.faqs).map((faq) => (
                <details key={faq.question} className="group rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden open:border-blue-500/20 transition-colors">
                  <summary className="cursor-pointer p-4 font-bold text-sm text-white flex items-center justify-between list-none select-none hover:text-blue-400 transition-colors">
                    {faq.question}
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 group-open:rotate-180 transition-transform duration-300">
                      <ArrowDownToLine className="h-3 w-3" />
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-white/60 text-sm leading-relaxed border-t border-white/5">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-6 z-10 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider mb-5 bg-red-500/8">
            {t.disclaimerTitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">{productName}</h2>
          <p className="text-sm text-white/50 mb-8 max-w-2xl mx-auto leading-relaxed">{legalDisclaimer}</p>
          
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {downloadHref && (
              <a href={downloadHref} className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 flex items-center gap-2">
                <Download className="h-4 w-4" /> {t.download}
              </a>
            )}
            <Link href={activateHref} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-white/60" /> {isAr ? "فعّل التطبيق" : "Activate"}
            </Link>
            <Link href={`/${locale}/support`} className="px-6 py-3 rounded-xl bg-transparent border border-white/5 text-white/50 font-bold text-sm hover:bg-white/5 hover:text-white transition-all duration-300">
              {t.support}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
