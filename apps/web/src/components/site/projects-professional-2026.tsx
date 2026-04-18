"use client";

import { motion, type Variants, useMotionValue, useSpring, useTransform, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  ExternalLink,
  Gauge,
  Globe,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sunrise,
  Sunset,
  Sun,
  Trophy,
  Wind,
  Zap,
  TrendingUp,
  Clock,
  BarChart3,
  ChevronRight,
  Check,
  Star,
} from "lucide-react";
import * as React from "react";
import { useMemo, useSyncExternalStore, useRef, useState, useEffect } from "react";

import { useThemeMode } from "@/components/layout/use-theme-mode";
import { cn } from "@/lib/cn";

import type { SiteViewModel } from "./site-view-client";

/* ────────────────────────────────────────────────
   PARTICLE SYSTEMS
───────────────────────────────────────────────── */
const rainParticles = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: (i % 13) * 8,
  delay: (i % 6) * 0.15,
  duration: 0.7 + (i % 5) * 0.1,
}));

const snowParticles = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: (i % 8) * 13,
  sway: (i % 4) * 14 - 20,
  delay: (i % 6) * 0.2,
  duration: 4 + (i % 5) * 0.5,
}));

/* ────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
function t<T extends React.ReactNode>(locale: SiteViewModel["locale"], ar: T, en: T): T {
  return locale === "ar" ? ar : en;
}

function localizeWeatherCondition(locale: SiteViewModel["locale"], condition?: string | null) {
  switch (condition) {
    case "Clear":      return t(locale, "سماء صافية", "Clear sky");
    case "Clouds":     return t(locale, "غيوم", "Clouds");
    case "Rain":       return t(locale, "مطر", "Rain");
    case "Drizzle":    return t(locale, "رذاذ", "Drizzle");
    case "Thunderstorm": return t(locale, "عاصفة رعدية", "Thunderstorm");
    case "Snow":       return t(locale, "ثلوج", "Snow");
    case "Mist":       return t(locale, "ضباب", "Mist");
    default:           return condition ?? t(locale, "الطقس المباشر", "Live weather");
  }
}

function localizeHighlightStyle(
  locale: SiteViewModel["locale"],
  style: SiteViewModel["projects"][number]["highlightStyle"],
) {
  switch (style) {
    case "operations": return t(locale, "تشغيل / عمليات", "Operations");
    case "trust":      return t(locale, "ثقة / تحويل", "Trust / Conversion");
    case "app":        return t(locale, "تجربة تطبيق", "App Experience");
    default:           return t(locale, "دراسة حالة", "Case Study");
  }
}

/* ────────────────────────────────────────────────
   WEATHER COMPONENTS
───────────────────────────────────────────────── */
function WeatherGlyph({ condition }: { condition?: string | null }) {
  const iconClass = "h-14 w-14 md:h-16 md:w-16";
  switch (condition) {
    case "Clouds":
      return <Cloud className={cn(iconClass, "text-slate-400 drop-shadow-[0_0_30px_rgba(148,163,184,0.4)]")} />;
    case "Rain":
      return <CloudRain className={cn(iconClass, "text-cyan-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]")} />;
    case "Drizzle":
      return <CloudDrizzle className={cn(iconClass, "text-cyan-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]")} />;
    case "Thunderstorm":
      return <CloudLightning className={cn(iconClass, "text-violet-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]")} />;
    case "Snow":
      return <CloudSnow className={cn(iconClass, "text-blue-300 drop-shadow-[0_0_30px_rgba(147,197,253,0.55)]")} />;
    case "Mist":
      return <CloudFog className={cn(iconClass, "text-slate-400 drop-shadow-[0_0_30px_rgba(203,213,225,0.32)]")} />;
    default:
      return <Sun className={cn(iconClass, "text-amber-400 drop-shadow-[0_0_40px_rgba(253,224,71,0.42)]")} />;
  }
}

function WeatherScene({ condition, isDay, isLight }: { condition: string; isDay: boolean; isLight: boolean }) {
  const isRain = condition === "Rain" || condition === "Drizzle";
  const isThunder = condition === "Thunderstorm";
  const isSnow = condition === "Snow";
  const isClear = condition === "Clear";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.08), transparent 40%), radial-gradient(circle at 100% 0%, rgba(0,229,255,0.06), transparent 40%), linear-gradient(180deg, rgba(241,245,249,0.4), rgba(226,232,240,0.2))"
            : isDay
              ? "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.16), transparent 30%), radial-gradient(circle at 100% 0%, rgba(0,229,255,0.16), transparent 32%), linear-gradient(180deg, rgba(16,24,40,0.3), rgba(4,7,18,0.66))"
              : "radial-gradient(circle at 20% 20%, rgba(168,85,247,0.2), transparent 30%), radial-gradient(circle at 100% 0%, rgba(34,211,238,0.12), transparent 36%), linear-gradient(180deg, rgba(5,10,26,0.78), rgba(2,6,16,0.96))",
        }}
      />

      {isClear ? (
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: 360 }}
          transition={{ scale: { duration: 5, repeat: Infinity }, rotate: { duration: 40, ease: "linear", repeat: Infinity } }}
          className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(253,224,71,0.6),rgba(253,224,71,0.08)_58%,transparent_70%)] blur-md"
        />
      ) : null}

      {isRain ? (
        <div className="absolute inset-0">
          {rainParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute top-0 h-14 w-px bg-gradient-to-b from-transparent via-cyan-300/90 to-transparent"
              style={{ left: `${particle.x}%` }}
              animate={{ y: [-30, 250], opacity: [0, 1, 0] }}
              transition={{ duration: particle.duration, ease: "linear", repeat: Infinity, delay: particle.delay }}
            />
          ))}
        </div>
      ) : null}

      {isThunder ? (
        <motion.div
          className="absolute inset-0 bg-violet-400/25"
          animate={{ opacity: [0, 0, 0.75, 0, 0, 0.5, 0] }}
          transition={{ duration: 4.2, repeat: Infinity }}
        />
      ) : null}

      {isSnow ? (
        <div className="absolute inset-0">
          {snowParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute top-0 h-2 w-2 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.7)]"
              style={{ left: `${particle.x}%` }}
              animate={{ y: [-12, 220], x: [0, particle.sway, 0], opacity: [0, 1, 0.4] }}
              transition={{ duration: particle.duration, ease: "easeInOut", repeat: Infinity, delay: particle.delay }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────
   ACCENT STYLES
───────────────────────────────────────────────── */
function accentStyles(accent: SiteViewModel["projects"][number]["accent"], isLight: boolean) {
  if (accent === "orange") {
    return { tint: "#6366F1", glow: "rgba(255,107,0,0.25)", badge: isLight ? "rgba(255,107,0,0.08)" : "rgba(255,107,0,0.14)" };
  }
  if (accent === "cyan") {
    return { tint: "#22d3ee", glow: "rgba(34,211,238,0.25)", badge: isLight ? "rgba(34,211,238,0.08)" : "rgba(34,211,238,0.14)" };
  }
  if (accent === "purple") {
    return { tint: "#D946EF", glow: "rgba(168,85,247,0.24)", badge: isLight ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.14)" };
  }
  return { tint: "#00E5FF", glow: "rgba(0,229,255,0.25)", badge: isLight ? "rgba(0,184,90,0.08)" : "rgba(0,229,255,0.14)" };
}

function deviceBadge(project: SiteViewModel["projects"][number], locale: SiteViewModel["locale"]) {
  switch (project.deviceFrame) {
    case "phone":    return { icon: Smartphone, label: t(locale, "عرض تطبيق", "App framing") };
    case "floating": return { icon: Sparkles, label: t(locale, "عرض سينمائي", "Floating showcase") };
    default:         return { icon: Globe, label: t(locale, "عرض متصفح", "Browser framing") };
  }
}

/* ────────────────────────────────────────────────
   CINEMATIC HERO SECTION
───────────────────────────────────────────────── */
function CinematicHero({ locale, isLight, projects }: {
  locale: SiteViewModel["locale"];
  isLight: boolean;
  projects: SiteViewModel["projects"];
}) {
  const featuredNames = projects.filter(p => p.featured).map(p => p.title);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9 }}
      className="relative overflow-hidden py-28 md:py-36"
    >
      {/* Cinematic background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? "radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0,229,255,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 85% 70%, rgba(168,85,247,0.1), transparent 50%)"
              : "radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0,229,255,0.08), transparent 55%), radial-gradient(ellipse 60% 40% at 85% 70%, rgba(168,85,247,0.07), transparent 50%)",
          }}
        />
        {/* Animated grid lines */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden>
          <defs>
            <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[15%] h-32 w-32 rounded-full blur-3xl"
          style={{ background: "rgba(0,229,255,0.15)" }}
        />
        <motion.div
          animate={{ y: [0, 25, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 right-[10%] h-48 w-48 rounded-full blur-3xl"
          style={{ background: "rgba(168,85,247,0.14)" }}
        />
      </div>

      <div className="section-frame relative z-10 w-full max-w-[1420px]">
        <div className="max-w-5xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex flex-wrap items-center gap-3"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]"
              style={{
                borderColor: isLight ? "rgba(0,184,90,0.3)" : "rgba(0,229,255,0.2)",
                background: isLight ? "rgba(0,184,90,0.06)" : "rgba(0,229,255,0.06)",
                color: isLight ? "rgb(0,150,80)" : "#00E5FF",
              }}
            >
              <Sparkles className="h-3 w-3" />
              {t(locale, "الأعمال والمشاريع", "Work & Projects")}
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
              style={{
                borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.08)",
                color: isLight ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.4)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              {t(locale, "نظام حي ومتصل", "Live connected system")}
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="headline-arabic text-3xl font-black leading-[1.08] text-foreground sm:text-5xl md:text-7xl xl:text-8xl"
          >
            {locale === "ar" ? (
              <>
                لا أبني مواقع.{" "}
                <span className="hero-accent-green">أبني أنظمة</span>{" "}
                <br className="hidden md:block" />
                تحوّل الزائر عميلاً.
              </>
            ) : (
              <>
                I don&apos;t build websites.{" "}
                <span className="hero-accent-green">I build systems</span>{" "}
                <br className="hidden md:block" />
                that convert.
              </>
            )}
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-8 max-w-2xl text-lg leading-8 text-foreground-muted md:text-xl"
          >
            {t(locale,
              "كل مشروع هنا يحمل قصة حقيقية: ما كانت المشكلة، ما القرار الذي تغيّر، وكيف بات الانطباع أقوى وأوضح وأكثر تحويلاً.",
              "Every project here carries a real story: what was broken, what decision changed everything, and how the final result became stronger, clearer, and more profitable."
            )}
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href={`/${locale}/contact`}
              className="cta-green-btn inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
            >
              <ArrowUpRight className="h-4 w-4" />
              {t(locale, "ابدأ مشروعك", "Start your project")}
            </Link>
            <Link
              href={`/${locale}/cv`}
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-bold text-foreground transition hover:-translate-y-0.5"
              style={{ borderColor: isLight ? "rgba(148,163,184,0.3)" : "rgba(255,255,255,0.12)" }}
            >
              {t(locale, "السيرة الذاتية", "My background")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Project pill badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            {featuredNames.map((name, i) => (
              <span
                key={name}
                className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition hover:scale-105"
                style={{
                  borderColor: i === 0 ? "rgba(0,229,255,0.25)" : i === 1 ? "rgba(255,107,0,0.25)" : "rgba(34,211,238,0.25)",
                  color: i === 0 ? (isLight ? "#007a45" : "#00E5FF") : i === 1 ? "#6366F1" : "#22d3ee",
                  background: i === 0 ? "rgba(0,229,255,0.06)" : i === 1 ? "rgba(255,107,0,0.06)" : "rgba(34,211,238,0.06)",
                }}
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* ────────────────────────────────────────────────
   LOGO SHOWCASE (horizontal scrolling)
───────────────────────────────────────────────── */
function LogoShowcase({ locale, isLight }: { locale: SiteViewModel["locale"]; isLight: boolean }) {
  const logos = [
    { name: "SEEL Transport", url: "https://seeltransport.de", abbr: "SEEL" },
    { name: "Schnell Sicher Umzug", url: "https://schnellsicherumzug.de", abbr: "SSU" },
    { name: "Mohammad Alfarras", url: `/${locale}`, abbr: "محمد" },
    { name: "YouTube Channel", url: "https://youtube.com/@Moalfarras", abbr: "YT" },
    { name: "MoPlayer", url: "#", abbr: "MP" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[2.4rem] border px-6 py-8 md:px-10 md:py-10"
      style={{
        background: isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.02)",
        borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="text-xs font-black uppercase tracking-[0.28em] text-foreground-muted">
          {t(locale, "العلامات والمشاريع", "Brands & Projects")}
        </span>
        <div className="h-px flex-1" style={{ background: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.06)" }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {logos.map((logo, i) => (
          <motion.a
            key={logo.name}
            href={logo.url}
            target={logo.url.startsWith("http") ? "_blank" : undefined}
            rel={logo.url.startsWith("http") ? "noopener noreferrer" : undefined}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, filter: "grayscale(0)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="group flex items-center gap-3 rounded-2xl border px-5 py-3 transition-all duration-300"
            style={{
              borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.08)",
              background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.03)",
              filter: "grayscale(0.6)",
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black"
              style={{
                background: i === 0 ? "rgba(0,229,255,0.15)" : i === 1 ? "rgba(255,107,0,0.15)" : i === 2 ? "rgba(168,85,247,0.15)" : i === 3 ? "rgba(255,0,0,0.15)" : "rgba(34,211,238,0.15)",
                color: i === 0 ? "#00E5FF" : i === 1 ? "#6366F1" : i === 2 ? "#D946EF" : i === 3 ? "#ff4444" : "#22d3ee",
              }}
            >
              {logo.abbr.slice(0, 2)}
            </div>
            <span className="text-sm font-bold text-foreground-muted group-hover:text-foreground transition-colors">
              {logo.name}
            </span>
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}

/* ────────────────────────────────────────────────
   IMPACT / METRICS SECTION
───────────────────────────────────────────────── */
function ImpactSection({ locale, isLight }: { locale: SiteViewModel["locale"]; isLight: boolean }) {
  const metrics = [
    {
      value: "+60%",
      label: t(locale, "تحسين قابلية القراءة البصرية", "Visual readability improvement"),
      icon: BarChart3,
      color: "#00E5FF",
      desc: t(locale, "تقليل معدل التشتيت وزيادة وضوح الرسالة", "Reduced cognitive noise, sharper message clarity"),
    },
    {
      value: "< 3s",
      label: t(locale, "وقت التحميل الأول", "First contentful paint"),
      icon: Clock,
      color: "#22d3ee",
      desc: t(locale, "أداء متسق عبر الأجهزة المختلفة", "Consistent performance across all devices"),
    },
    {
      value: "100%",
      label: t(locale, "بناء مخصص", "Custom built"),
      icon: Check,
      color: "#D946EF",
      desc: t(locale, "لا قوالب جاهزة — كل سطر كود مقصود", "Zero templates — every line of code intentional"),
    },
    {
      value: "2x",
      label: t(locale, "انطباع أول أقوى", "First impression impact"),
      icon: TrendingUp,
      color: "#6366F1",
      desc: t(locale, "من موقع عادي إلى تجربة تُقنع من النظرة الأولى", "From average site to experience that convinces instantly"),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7 }}
      className="overflow-hidden rounded-[2.8rem] border"
      style={{
        background: isLight
          ? "linear-gradient(140deg, rgba(255,255,255,0.98), rgba(246,248,252,0.95))"
          : "linear-gradient(140deg, rgba(8,14,24,0.9), rgba(4,8,16,0.98))",
        borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="p-6 md:p-10">
        <div className="mb-8">
          <span className="eyebrow">{t(locale, "الأثر", "impact")}</span>
          <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">
            {t(locale, "أرقام تُثبت الأثر، لا مجرد شكل", "Numbers that prove impact, not just aesthetics")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground-muted">
            {t(locale,
              "النتيجة الحقيقية لا تُقاس بعدد الصفحات — تُقاس بمدى وضوح الرسالة وسرعة الثقة وقوة الانطباع.",
              "Real results aren't measured in page count — they're measured in message clarity, trust velocity, and impression strength."
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-[2rem] border p-6 transition-all hover:-translate-y-1"
              style={{
                borderColor: isLight ? "rgba(148,163,184,0.15)" : "rgba(255,255,255,0.07)",
                background: isLight ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.02)",
                boxShadow: `0 0 0 0 ${metric.color}22`,
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${metric.color}18`, border: `1px solid ${metric.color}30` }}
              >
                <metric.icon className="h-6 w-6" style={{ color: metric.color }} />
              </div>
              <div className="text-4xl font-black" style={{ color: metric.color }}>{metric.value}</div>
              <div className="mt-2 text-sm font-bold text-foreground">{metric.label}</div>
              <p className="mt-2 text-xs leading-6 text-foreground-muted">{metric.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ────────────────────────────────────────────────
   FEATURED PROJECT CARD  (large cinematic)
───────────────────────────────────────────────── */
function FeaturedProject({
  project,
  locale,
  isLight,
  reversed = false,
}: {
  project: SiteViewModel["projects"][number];
  locale: SiteViewModel["locale"];
  isLight: boolean;
  reversed?: boolean;
}) {
  const accent = accentStyles(project.accent, isLight);
  const BadgeIcon = deviceBadge(project, locale).icon;

  const rawGallery = project.gallery.length ? project.gallery : [];
  const gallery = rawGallery
    .filter((img, idx) => rawGallery.indexOf(img) === idx)
    .filter((img) => img !== project.image);

  // 3D Tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [0, 1], [4, -4]);
  const rotateY = useTransform(springX, [0, 1], [-4, 4]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
      className={cn(
        "group relative overflow-hidden rounded-[2.8rem] border p-1 shadow-2xl backdrop-blur-xl perspective-[1200px]",
        isLight ? "border-[rgba(148,163,184,0.2)]" : "border-border/60"
      )}
      style={{ rotateX, rotateY, background: isLight ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.03)" }}
    >
      {/* Accent glow overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-70"
        style={{
          background: `radial-gradient(circle at ${reversed ? "20%" : "85%"} 20%, ${accent.glow}, transparent 34%), radial-gradient(circle at ${reversed ? "90%" : "12%"} 100%, ${accent.glow}, transparent 30%)`,
        }}
      />

      <div className={cn("relative grid gap-6 p-6 md:p-10 xl:grid-cols-[0.95fr_1.05fr]", reversed && "xl:grid-cols-[1.05fr_0.95fr]")}>
        {/* ── LEFT / TEXT SIDE ── */}
        <div className={cn("space-y-6", reversed && "xl:order-2")}>
          {/* badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]"
              style={{
                borderColor: isLight ? `${accent.tint}30` : "rgba(255,255,255,0.08)",
                background: isLight ? `${accent.tint}0a` : "rgba(255,255,255,0.04)",
                color: accent.tint,
              }}
            >
              <Sparkles className="h-4 w-4" />
              {project.eyebrow}
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em]"
              style={{
                borderColor: isLight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.08)",
                background: isLight ? "rgba(241,245,249,0.8)" : "rgba(255,255,255,0.04)",
                color: isLight ? "#475569" : "var(--foreground-muted)",
              }}
            >
              <BadgeIcon className="h-4 w-4" />
              {deviceBadge(project, locale).label}
            </span>
          </div>

          {/* title + summary */}
          <div className="space-y-4">
            <h2 className="headline-arabic text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-6xl">{project.title}</h2>
            <p className="max-w-2xl text-base font-medium leading-relaxed text-foreground-muted sm:text-lg">{project.summary}</p>
          </div>

          {/* metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {project.metrics.map((metric) => (
              <div
                key={`${project.id}-${metric.label}`}
                className="rounded-[1.4rem] border p-3 shadow-sm transition-colors md:rounded-[2rem] md:p-5"
                style={{
                  borderColor: isLight ? "rgba(148,163,184,0.18)" : "rgba(255,255,255,0.08)",
                  background: isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-base font-black sm:text-lg md:text-2xl" style={{ color: accent.tint }}>{metric.value}</div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-foreground-soft sm:text-[10px] md:text-xs">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
            {[
              { title: t(locale, "التحدي", "Challenge"), body: project.challenge },
              { title: t(locale, "القرار", "Decision"), body: project.solution },
              { title: t(locale, "الأثر", "Outcome"), body: project.result },
            ].map((block) => (
              <div
                key={block.title}
                className="rounded-[1.8rem] border p-4 shadow-sm backdrop-blur-md sm:p-5"
                style={{
                  borderColor: isLight ? "rgba(148,163,184,0.18)" : "rgba(255,255,255,0.08)",
                  background: isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: accent.tint }}>{block.title}</div>
                <p className="mt-3 text-sm font-medium leading-[1.8] text-foreground-muted sm:mt-4">{block.body}</p>
              </div>
            ))}
          </div>

          {/* tags */}
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: accent.glow, color: accent.tint, background: accent.badge }}>
                {tag}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            {project.href ? (
              <Link
                href={project.href}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${accent.tint}, ${accent.tint}cc)` }}
              >
                <ExternalLink className="h-4 w-4" />
                {project.ctaLabel}
              </Link>
            ) : null}
            {project.repoUrl ? (
              <Link href={project.repoUrl} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-foreground">
                <ExternalLink className="h-4 w-4" />
                GitHub
              </Link>
            ) : null}
          </div>
        </div>

        {/* ── RIGHT / VISUAL SIDE ── */}
        <div className={cn("relative flex min-h-[360px] flex-col gap-4 w-full h-full", reversed && "xl:order-1")}>
          {/* Main image */}
          <motion.div
            whileHover={{ rotateX: 4, rotateY: reversed ? 6 : -6, scale: 1.01 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "relative flex-1 w-full overflow-hidden rounded-[2.1rem] border p-3 shadow-[0_25px_70px_rgba(2,6,23,0.35)]",
              project.deviceFrame === "phone" ? "mx-auto max-w-[340px]" : ""
            )}
            style={{ borderColor: accent.glow, background: isLight ? "rgba(255,255,255,0.72)" : "rgba(6,10,18,0.88)" }}
          >
            <div
              className={cn("absolute inset-0", project.deviceFrame === "phone" ? "rounded-[2.1rem] border-[10px]" : "rounded-[1.6rem] border-[1px]")}
              style={{ borderColor: project.deviceFrame === "phone" ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.08)" }}
            />
            <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-[1.4rem]">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/14 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: accent.tint }}>
                      {localizeHighlightStyle(locale, project.highlightStyle)}
                    </div>
                    <div className="mt-2 text-lg font-black text-white">{project.title}</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                    {project.deviceFrame === "phone" ? <Smartphone className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {gallery.slice(0, 3).map((image, index) => (
                <div
                  key={`${project.id}-gallery-${index}`}
                  className="relative aspect-[1.05/0.9] overflow-hidden rounded-[1.35rem] border"
                  style={{
                    borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
                    background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <Image
                    src={image}
                    alt={`${project.title} ${index + 1}`}
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="(max-width: 1024px) 33vw, 14vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────
   WEATHER WIDGET
───────────────────────────────────────────────── */
function WeatherWidget({
  weather,
  locale,
  isLight,
}: {
  weather: SiteViewModel["live"]["weather"];
  locale: SiteViewModel["locale"];
  isLight: boolean;
}) {
  if (!weather) {
    return (
      <div
        className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[2.4rem] border"
        style={{
          background: isLight ? "rgba(255,255,255,0.9)" : "linear-gradient(160deg, rgba(5,10,18,0.88), rgba(4,7,16,0.97))",
          borderColor: isLight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="text-center">
          <Sun className="mx-auto h-12 w-12 text-amber-300 opacity-40" />
          <p className="mt-4 text-sm text-foreground-muted">{t(locale, "جارٍ تحميل الطقس...", "Loading weather...")}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[2.4rem] border p-5 md:p-6"
      style={{
        background: isLight
          ? "linear-gradient(160deg, rgba(241,245,249,0.98), rgba(255,255,255,0.96))"
          : "linear-gradient(160deg, rgba(5,10,18,0.88), rgba(4,7,16,0.97))",
        borderColor: isLight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.08)",
        boxShadow: isLight ? "0 25px 70px rgba(15,23,42,0.08)" : "0 28px 80px rgba(2,6,23,0.5)",
      }}
    >
      <WeatherScene condition={weather.condition} isDay={weather.isDay} isLight={isLight} />
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">{t(locale, "طقس حي", "live weather")}</span>
            <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
              {t(locale, "طقس حي مرتبط بموقعك", "Live weather from your location")}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
                style={{
                  borderColor: isLight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.1)",
                  background: isLight ? "rgba(241,245,249,0.8)" : "rgba(255,255,255,0.1)",
                  color: isLight ? "#334155" : "var(--foreground-muted)",
                }}
              >
                {weather.isDay ? t(locale, "نهاري", "Day mode") : t(locale, "ليلي", "Night mode")}
              </span>
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
                style={{
                  borderColor: isLight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.1)",
                  background: isLight ? "rgba(241,245,249,0.8)" : "rgba(255,255,255,0.1)",
                  color: isLight ? "#334155" : "var(--foreground-muted)",
                }}
              >
                {localizeWeatherCondition(locale, weather.condition)}
              </span>
            </div>
          </div>
          <WeatherGlyph condition={weather.condition} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Globe className="h-4 w-4 text-cyan-400" />
              {weather.city}, {weather.country}
            </div>
            <div className="mt-2 text-6xl font-black text-foreground">{weather.temp}°</div>
            <div className="mt-2 text-base text-foreground-muted">{localizeWeatherCondition(locale, weather.condition)}</div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-[280px]">
            {[
              { icon: Sparkles, label: t(locale, "المحسوسة", "Feels like"), value: `${weather.feelsLike}°` },
              { icon: Droplets, label: t(locale, "الرطوبة", "Humidity"), value: `${weather.humidity}%` },
              { icon: Wind, label: t(locale, "الرياح", "Wind"), value: `${weather.wind} m/s` },
              { icon: Gauge, label: t(locale, "الضغط", "Pressure"), value: `${weather.pressure} hPa` },
              { icon: Sunrise, label: t(locale, "الشروق", "Sunrise"), value: weather.sunrise },
              { icon: Sunset, label: t(locale, "الغروب", "Sunset"), value: weather.sunset },
            ].map((detail) => (
              <div
                key={detail.label}
                className="rounded-[1.35rem] border p-3"
                style={{
                  background: isLight ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.04)",
                  borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground-muted">
                  <detail.icon className="h-4 w-4 text-cyan-400" />
                  {detail.label}
                </div>
                <div className="mt-2 text-lg font-black text-foreground">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────
   MATCHES WIDGET
───────────────────────────────────────────────── */
function MatchesWidget({
  matches,
  locale,
  isLight,
}: {
  matches: SiteViewModel["live"]["matches"];
  locale: SiteViewModel["locale"];
  isLight: boolean;
}) {
  const hasRealMatches = matches.length > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative overflow-hidden rounded-[2.4rem] border p-5 md:p-6"
      style={{
        background: isLight ? "linear-gradient(160deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))" : "linear-gradient(160deg, rgba(7,10,18,0.88), rgba(3,7,14,0.98))",
        borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.08)",
        boxShadow: isLight ? "0 20px 60px rgba(15,23,42,0.06)" : "none",
      }}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: isLight
            ? "radial-gradient(circle at top right, rgba(255,107,0,0.06), transparent 30%), radial-gradient(circle at bottom left, rgba(168,85,247,0.05), transparent 36%)"
            : "radial-gradient(circle at top right, rgba(255,107,0,0.18), transparent 30%), radial-gradient(circle at bottom left, rgba(168,85,247,0.16), transparent 36%)",
        }}
      />
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">{t(locale, "مباريات حية", "live matches")}</span>
            <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
              {t(locale, "مباريات حية من أهم الدوريات", "Live fixtures from top leagues")}
            </h2>
            {!hasRealMatches && (
              <p
                className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold"
                style={{
                  borderColor: isLight ? "rgba(148,163,184,0.25)" : "rgba(255,255,255,0.1)",
                  background: isLight ? "rgba(241,245,249,0.8)" : "rgba(255,255,255,0.05)",
                  color: isLight ? "#475569" : "var(--foreground-muted)",
                }}
              >
                {t(locale, "نموذج عرض — بيانات حية عند توفر API", "Preview mode — live data when API connected")}
              </p>
            )}
          </div>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border"
            style={{
              borderColor: isLight ? "rgba(255,107,0,0.2)" : "rgba(255,255,255,0.1)",
              background: isLight ? "rgba(255,107,0,0.08)" : "rgba(255,255,255,0.1)",
              color: "#6366F1",
            }}
          >
            <Trophy className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-3">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              whileHover={{ x: locale === "ar" ? -4 : 4 }}
              className="rounded-[1.65rem] border p-4"
              style={{
                background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.03)",
                borderColor: index === 0 ? "rgba(255,107,0,0.32)" : isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
                boxShadow: index === 0 ? "0 22px 55px rgba(255,107,0,0.12)" : "none",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{match.league}</div>
                <div
                  className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]"
                  style={{
                    background: match.status === "LIVE" || match.status === "HT" ? "rgba(255,107,0,0.14)" : isLight ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.14)",
                    color: match.status === "LIVE" || match.status === "HT" ? "#6366F1" : "var(--foreground-muted)",
                  }}
                >
                  {match.status} · {match.time}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border p-1 sm:h-12 sm:w-12 sm:rounded-2xl"
                    style={{
                      borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.1)",
                      background: isLight ? "rgba(241,245,249,0.8)" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.homeLogo} alt={match.homeTeam} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-foreground sm:text-sm">{match.homeTeam}</div>
                    <div className="text-[10px] text-foreground-muted sm:text-xs">{t(locale, "مضيف", "Home")}</div>
                  </div>
                </div>

                <div
                  className="rounded-xl border px-3 py-2 text-center sm:rounded-[1.35rem] sm:px-4 sm:py-3"
                  style={{
                    borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.1)",
                    background: isLight ? "rgba(241,245,249,0.6)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="text-xl font-black text-foreground sm:text-2xl">
                    {match.homeScore ?? "–"} : {match.awayScore ?? "–"}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-3">
                  <div className="min-w-0 text-end">
                    <div className="truncate text-xs font-black text-foreground sm:text-sm">{match.awayTeam}</div>
                    <div className="text-[10px] text-foreground-muted sm:text-xs">{t(locale, "ضيف", "Away")}</div>
                  </div>
                  <div
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border p-1 sm:h-12 sm:w-12 sm:rounded-2xl"
                    style={{
                      borderColor: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.1)",
                      background: isLight ? "rgba(241,245,249,0.8)" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.awayLogo} alt={match.awayTeam} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────
   GRID CARD (rest projects)
───────────────────────────────────────────────── */
function GridProjectCard({
  project,
  locale,
  isLight,
}: {
  project: SiteViewModel["projects"][number];
  locale: SiteViewModel["locale"];
  isLight: boolean;
}) {
  const accent = accentStyles(project.accent, isLight);
  return (
    <motion.article
      whileHover={{ y: -6 }}
      className="overflow-hidden rounded-[1.9rem] border transition-all duration-300"
      style={{
        background: isLight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.03)",
        borderColor: isLight ? "rgba(148,163,184,0.18)" : "rgba(255,255,255,0.08)",
        boxShadow: isLight ? "0 20px 55px rgba(15,23,42,0.06)" : `0 20px 55px ${accent.glow}`,
      }}
    >
      <div className="relative aspect-[1.28/0.92] overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover transition duration-700 hover:scale-[1.04]"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: accent.tint }}>{project.eyebrow}</div>
          <div className="mt-2 text-xl font-black text-white">{project.title}</div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm leading-7 text-foreground-muted">{project.summary}</p>
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: accent.badge, color: accent.tint }}>
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {project.href ? (
            <Link
              href={project.href}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-black transition hover:opacity-90"
              style={{ background: accent.tint }}
            >
              <ArrowUpRight className="h-4 w-4" />
              {project.ctaLabel}
            </Link>
          ) : null}
          {project.repoUrl ? (
            <Link
              href={project.repoUrl}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </Link>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────
   CONVERSION CTA
───────────────────────────────────────────────── */
function ConversionCta({ locale, isLight }: { locale: SiteViewModel["locale"]; isLight: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="relative overflow-hidden rounded-[2.8rem] border p-8 text-center md:p-16"
      style={{
        background: isLight ? "rgba(255,255,255,0.96)" : "linear-gradient(140deg, rgba(4,8,16,0.95), rgba(8,14,24,0.98))",
        borderColor: "rgba(0,229,255,0.2)",
        boxShadow: "0 0 80px rgba(0,229,255,0.06)",
      }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle, #00E5FF, transparent 70%)" }} />
      </div>

      <div className="relative z-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-primary/20 bg-primary/10">
          <Zap className="h-10 w-10" style={{ color: "#00E5FF" }} />
        </div>
        <h2 className="headline-arabic mx-auto max-w-2xl text-3xl font-black text-foreground md:text-5xl">
          {t(locale, "فكرتك تستحق حضوراً يُقنع من أول ثانية.", "Your idea deserves a presence that converts from second one.")}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-foreground-muted">
          {t(locale,
            "لا أبني مواقع جميلة فحسب. أبني أنظمة تجعل الزائر يثق، يفهم، ويتصرف دون تردد.",
            "I don't just build beautiful websites. I build systems that make visitors trust, understand, and act without hesitation."
          )}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/contact`}
            className="cta-green-btn inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black transition hover:-translate-y-1"
          >
            <ArrowUpRight className="h-4 w-4" />
            {t(locale, "ابدأ مشروعك الآن", "Start your project now")}
          </Link>
          <Link
            href={`/${locale}/cv`}
            className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-sm font-bold text-foreground transition hover:-translate-y-0.5"
          >
            {t(locale, "اطلع على خبرتي", "See my background")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          {[
            { icon: Star, text: t(locale, "جودة تستحق الوقت", "Quality worth the wait") },
            { icon: Check, text: t(locale, "لا قوالب جاهزة", "Zero templates") },
            { icon: Zap, text: t(locale, "رد خلال 24 ساعة", "Reply within 24h") },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-foreground-muted">
              <item.icon className="h-4 w-4 hero-accent-green" />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────── */
export function ProjectsProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  const { theme } = useThemeMode();
  const prefersReducedMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLight = mounted && theme === "light";

  // ── Featured projects (top 3, sorted by rank)
  const featuredProjects = useMemo(() => {
    const featured = model.projects
      .filter((p) => p.featured)
      .sort((a, b) => a.featuredRank - b.featuredRank)
      .slice(0, 3);
    if (featured.length >= 3) return featured;
    return [
      ...featured,
      ...model.projects.filter((p) => !featured.some((f) => f.id === p.id)),
    ].slice(0, 3);
  }, [model.projects]);

  // ── Rest projects (not featured)
  const restProjects = useMemo(
    () => model.projects.filter((p) => !featuredProjects.some((f) => f.id === p.id)),
    [featuredProjects, model.projects],
  );

  const weather = model.live.weather;
  const matches = model.live.matches;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.12 },
    },
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 28 },
    show: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0.1 : 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden transition-opacity duration-500"
      style={{ opacity: mounted ? 1 : 0 }}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-testid="projects-page"
    >
      <div className="section-frame relative z-10 w-full max-w-[1420px] space-y-8 pb-28">

        {/* ── 1. CINEMATIC HERO */}
        <CinematicHero locale={locale} isLight={isLight} projects={model.projects} />

        {/* ── 2. LOGO SHOWCASE */}
        <LogoShowcase locale={locale} isLight={isLight} />

        {/* ── 3. FEATURED PROJECTS */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <span className="eyebrow">{t(locale, "المشاريع الرئيسية", "featured projects")}</span>
            <div className="h-px flex-1" style={{ background: isLight ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.06)" }} />
          </div>
          {featuredProjects.map((project, index) => (
            <FeaturedProject
              key={project.id}
              project={project}
              locale={locale}
              isLight={isLight}
              reversed={index % 2 === 1}
            />
          ))}
        </section>

        {/* ── 4. IMPACT METRICS */}
        <ImpactSection locale={locale} isLight={isLight} />

        {/* ── 5. LIVE WIDGETS (weather + matches) */}
        <motion.section
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
        >
          <motion.div variants={itemVariant}>
            <WeatherWidget weather={weather} locale={locale} isLight={isLight} />
          </motion.div>
          <motion.div variants={itemVariant}>
            <MatchesWidget matches={matches} locale={locale} isLight={isLight} />
          </motion.div>
        </motion.section>

        {/* ── 6. REST PROJECTS GRID */}
        {restProjects.length > 0 && (
          <motion.section
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="overflow-hidden rounded-[2.5rem] border p-5 md:p-7"
            style={{
              background: isLight
                ? "linear-gradient(160deg, rgba(255,255,255,0.84), rgba(246,248,252,0.98))"
                : "linear-gradient(160deg, rgba(7,10,18,0.88), rgba(4,7,14,0.97))",
              borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-6">
              <span className="eyebrow">{t(locale, "مشاريع إضافية", "more projects")}</span>
              <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">
                {t(locale, "مشاريع إضافية بنفس مستوى الاهتمام", "Additional projects with the same attention level")}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {restProjects.map((project) => (
                <motion.div key={project.id} variants={itemVariant}>
                  <GridProjectCard project={project} locale={locale} isLight={isLight} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── 7. CONVERSION CTA */}
        <ConversionCta locale={locale} isLight={isLight} />
      </div>
    </div>
  );
}
