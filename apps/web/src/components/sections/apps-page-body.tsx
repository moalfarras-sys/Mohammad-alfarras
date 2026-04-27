"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Download, Play, MonitorSmartphone, ShieldCheck, Zap } from "lucide-react";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { appsPageCopy, moPlayerCopy } from "@/content/apps";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function AppsPageBody({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(appsPageCopy[model.locale]);
  const product = repairMojibakeDeep(moPlayerCopy[model.locale]);
  const isAr = model.locale === "ar";
  const locale = model.locale;

  const moPlayer = [...model.projects].sort((a, b) => a.featuredRank - b.featuredRank)
    .find((p) => p.slug === "moplayer");

  const gallery = [
    { src: "/images/moplayer_ui_now_playing-final.png", label: isAr ? "شاشة التشغيل" : "Now Playing" },
    { src: "/images/moplayer_ui_playlist-final.png", label: isAr ? "قائمة التشغيل" : "Playlist View" },
    { src: "/images/moplayer-tv-banner-final.png", label: "Android TV" },
  ];

  return (
    <div dir={isAr ? "rtl" : "ltr"} data-testid="apps-page" className="relative pb-32 pt-28">
      {/* Bg orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[var(--os-violet)] opacity-[0.05] blur-[120px]" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--os-teal)] opacity-[0.04] blur-[100px]" />
      </div>

      {/* ── HERO ── */}
      <section className="section-frame mb-20 relative z-10">
        <div className="grid gap-14 lg:grid-cols-[1fr_480px] lg:items-center">
          <div>
            <motion.span {...inView(0)} className="eyebrow mb-5 inline-flex">{t.eyebrow}</motion.span>
            <motion.h1 {...inView(0.06)} className="headline-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold text-white">
              {t.title}
            </motion.h1>
            <motion.p {...inView(0.12)} className="mt-5 max-w-lg text-[16px] leading-relaxed text-[var(--os-text-2)]">
              {t.body}
            </motion.p>
            <motion.div {...inView(0.18)} className="mt-8 flex flex-wrap gap-4">
              <Link href={`/${locale}/apps/moplayer`} className="btn-primary">
                <Play className="h-4 w-4" /> {t.openProduct}
              </Link>
              {moPlayer && (
                <Link href={`/${locale}/work/${moPlayer.slug}`} className="btn-secondary">
                  {t.viewCase}
                </Link>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 rounded-full bg-[var(--os-teal)] opacity-[0.06] blur-[80px]" />
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <Image
                src="/images/moplayer-hero-3d-final.png"
                alt="MoPlayer"
                width={640}
                height={400}
                priority
                className="w-full h-auto drop-shadow-[0_24px_60px_rgba(0,212,224,0.18)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FLAGSHIP CARD ── */}
      <section className="py-20 bg-[var(--os-surface)]/30 relative z-10">
        <div className="section-frame">
          <motion.div {...inView(0)} className="glass-card overflow-hidden rounded-[2.5rem]">
            <div className="grid lg:grid-cols-2">
              {/* Text side */}
              <div className="p-10 md:p-14">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] px-3 py-1.5">
                  <Zap className="h-3.5 w-3.5 text-[var(--os-teal)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--os-teal)]">{t.flagship}</span>
                </div>
                <h2 className="headline-display mt-4 text-[clamp(2rem,4vw,3.5rem)] font-bold text-white">MoPlayer</h2>
                <p className="mt-5 text-[15px] leading-relaxed text-[var(--os-text-2)]">{product.heroBody}</p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {["Android TV", "Android 7+", "VLC Engine", "APK Direct", "Xtream · M3U"].map((tag) => (
                    <span key={tag} className="os-badge text-[11px]">{tag}</span>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href={`/${locale}/apps/moplayer`} className="btn-primary">
                    <Download className="h-4 w-4" /> {t.download}
                  </Link>
                  {moPlayer && (
                    <Link href={`/${locale}/work/${moPlayer.slug}`} className="btn-secondary">{t.viewCase}</Link>
                  )}
                </div>
              </div>

              {/* Image side */}
              <div className="relative min-h-[320px] border-t border-[var(--os-border)] lg:border-t-0 lg:border-l bg-[var(--os-elevated)]">
                <Image
                  src="/images/moplayer-ui-mock-final.png"
                  alt="MoPlayer interface"
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 relative z-10">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12">
            <span className="eyebrow mb-4 inline-flex">{product.featuresEyebrow}</span>
            <h2 className="headline-display mt-4 text-[2rem] font-bold text-white">{product.featuresTitle}</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {product.features.map((f, i) => (
              <motion.div key={f.title} {...inView(i * 0.06)} className="glass-card p-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]">
                  <MonitorSmartphone className="h-5 w-5" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-3">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--os-text-3)]">{f.body}</p>
              </motion.div>
            ))}

            {/* Privacy feature */}
            <motion.div {...inView()} className="glass-card p-8 border-emerald-500/20 bg-emerald-500/[0.02]">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-white mb-3">{isAr ? "لا مراقبة، لا بيانات" : "Zero data. Full privacy."}</h3>
              <p className="text-[13px] leading-relaxed text-[var(--os-text-3)]">
                {isAr ? "MoPlayer لا يجمع أي بيانات شخصية. خصوصيتك محمية بالكامل." : "MoPlayer collects zero personal data. Your privacy is fully protected."}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="py-20 bg-[var(--os-surface)]/30 relative z-10">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-10">
            <span className="eyebrow mb-3 inline-flex">{isAr ? "واجهة المستخدم" : "UI Preview"}</span>
            <h2 className="headline-display mt-3 text-[1.8rem] font-bold text-white">
              {isAr ? "تصميم سينمائي · تجربة سلسة" : "Cinematic design · Seamless experience"}
            </h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {gallery.map((item, i) => (
              <motion.figure key={item.src} {...inView(i * 0.07)} className="glass-card overflow-hidden">
                <div className="relative aspect-[4/5] bg-[var(--os-elevated)]">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-contain p-5"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <figcaption className="px-6 py-4 text-[13px] font-semibold text-white border-t border-[var(--os-border)]">
                  {item.label}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 relative z-10">
        <div className="section-frame">
          <motion.div {...inView(0)} className="glass-card overflow-hidden rounded-[2rem] border-[var(--os-teal-border)] p-12 text-center relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--os-teal)]/[0.04] to-[var(--os-violet)]/[0.04]" />
            <h2 className="headline-display relative z-10 text-[2rem] font-bold text-white">
              {isAr ? "جرّب MoPlayer مجاناً" : "Try MoPlayer for free"}
            </h2>
            <p className="relative z-10 mt-3 text-[15px] text-[var(--os-text-2)]">
              {isAr ? "حمّل التطبيق مباشرة — بدون App Store، بدون قيود." : "Download the APK directly — no App Store, no restrictions."}
            </p>
            <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-4">
              <Link href={`/${locale}/apps/moplayer`} className="btn-primary px-10">
                <Download className="h-4 w-4" />
                {isAr ? "تحميل الآن" : "Download now"}
              </Link>
              <Link href={`/${locale}/support`} className="btn-secondary px-8">
                {isAr ? "دعم تقني" : "Get support"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
