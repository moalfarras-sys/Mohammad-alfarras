import { ArrowDownToLine, HelpCircle, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { moPlayerCopy } from "@/content/apps";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(locale: Locale, value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/78">
      {children}
    </span>
  );
}

export function MoPlayerLanding({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const { product, screenshots, releases } = ecosystem;
  const t = moPlayerCopy[locale];
  const latestRelease = releases[0] ?? null;
  const primaryAsset = latestRelease?.assets.find((asset) => asset.is_primary) ?? latestRelease?.assets[0] ?? null;
  const releaseDate = formatDate(locale, latestRelease?.published_at ?? product.last_updated_at);
  const fileSize = formatBytes(primaryAsset?.file_size_bytes);
  const downloadHref = latestRelease ? `/api/app/releases/${latestRelease.slug}/download` : null;
  const supportHref = `/${locale}/support`;
  const isAr = locale === "ar";

  const specs = [
    { label: t.specsLabels.version, value: latestRelease?.version_name ? `v${latestRelease.version_name}` : "—", icon: <Code2 className="h-4 w-4" /> },
    { label: t.specsLabels.size, value: fileSize ?? "—", icon: <Download className="h-4 w-4" /> },
    { label: t.specsLabels.minSdk, value: `API ${product.android_min_sdk}`, icon: <Cpu className="h-4 w-4" /> },
    { label: t.specsLabels.abi, value: primaryAsset?.abi ?? "—", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="relative pb-32" dir={isAr ? "rtl" : "ltr"} data-testid="moplayer-landing">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        {/* Background Background */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--text-3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="section-frame relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: isAr ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={cn("flex items-center gap-3 mb-8", isAr ? "flex-row-reverse" : "")}>
                 <span className="h-[1px] w-8 bg-[var(--accent)]" />
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">{t.badge}</p>
              </div>
              <h1 className="headline-display text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight text-[var(--text-1)]">
                {t.heroTitle}
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-[var(--text-2)] md:text-xl max-w-2xl">
                {t.heroBody}
              </p>
              
              <div className={cn("mt-12 flex flex-wrap gap-4", isAr ? "flex-row-reverse" : "")}>
                {downloadHref ? (
                  <Link href={downloadHref} className="button-liquid-primary px-10 h-16 text-lg">
                    <ArrowDownToLine className="h-5 w-5" />
                    {t.download}
                  </Link>
                ) : (
                  <div className="glass px-8 h-16 flex items-center rounded-full border-white/10 text-[var(--text-3)] font-bold">
                    {t.releasePending}
                  </div>
                )}
                <Link href={supportHref} className="button-liquid-secondary px-8 h-16">
                  {t.support}
                </Link>
              </div>

              <div className={cn("mt-10 flex flex-wrap gap-4", isAr ? "flex-row-reverse" : "")}>
                 <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--text-2)]">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    {releaseDate || "Latest"}
                 </div>
                 <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--text-2)]">
                    <MonitorSmartphone className="h-3.5 w-3.5" />
                    Android TV Ready
                 </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
               <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 blur-3xl opacity-30" />
               <div className="relative glass rounded-[3rem] border border-[var(--glass-border)] p-4 md:p-8 overflow-hidden shadow-2xl">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={product.hero_image_path || "/images/moplayer-hero-3d-final.png"}
                      alt="MoPlayer Product Preview"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SPECS DASHBOARD ── */}
      <section className="py-12 md:py-20">
        <div className="section-frame">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specs.map((spec, idx) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-3xl p-8 border-white/5"
              >
                <div className="flex items-center gap-3 text-[var(--accent)] mb-4">
                   {spec.icon}
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{spec.label}</span>
                </div>
                <p className="text-2xl font-black text-[var(--text-1)]">{spec.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 md:py-32 bg-white/[0.01]">
        <div className="section-frame">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--accent)] mb-4">{t.featuresEyebrow}</p>
            <h2 className="headline-display text-4xl md:text-6xl font-black text-[var(--text-1)]">{t.featuresTitle}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, idx) => (
              <motion.article 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group rounded-[2.5rem] p-10 border-white/5 hover:border-[var(--accent-glow)] transition-all"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] mb-8 group-hover:scale-110 transition-transform">
                  <MonitorSmartphone className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-black text-[var(--text-1)] mb-4">{feature.title}</h3>
                <p className="text-base leading-relaxed text-[var(--text-2)]">{feature.body}</p>
              </motion.article>
            ))}
            
            {/* VLC Badge Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-[2.5rem] p-10 border-[var(--accent-soft)] bg-gradient-to-br from-cyan-400/5 to-transparent flex flex-col justify-center text-center"
            >
               <div className="mx-auto h-16 w-16 mb-6 opacity-80">
                  <Image src="/images/vlc-logo.png" alt="VLC" width={64} height={64} className="grayscale brightness-200" />
               </div>
               <h3 className="text-xl font-black text-[var(--text-1)]">Powered by VLC</h3>
               <p className="mt-3 text-sm text-[var(--text-3)] leading-relaxed">Leveraging the world-class LibVLC engine for superior format support and playback stability.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LEGAL & PRIVACY ── */}
      <section className="py-24 md:py-32">
        <div className="section-frame grid gap-8 lg:grid-cols-2">
           <div className="glass rounded-[3rem] p-12 border-white/5">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--accent)] mb-8">{t.philosophyTitle}</h3>
              <p className="text-xl leading-relaxed font-bold text-[var(--text-2)]">{t.philosophy}</p>
           </div>
           
           <div className="glass rounded-[3rem] p-12 border-[var(--accent-glow)] bg-[var(--accent-soft)]">
              <div className="flex items-center gap-4 mb-8">
                 <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
                 <h3 className="text-xl font-black text-[var(--text-1)]">{t.privacyTitle}</h3>
              </div>
              <ul className="space-y-6">
                {t.privacyBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-4">
                    <div className="h-1.5 w-1.5 mt-2 rounded-full bg-[var(--accent)] shrink-0" />
                    <span className="text-base font-bold text-[var(--text-2)]">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 p-6 rounded-2xl bg-black/20 border border-white/5">
                 <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)] mb-2">{t.disclaimerTitle}</p>
                 <p className="text-xs font-bold leading-relaxed text-[var(--text-3)]">
                    MoPlayer does not provide, host, or link to any copyrighted media. Users must provide their own legal content or IPTV sources.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-white/[0.01]">
        <div className="section-frame">
          <div className="max-w-3xl mx-auto">
            <h2 className="headline-display text-4xl font-black text-[var(--text-1)] mb-12 text-center">{t.faqTitle}</h2>
            <div className="space-y-4">
              {t.faqs.map((faq) => (
                <details key={faq.question} className="glass group rounded-2xl border-white/5 overflow-hidden transition-all hover:border-white/10">
                   <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                      <h3 className="text-lg font-black text-[var(--text-1)]">{faq.question}</h3>
                      <HelpCircle className="h-5 w-5 text-[var(--accent)] group-open:rotate-180 transition-transform" />
                   </summary>
                   <div className="px-8 pb-8 text-[var(--text-2)] leading-relaxed font-medium">
                      {faq.answer}
                   </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD FOOTER ── */}
      <section className="mt-24">
        <div className="section-frame">
          <div className="glass relative overflow-hidden rounded-[4rem] border border-[var(--glass-border)] p-12 md:p-24 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent" />
            <div className="relative z-10 max-w-3xl mx-auto">
               <h2 className="headline-display text-5xl md:text-7xl font-black text-[var(--text-1)] mb-8">{t.finalTitle}</h2>
               <p className="text-lg md:text-xl text-[var(--text-2)] mb-16">{t.finalBody}</p>
               
               <div className="flex flex-col items-center gap-8">
                  {downloadHref ? (
                    <Link href={downloadHref} className="button-liquid-primary px-16 h-20 text-xl">
                      <ArrowDownToLine className="h-6 w-6" />
                      {t.download}
                    </Link>
                  ) : null}
                  <div className="flex flex-wrap justify-center gap-6">
                     <Link href={supportHref} className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-3)] hover:text-[var(--accent)] transition-colors">
                        {t.support}
                     </Link>
                     <span className="text-white/10">|</span>
                     <Link href={`/${locale}/privacy`} className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-3)] hover:text-[var(--accent)] transition-colors">
                        Privacy Policy
                     </Link>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
