"use client";

import { ArrowDownToLine, MonitorSmartphone, ShieldCheck, Code2, Download, Cpu, Zap, Play, Layout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";

import { moPlayerCopy } from "@/content/apps";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";
import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(locale: Locale, value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const date = parsed.toISOString().slice(0, 10);
  return locale === "ar" ? date.replaceAll("-", "/") : date;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("relative group", className)}
    >
      <div style={{ transform: "translateZ(50px)" }} className="relative z-10 h-full w-full">
        {children}
      </div>
      <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-8 bg-violet-400" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">{children}</p>
    </div>
  );
}

export function MoPlayerLanding({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const { product, releases } = ecosystem;
  const t = repairMojibakeDeep(moPlayerCopy[locale]);
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
    <div className="relative overflow-hidden pb-32" dir={isAr ? "rtl" : "ltr"} data-testid="moplayer-landing">
      {/* ── MOPLAYER HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#050811]" />
          <div className="absolute -right-1/4 top-0 h-[800px] w-[800px] rounded-full bg-cyan-600/5 blur-[160px]" />
        </div>

        <div className="section-frame relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: isAr ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400"
              >
                 <Zap className="h-3.5 w-3.5 fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.badge}</span>
              </motion.div>
              
              <h1 className="headline-display text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.95] tracking-tighter text-white">
                {t.heroTitle}
              </h1>
              
              <p className="mt-10 text-xl leading-relaxed text-slate-400 max-w-2xl font-medium">
                {t.heroBody}
              </p>
              
              <div className={cn("mt-12 flex flex-wrap gap-6", isAr ? "flex-row-reverse" : "")}>
                {downloadHref ? (
                  <Link href={downloadHref} className="button-liquid-primary px-12 h-18 text-xl font-black shadow-[0_20px_50px_rgba(34,211,238,0.2)]">
                    <ArrowDownToLine className="h-6 w-6" />
                    {t.download}
                  </Link>
                ) : (
                  <div className="glass px-10 h-18 flex items-center rounded-full border-white/10 text-slate-500 font-black uppercase tracking-widest text-sm">
                    {t.releasePending}
                  </div>
                )}
                <Link href={supportHref} className="button-liquid-secondary px-10 h-18 text-sm font-black">
                  {t.support}
                </Link>
              </div>

              <div className={cn("mt-12 flex flex-wrap gap-6", isAr ? "flex-row-reverse" : "")}>
                 <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {releaseDate || "Latest Build"}
                 </div>
                 <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <MonitorSmartphone className="h-4 w-4" />
                    Android TV Native
                 </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: isAr ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="relative"
            >
               <div className="absolute -inset-6 rounded-full bg-violet-600/10 blur-[80px] md:-inset-20 md:blur-[120px]" />
               <motion.div 
                 animate={{ y: [0, -20, 0] }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                 className="relative z-10 glass rounded-[4rem] border-white/10 p-6 md:p-12 shadow-[0_50px_150px_rgba(0,0,0,0.7)]"
               >
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={product.hero_image_path || "/images/moplayer-hero-3d-final.png"}
                      alt="MoPlayer Product Preview"
                      fill
                      priority
                      className="object-contain drop-shadow-[0_30px_60px_rgba(124,58,237,0.3)]"
                    />
                  </div>
               </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SPECS DASHBOARD ── */}
      <section className="py-20 relative z-20">
        <div className="section-frame relative">
          {/* Motion Asset Background */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute -top-40 -left-40 hidden h-[600px] w-[600px] opacity-10 md:block"
          >
             <Image src="/images/moplayer-motion.png" alt="Motion" width={600} height={600} className="w-full h-full object-contain" />
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {specs.map((spec) => (
              <TiltCard key={spec.label}>
                <div className="glass flex h-full flex-col justify-between rounded-[2rem] border-white/5 bg-white/[0.01] p-6 sm:rounded-[2.5rem] md:p-10">
                  <div className="flex items-center gap-4 text-violet-400 mb-8">
                     <div className="h-10 w-10 rounded-xl bg-violet-400/10 flex items-center justify-center border border-violet-400/20">
                        {spec.icon}
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{spec.label}</span>
                  </div>
                  <p className="text-3xl font-black text-white tracking-tight">{spec.value}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-32 bg-white/[0.01] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="section-frame">
          <div className="mb-24 text-center">
            <Eyebrow className="mx-auto">{t.featuresEyebrow}</Eyebrow>
            <h2 className="headline-display mt-8 text-4xl md:text-8xl font-black text-white tracking-tighter">{t.featuresTitle}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, idx) => (
              <motion.article 
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group rounded-[2rem] border-white/5 p-6 transition-all hover:border-violet-500/30 hover:bg-white/[0.03] sm:rounded-[3rem] md:p-12 lg:rounded-[3.5rem]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 mb-10 border border-violet-500/20 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-black transition-all">
                  <MonitorSmartphone className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{feature.title}</h3>
                <p className="text-base leading-relaxed text-slate-400 font-medium">{feature.body}</p>
              </motion.article>
            ))}
            
            {/* VLC Integration Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass group relative flex flex-col justify-center overflow-hidden rounded-[2rem] border-orange-500/20 bg-orange-500/[0.02] p-6 text-center sm:rounded-[3rem] md:p-12 lg:rounded-[3.5rem]"
            >
               <div className="absolute -inset-10 bg-orange-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-400/20 bg-orange-400/10 text-orange-300">
                  <Play className="h-9 w-9 fill-current" />
               </div>
               <h3 className="text-2xl font-black text-white tracking-tight">Engineered by VLC</h3>
               <p className="mt-4 text-sm text-slate-500 leading-relaxed font-bold uppercase tracking-widest">Industry Standard Playback</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PROTOCOL & PRIVACY ── */}
      <section className="py-32">
        <div className="section-frame grid gap-12 lg:grid-cols-2">
           <div className="glass relative overflow-hidden rounded-[2.5rem] border-white/5 p-6 sm:rounded-[4rem] md:p-16">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03]">
                 <Layout className="h-64 w-64 text-white" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-400 mb-10">{t.philosophyTitle}</h3>
              <p className="text-2xl leading-relaxed font-black text-white tracking-tight">{t.philosophy}</p>
           </div>
           
           <div className="glass rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/[0.01] p-6 sm:rounded-[4rem] md:p-16">
              <div className="flex items-center gap-5 mb-10">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <h3 className="text-2xl font-black text-white tracking-tight">{t.privacyTitle}</h3>
              </div>
              <ul className="space-y-8">
                {t.privacyBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-5">
                    <div className="h-2 w-2 mt-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <span className="text-lg font-bold text-slate-300 leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </section>

      {/* ── FAQ PROTOCOL ── */}
      <section className="py-32 bg-white/[0.01]">
        <div className="section-frame">
          <div className="max-w-4xl mx-auto">
            <h2 className="headline-display text-4xl md:text-7xl font-black text-white mb-20 text-center tracking-tighter">{t.faqTitle}</h2>
            <div className="space-y-6">
              {t.faqs.map((faq) => (
                <details key={faq.question} className="glass group rounded-[2rem] border-white/5 overflow-hidden transition-all hover:bg-white/[0.02]">
                   <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 md:p-10">
                      <h3 className="text-xl font-black text-white tracking-tight">{faq.question}</h3>
                      <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-open:rotate-180 transition-transform">
                         <ChevronDown className="h-5 w-5 text-slate-500" />
                      </div>
                   </summary>
                   <div className="px-6 pb-6 text-base font-medium leading-relaxed text-slate-400 md:px-10 md:pb-10 md:text-lg">
                      {faq.answer}
                   </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL DOWNLOAD ── */}
      <section className="py-40">
        <div className="section-frame">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass relative overflow-hidden rounded-[2.5rem] border-white/5 p-8 text-center shadow-[0_50px_150px_rgba(0,0,0,0.8)] sm:rounded-[4rem] md:p-32 lg:rounded-[5rem]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-600/10" />
            <div className="relative z-10 max-w-4xl mx-auto">
               <h2 className="headline-display text-5xl md:text-9xl font-black text-white tracking-tighter mb-12 leading-[0.85]">{t.finalTitle}</h2>
               <p className="text-xl md:text-2xl text-slate-400 mb-20 font-medium leading-relaxed">{t.finalBody}</p>
               
               <div className="flex flex-col items-center gap-12">
                  {downloadHref ? (
                    <Link href={downloadHref} className="button-liquid-primary h-20 px-10 text-lg font-black shadow-2xl md:h-24 md:px-20 md:text-2xl">
                      <ArrowDownToLine className="h-8 w-8" />
                      {t.download}
                    </Link>
                  ) : null}
                  <div className="flex flex-wrap justify-center gap-10">
                     <Link href={supportHref} className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors">
                        {t.support}
                     </Link>
                     <span className="text-white/10">|</span>
                     <Link href={`/${locale}/privacy`} className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors">
                        Protocol Privacy
                     </Link>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
