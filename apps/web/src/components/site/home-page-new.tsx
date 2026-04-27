"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Code2, Play, Globe, Cpu, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SiteViewModel } from "./site-view-model";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function PortfolioHomePageNew({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const locale = model.locale;

  const proofBadges = isAr
    ? ["🇩🇪 مقيم في ألمانيا", "🇸🇾 جذور سورية", "📱 Android TV", "🎬 +1.5M مشاهدة", "💻 Web · UI/UX", "🚚 لوجستيات"]
    : ["🇩🇪 Germany based", "🇸🇾 Syrian roots", "📱 Android TV builder", "🎬 1.5M+ YT views", "💻 Web · UI/UX", "🚚 Logistics pro"];

  const modes = isAr
    ? [
        { icon: <Code2 className="h-5 w-5" />, title: "Developer Mode", body: "مواقع، لوحات تحكم، Next.js/React/TypeScript، Supabase وVercel." },
        { icon: <Play className="h-5 w-5" />,   title: "Creator Mode",    body: "مراجعات تقنية عربية صادقة لأدوات SaaS والذكاء الاصطناعي والإلكترونيات." },
        { icon: <Globe className="h-5 w-5" />,  title: "Operations Mode", body: "خبرة لوجستية حقيقية: TMS، التنسيق، خدمة العملاء، وضغط التشغيل." },
        { icon: <Cpu className="h-5 w-5" />,    title: "MoPlayer Mode",   body: "منتج Android TV بتفعيل وإصدارات APK وتجربة IPTV منظمة." },
      ]
    : [
        { icon: <Code2 className="h-5 w-5" />, title: "Developer Mode", body: "Websites, dashboards, Next.js/React/TypeScript, Supabase and Vercel systems." },
        { icon: <Play className="h-5 w-5" />,   title: "Creator Mode",    body: "Honest Arabic tech reviews for SaaS, AI tools, and electronics — built on clarity." },
        { icon: <Globe className="h-5 w-5" />,  title: "Operations Mode", body: "Real logistics discipline from TMS, dispatch coordination and operational pressure." },
        { icon: <Cpu className="h-5 w-5" />,    title: "MoPlayer Mode",   body: "An Android TV product with activation, APK releases and structured IPTV experience." },
      ];

  const storyArc = isAr
    ? [
        { num: "01", label: "السوريا", sub: "جذور الحسكة" },
        { num: "02", label: "ألمانيا", sub: "الانتقال والانضباط" },
        { num: "03", label: "اللوجستيات", sub: "Rhenus · TMS" },
        { num: "04", label: "الويب", sub: "Next.js · React" },
        { num: "05", label: "يوتيوب", sub: "+1.5M مشاهدة" },
        { num: "06", label: "MoPlayer", sub: "Android TV" },
      ]
    : [
        { num: "01", label: "Syria", sub: "Al-Hasakah roots" },
        { num: "02", label: "Germany", sub: "Discipline & growth" },
        { num: "03", label: "Logistics", sub: "Rhenus · TMS" },
        { num: "04", label: "Web", sub: "Next.js · React" },
        { num: "05", label: "YouTube", sub: "1.5M+ views" },
        { num: "06", label: "MoPlayer", sub: "Android TV" },
      ];

  const services = model.services.slice(0, 3);

  const stack = ["NEXT.JS", "TYPESCRIPT", "REACT", "TAILWIND", "SUPABASE", "ANDROID", "VLC ENGINE", "FRAMER MOTION"];

  return (
    <div className="relative" dir={isAr ? "rtl" : "ltr"}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16">
        {/* Orbs */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[-10%] top-[-5%] h-[600px] w-[600px] rounded-full bg-[var(--os-teal)] opacity-[0.06] blur-[120px]" />
          <div className="absolute right-[-5%] top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--os-violet)] opacity-[0.06] blur-[100px]" />
          <div className="absolute bottom-0 left-[20%] h-[400px] w-[400px] rounded-full bg-[var(--os-violet)] opacity-[0.04] blur-[100px]" />
        </div>

        <div className="section-frame relative z-10 py-24 lg:py-32">
          <div className="flex flex-col-reverse lg:grid gap-12 lg:gap-16 lg:grid-cols-[1fr_420px] lg:items-center">
            {/* Left */}
            <div>
              {/* Status pill */}
              <motion.div {...fadeUp(0)} className="mb-8 inline-flex items-center gap-3 rounded-full border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--os-teal)] opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--os-teal)]" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--os-teal)]">
                  {isAr ? "متاح لمشاريع استثنائية" : "Available for premium projects"}
                </span>
              </motion.div>

              {/* H1 */}
              <h1 className="text-6xl font-bold text-red-500">!!! DEPLOYED v4.2 TEST !!!</h1>

              {/* Sub */}
              <motion.p {...fadeUp(0.2)} className="mt-8 max-w-xl text-[17px] leading-relaxed text-[var(--os-text-2)]">
                {isAr
                  ? "محمد الفراس — مطوّر ويب ومصمم واجهات وباني Android TV وصانع محتوى تقني عربي مقيم في ألمانيا."
                  : "Mohammad Alfarras — web developer, UI designer, Android TV app builder, and Arabic tech creator based in Germany."}
              </motion.p>

              {/* CTAs */}
              <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-wrap gap-4">
                <Link href={`/${locale}/work`} className="btn-primary px-8 h-13 text-[14px]">
                  {isAr ? "استكشف الأعمال" : "View the work"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/${locale}/apps/moplayer`} className="btn-secondary px-7 h-13 text-[14px]">
                  {isAr ? "استكشف MoPlayer" : "Explore MoPlayer"}
                </Link>
                <Link href={`/${locale}/contact`} className="btn-secondary px-7 h-13 text-[14px]">
                  {isAr ? "تواصل معي" : "Contact me"}
                </Link>
              </motion.div>

              {/* Proof badges */}
              <motion.div {...fadeUp(0.4)} className="mt-8 flex flex-wrap gap-2">
                {proofBadges.map((b) => (
                  <span key={b} className="os-badge text-[11px]">{b}</span>
                ))}
              </motion.div>
            </div>

            {/* Right — portrait */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-[320px] lg:max-w-none"
            >
              <div className="absolute -inset-6 rounded-full bg-[var(--os-teal)] opacity-[0.07] blur-[60px]" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                <Image
                  src={model.portraitImage || "/images/portrait.jpg"}
                  alt="Mohammad Alfarras"
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="420px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--os-surface)] via-transparent to-transparent opacity-60" />
                {/* Name card */}
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[var(--os-border)] bg-black/50 p-4 backdrop-blur-xl">
                  <p className="text-[12px] font-bold text-[var(--os-text-1)]">Mohammad Alfarras</p>
                  <p className="mt-1 text-[10px] text-[var(--os-text-3)]">
                    {isAr ? "مطوّر ويب · مصمم · مبدع محتوى" : "Web Developer · Designer · Creator"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--os-text-3)]"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </section>

      {/* ══════════ STACK MARQUEE ══════════ */}
      <section className="overflow-hidden border-y border-[var(--os-border)] bg-[var(--os-surface)]/50 py-5 select-none">
        <div className="flex gap-16" style={{ width: "max-content" }}>
          {[...stack, ...stack].map((t, i) => (
            <span key={i} className="animate-marquee whitespace-nowrap text-[42px] font-bold tracking-tight text-[var(--os-text-1)]/[0.04]">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════ WHO AM I — MODE CARDS ══════════ */}
      <section className="py-28">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-14">
            <span className="eyebrow">{isAr ? "اختر وضعك" : "Choose your angle"}</span>
            <h2 className="headline-display mt-5 text-[clamp(1.8rem,4vw,3.4rem)] font-bold text-[var(--os-text-1)]">
              {isAr
                ? "شخص واحد · منظومة رقمية واحدة"
                : "One person. One digital OS."}
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map((m, i) => (
              <motion.div key={m.title} {...inView(i * 0.07)} className="glass-card p-8">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]">
                  {m.icon}
                </div>
                <h3 className="text-[15px] font-bold text-[var(--os-text-1)]">{m.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--os-text-3)]">{m.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SERVICES ══════════ */}
      <section className="py-28 bg-[var(--os-surface)]/30">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-14 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <span className="eyebrow">{isAr ? "القدرات" : "Capabilities"}</span>
              <h2 className="headline-display mt-5 text-[clamp(1.8rem,4vw,3.2rem)] font-bold text-[var(--os-text-1)]">
                {isAr ? "ما الذي أبنيه" : "What I build"}
              </h2>
            </div>
            <Link href={`/${locale}/work`} className="group flex items-center gap-2 text-[13px] font-semibold text-[var(--os-text-3)] hover:text-[var(--os-teal)] transition-colors">
              {isAr ? "جميع الأعمال" : "All work"} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {services.map((s, i) => (
              <motion.div key={s.id} {...inView(i * 0.09)} className="glass-card overflow-hidden">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={s.image || "/images/service_web.png"}
                    alt={s.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--os-surface)] via-transparent to-transparent" />
                </div>
                <div className="p-8">
                  <h3 className="text-[16px] font-bold text-[var(--os-text-1)] leading-tight">{s.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-[var(--os-text-3)]">{s.body}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.bullets.map((b) => (
                      <span key={b} className="os-badge text-[10px]">{b}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MOPLAYER FEATURE ══════════ */}
      <section className="py-28">
        <div className="section-frame">
          <motion.div
            {...inView(0)}
            className="relative overflow-hidden rounded-[2.5rem] border border-[var(--os-teal-border)] bg-gradient-to-br from-[var(--os-teal)]/[0.04] to-[var(--os-violet)]/[0.04] p-10 md:p-16"
          >
            {/* Bg glow */}
            <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[var(--os-teal)] opacity-[0.05] blur-[100px]" />

            <div className="relative z-10 grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
              {/* Text */}
              <div>
                <span className="eyebrow mb-6 inline-flex">
                  <Zap className="h-3.5 w-3.5" />
                  {isAr ? "المنتج الرئيسي" : "Flagship product"}
                </span>
                <h2 className="headline-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold text-[var(--os-text-1)]">
                  MoPlayer
                </h2>
                <p className="mt-5 text-[16px] leading-relaxed text-[var(--os-text-2)] max-w-md">
                  {isAr
                    ? "مشغّل وسائط متطوّر يعمل على محرّك VLC، مصمّم لتجربة مشاهدة سينمائية على Android TV والهواتف."
                    : "A high-performance media engine powered by VLC, designed for a cinematic viewing experience on Android TV and mobile."}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href={`/${locale}/apps/moplayer`} className="btn-primary">
                    {isAr ? "استكشف المنتج" : "Explore product"}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link href={`/${locale}/activate`} className="btn-secondary">
                    {isAr ? "تفعيل الجهاز" : "Activate device"}
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {["VLC Engine", "Android TV", "Xtream · M3U", isAr ? "APK مباشر" : "Direct APK"].map((t) => (
                    <span key={t} className="os-badge">{t}</span>
                  ))}
                </div>
              </div>

              {/* Mockup */}
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-[var(--os-teal)] opacity-[0.06] blur-[80px]" />
                <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="relative">
                  <Image
                    src="/images/moplayer-hero-3d-final.png"
                    alt="MoPlayer App"
                    width={640}
                    height={480}
                    className="w-full h-auto drop-shadow-[0_24px_60px_rgba(0,212,224,0.18)]"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ STORY ARC ══════════ */}
      <section className="py-28 bg-[var(--os-surface)]/30">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12">
            <span className="eyebrow">{isAr ? "قوس القصة" : "Story arc"}</span>
            <h2 className="headline-display mt-5 text-[clamp(1.8rem,4vw,3rem)] font-bold text-[var(--os-text-1)]">
              {isAr ? "من الواقع إلى النظام الرقمي" : "From reality to digital systems"}
            </h2>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {storyArc.map((s, i) => (
              <motion.div
                key={s.num}
                {...inView(i * 0.06)}
                className="glass-card px-6 py-7"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-teal)]">{s.num}</p>
                <p className="mt-3 text-[15px] font-bold text-[var(--os-text-1)]">{s.label}</p>
                <p className="mt-1 text-[11px] text-[var(--os-text-3)]">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-36 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[var(--os-violet)] opacity-[0.06] blur-[120px]" />
        </div>
        <div className="section-frame relative z-10">
          <motion.h2 {...inView(0)} className="headline-display text-[clamp(2rem,5vw,4.5rem)] font-bold text-[var(--os-text-1)]">
            {isAr ? "لنحوّل فكرتك إلى واقع رقمي." : "Let's build something real."}
          </motion.h2>
          <motion.p {...inView(0.1)} className="mt-5 text-[17px] text-[var(--os-text-2)] max-w-lg mx-auto">
            {isAr
              ? "أرسل لي المشروع كما هو — سأرتّب الأولويات ونبدأ."
              : "Send the project as it is. I'll map the goal and we start."}
          </motion.p>
          <motion.div {...inView(0.2)} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={`/${locale}/contact`} className="btn-primary px-10 h-14 text-[15px]">
              {isAr ? "ابدأ الآن" : "Start a conversation"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={`/${locale}/work`} className="btn-secondary px-8 h-14 text-[15px]">
              {isAr ? "استكشف الأعمال" : "View my work"}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
