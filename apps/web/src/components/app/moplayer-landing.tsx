"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, ShieldCheck, Cpu, Code2, HelpCircle, MonitorSmartphone, ChevronDown, Zap, Play } from "lucide-react";

import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";
import { moPlayerCopy } from "@/content/apps";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function fmtBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / 1048576).toFixed(1)} MB`;
}
function fmtDate(locale: Locale, val?: string | null) {
  if (!val) return null;
  try { return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(val)); }
  catch { return null; }
}

export function MoPlayerLanding({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const { product, releases } = ecosystem;
  const t = moPlayerCopy[locale];
  const isAr = locale === "ar";
  const latest = releases[0] ?? null;
  const asset = latest?.assets.find((a) => a.is_primary) ?? latest?.assets[0] ?? null;
  const dlHref = latest ? `/api/app/releases/${latest.slug}/download` : null;
  const date = fmtDate(locale, latest?.published_at ?? product.last_updated_at);
  const size = fmtBytes(asset?.file_size_bytes);

  const specs = [
    { label: t.specsLabels.version, value: latest?.version_name ? `v${latest.version_name}` : "—", icon: <Code2 className="h-4 w-4" /> },
    { label: t.specsLabels.size, value: size ?? "—", icon: <ArrowDownToLine className="h-4 w-4" /> },
    { label: t.specsLabels.minSdk, value: `API ${product.android_min_sdk}`, icon: <Cpu className="h-4 w-4" /> },
    { label: t.specsLabels.abi, value: asset?.abi ?? "—", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="relative pb-32 pt-28" dir={isAr ? "rtl" : "ltr"} data-testid="moplayer-landing">
      {/* Bg orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-[var(--os-teal)] opacity-[0.05] blur-[120px]" />
        <div className="absolute left-0 bottom-0 h-[500px] w-[500px] rounded-full bg-[var(--os-violet)] opacity-[0.04] blur-[100px]" />
      </div>

      {/* ── HERO ── */}
      <section className="section-frame mb-20 relative z-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_480px] lg:items-center">
          <div>
            <motion.div {...inView(0)} className="mb-6 inline-flex items-center gap-3 rounded-full border border-[var(--os-violet)]/30 bg-[var(--os-violet)]/10 px-4 py-2">
              <Zap className="h-3.5 w-3.5 text-[var(--os-violet)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-violet)]">{t.badge}</span>
            </motion.div>

            <motion.h1 {...inView(0.06)} className="headline-display text-[clamp(2.4rem,6vw,5rem)] font-bold text-[var(--os-text-1)]">
              {t.heroTitle}
            </motion.h1>

            <motion.p {...inView(0.12)} className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--os-text-2)]">
              {t.heroBody}
            </motion.p>

            <motion.div {...inView(0.18)} className="mt-8 flex flex-wrap gap-4">
              {dlHref ? (
                <Link href={dlHref} className="btn-primary px-8">
                  <ArrowDownToLine className="h-5 w-5" /> {t.download}
                </Link>
              ) : (
                <span className="btn-secondary opacity-60 cursor-not-allowed">{t.releasePending}</span>
              )}
              <Link href={`/${locale}/support`} className="btn-secondary">{t.support}</Link>
            </motion.div>

            {/* Release meta */}
            <motion.div {...inView(0.22)} className="mt-6 flex flex-wrap gap-3">
              {date && (
                <div className="flex items-center gap-2 os-badge">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {date}
                </div>
              )}
              <div className="flex items-center gap-2 os-badge">
                <MonitorSmartphone className="h-3.5 w-3.5" /> Android TV Native
              </div>
              <div className="flex items-center gap-2 os-badge">
                <Play className="h-3.5 w-3.5" /> VLC Engine
              </div>
            </motion.div>
          </div>

          {/* Floating mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-8 rounded-full bg-[var(--os-teal)] opacity-[0.06] blur-[80px]" />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Image
                src={product.hero_image_path || "/images/moplayer-hero-3d-final.png"}
                alt="MoPlayer App"
                width={640}
                height={480}
                className="w-full h-auto drop-shadow-[0_28px_70px_rgba(0,212,224,0.18)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SPECS ── */}
      <section className="section-frame mb-20 relative z-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {specs.map((s, i) => (
            <motion.div key={s.label} {...inView(i * 0.07)} className="glass-card p-8">
              <div className="mb-5 flex items-center gap-3 text-[var(--os-teal)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)]">
                  {s.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--os-text-3)]">{s.label}</span>
              </div>
              <p className="text-[2rem] font-bold text-[var(--os-text-1)] tracking-tight">{s.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-[var(--os-surface)]/30 relative z-10">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-14 text-center">
            <span className="eyebrow mx-auto mb-4 inline-flex">{t.featuresEyebrow}</span>
            <h2 className="headline-display text-[2.4rem] font-bold text-[var(--os-text-1)] mt-4">{t.featuresTitle}</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((f, i) => (
              <motion.div key={f.title} {...inView(i * 0.06)} className="glass-card p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]">
                  <MonitorSmartphone className="h-6 w-6" />
                </div>
                <h3 className="text-[16px] font-bold text-[var(--os-text-1)] mb-3">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--os-text-3)]">{f.body}</p>
              </motion.div>
            ))}

            {/* VLC card */}
            <motion.div {...inView()} className="glass-card p-8 border-orange-500/20 bg-orange-500/[0.02] flex flex-col items-center justify-center text-center">
              <div className="mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-[var(--os-border)] bg-black/5 dark:bg-white/5 p-3">
                <Image src="/images/vlc-logo.png" alt="VLC" width={64} height={64} className="grayscale brightness-200" />
              </div>
              <h3 className="text-[16px] font-bold text-[var(--os-text-1)]">Powered by VLC</h3>
              <p className="mt-2 text-[12px] text-[var(--os-text-3)]">World-class LibVLC engine for superior format support.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY + PHILOSOPHY ── */}
      <section className="py-20 relative z-10">
        <div className="section-frame grid gap-8 lg:grid-cols-2">
          <motion.div {...inView(0)} className="glass-card p-10">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--os-teal)] mb-6">{t.philosophyTitle}</h3>
            <p className="text-[16px] font-semibold leading-relaxed text-[var(--os-text-1)]">{t.philosophy}</p>
          </motion.div>
          <motion.div {...inView(0.07)} className="glass-card p-10 border-emerald-500/20 bg-emerald-500/[0.01]">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[var(--os-text-1)]">{t.privacyTitle}</h3>
            </div>
            <ul className="space-y-4">
              {t.privacyBullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[13px] text-[var(--os-text-2)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-[var(--os-surface)]/30 relative z-10">
        <div className="section-frame max-w-3xl mx-auto">
          <motion.div {...inView(0)} className="mb-12 text-center">
            <h2 className="headline-display text-[2rem] font-bold text-[var(--os-text-1)]">{t.faqTitle}</h2>
          </motion.div>
          <div className="space-y-4">
            {t.faqs.map((faq, i) => (
              <motion.details key={faq.question} {...inView(i * 0.05)} className="glass-card group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <h3 className="text-[15px] font-semibold text-[var(--os-text-1)]">{faq.question}</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--os-border)] group-open:rotate-180 transition-transform">
                    <ChevronDown className="h-4 w-4 text-[var(--os-text-3)]" />
                  </div>
                </summary>
                <div className="px-6 pb-6 text-[14px] leading-relaxed text-[var(--os-text-2)]">{faq.answer}</div>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL DOWNLOAD ── */}
      <section className="py-28 relative z-10">
        <div className="section-frame">
          <motion.div {...inView(0)} className="glass-card relative overflow-hidden rounded-[2.5rem] border-[var(--os-teal-border)] p-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--os-teal)]/[0.04] to-[var(--os-violet)]/[0.04]" />
            <h2 className="headline-display relative z-10 text-[2.6rem] font-bold text-[var(--os-text-1)]">{t.finalTitle}</h2>
            <p className="relative z-10 mt-4 text-[16px] text-[var(--os-text-2)]">{t.finalBody}</p>
            <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-4">
              {dlHref && (
                <Link href={dlHref} className="btn-primary px-12 h-14 text-[15px]">
                  <ArrowDownToLine className="h-5 w-5" /> {t.download}
                </Link>
              )}
              <Link href={`/${locale}/support`} className="btn-secondary h-14 px-8 text-[15px]">{t.support}</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
