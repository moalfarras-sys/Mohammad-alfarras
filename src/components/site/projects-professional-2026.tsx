"use client";

import { motion, type Variants } from "framer-motion";
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
} from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

import { useThemeMode } from "@/components/layout/use-theme-mode";
import { cn } from "@/lib/cn";

import type { SiteViewModel } from "./site-view-client";

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

function t(locale: SiteViewModel["locale"], ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function localizeWeatherCondition(locale: SiteViewModel["locale"], condition?: string | null) {
  switch (condition) {
    case "Clear":
      return t(locale, "سماء صافية", "Clear sky");
    case "Clouds":
      return t(locale, "غيوم", "Clouds");
    case "Rain":
      return t(locale, "مطر", "Rain");
    case "Drizzle":
      return t(locale, "رذاذ", "Drizzle");
    case "Thunderstorm":
      return t(locale, "عاصفة رعدية", "Thunderstorm");
    case "Snow":
      return t(locale, "ثلوج", "Snow");
    case "Mist":
      return t(locale, "ضباب", "Mist");
    default:
      return condition ?? t(locale, "الطقس المباشر", "Live weather");
  }
}

function localizeHighlightStyle(
  locale: SiteViewModel["locale"],
  style: SiteViewModel["projects"][number]["highlightStyle"],
) {
  switch (style) {
    case "operations":
      return t(locale, "تشغيل / عمليات", "Operations");
    case "trust":
      return t(locale, "ثقة / تحويل", "Trust / Conversion");
    case "app":
      return t(locale, "تجربة تطبيق", "App Experience");
    default:
      return t(locale, "دراسة حالة", "Case Study");
  }
}

function WeatherGlyph({ condition }: { condition?: string | null }) {
  switch (condition) {
    case "Clouds":
      return <Cloud className="h-16 w-16 text-slate-300 drop-shadow-[0_0_30px_rgba(148,163,184,0.4)]" />;
    case "Rain":
      return <CloudRain className="h-16 w-16 text-cyan-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]" />;
    case "Drizzle":
      return <CloudDrizzle className="h-16 w-16 text-cyan-300 drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]" />;
    case "Thunderstorm":
      return <CloudLightning className="h-16 w-16 text-violet-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]" />;
    case "Snow":
      return <CloudSnow className="h-16 w-16 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.55)]" />;
    case "Mist":
      return <CloudFog className="h-16 w-16 text-slate-300 drop-shadow-[0_0_30px_rgba(203,213,225,0.32)]" />;
    default:
      return <Sun className="h-16 w-16 text-amber-300 drop-shadow-[0_0_40px_rgba(253,224,71,0.42)]" />;
  }
}

function WeatherScene({ condition, isDay }: { condition: string; isDay: boolean }) {
  const isRain = condition === "Rain" || condition === "Drizzle";
  const isThunder = condition === "Thunderstorm";
  const isSnow = condition === "Snow";
  const isClear = condition === "Clear";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      <div
        className="absolute inset-0"
        style={{
          background: isDay
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

function accentStyles(accent: SiteViewModel["projects"][number]["accent"], isLight: boolean) {
  if (accent === "orange") {
    return { tint: "#ff6b00", glow: "rgba(255,107,0,0.25)", badge: isLight ? "rgba(255,107,0,0.08)" : "rgba(255,107,0,0.14)" };
  }
  if (accent === "cyan") {
    return { tint: "#22d3ee", glow: "rgba(34,211,238,0.25)", badge: isLight ? "rgba(34,211,238,0.08)" : "rgba(34,211,238,0.14)" };
  }
  if (accent === "purple") {
    return { tint: "#a855f7", glow: "rgba(168,85,247,0.24)", badge: isLight ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.14)" };
  }
  return { tint: "#00ff87", glow: "rgba(0,255,135,0.25)", badge: isLight ? "rgba(0,184,90,0.08)" : "rgba(0,255,135,0.14)" };
}

function deviceBadge(project: SiteViewModel["projects"][number], locale: SiteViewModel["locale"]) {
  switch (project.deviceFrame) {
    case "phone":
      return { icon: Smartphone, label: t(locale, "عرض تطبيق", "App framing") };
    case "floating":
      return { icon: Sparkles, label: t(locale, "عرض سينمائي", "Floating showcase") };
    default:
      return { icon: Globe, label: t(locale, "عرض متصفح", "Browser framing") };
  }
}

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
  const gallery = project.gallery.length ? project.gallery : [project.image];

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ 
        rotateY: reversed ? 2 : -2, 
        rotateX: -1,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      className="group relative overflow-hidden rounded-[2.8rem] border border-border/60 bg-surface/50 p-1 shadow-2xl backdrop-blur-xl perspective-[1200px]"
    >
      <div className="absolute inset-0 opacity-40 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-70" 
           style={{ background: `radial-gradient(circle at ${reversed ? "20%" : "85%"} 20%, ${accent.glow}, transparent 34%), radial-gradient(circle at ${reversed ? "90%" : "12%"} 100%, ${accent.glow}, transparent 30%)` }} />

      <div className={cn("relative grid gap-6 p-6 md:p-10 xl:grid-cols-[0.95fr_1.05fr]", reversed && "xl:grid-cols-[1.05fr_0.95fr]")}>
        <div className={cn("space-y-6", reversed && "xl:order-2")}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: accent.tint }}>
              <Sparkles className="h-4 w-4" />
              {project.eyebrow}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-foreground-muted">
              <BadgeIcon className="h-4 w-4" />
              {deviceBadge(project, locale).label}
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="headline-arabic text-4xl font-black leading-tight text-foreground md:text-6xl">{project.title}</h2>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-foreground-muted">{project.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {project.metrics.map((metric) => (
              <div key={`${project.id}-${metric.label}`} className="rounded-[2rem] border border-border/40 bg-surface/60 p-5 shadow-sm transition-colors hover:bg-surface/80">
                <div className="text-2xl font-black" style={{ color: accent.tint }}>{metric.value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-foreground-soft">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: t(locale, "التحدي", "Challenge"), body: project.challenge },
              { title: t(locale, "القرار", "Decision"), body: project.solution },
              { title: t(locale, "الأثر", "Outcome"), body: project.result },
            ].map((block) => (
              <div key={block.title} className="rounded-[1.8rem] border border-border/40 bg-surface/50 p-5 shadow-sm backdrop-blur-md">
                <div className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: accent.tint }}>{block.title}</div>
                <p className="mt-4 text-sm font-medium leading-[1.8] text-foreground-muted">{block.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: accent.glow, color: accent.tint, background: accent.badge }}>
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {project.href ? (
              <Link href={project.href} target="_blank" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${accent.tint}, ${accent.tint}cc)` }}>
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

        <div className={cn("relative flex min-h-[360px] flex-col gap-4", reversed && "xl:order-1")}>
          <motion.div whileHover={{ rotateX: 4, rotateY: reversed ? 6 : -6, scale: 1.01 }} transition={{ duration: 0.35 }} className={cn("relative flex-1 overflow-hidden rounded-[2.1rem] border p-3 shadow-[0_25px_70px_rgba(2,6,23,0.35)]", project.deviceFrame === "phone" ? "mx-auto max-w-[340px]" : "")} style={{ borderColor: accent.glow, background: isLight ? "rgba(255,255,255,0.72)" : "rgba(6,10,18,0.88)" }}>
            <div className={cn("absolute inset-0", project.deviceFrame === "phone" ? "rounded-[2.1rem] border-[10px]" : "rounded-[1.6rem] border-[1px]")} style={{ borderColor: project.deviceFrame === "phone" ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.08)" }} />
            <div className="relative h-full overflow-hidden rounded-[1.4rem]">
              <Image src={project.image} alt={project.title} fill className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="(max-width: 1024px) 100vw, 40vw" />
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

          <div className="grid grid-cols-3 gap-3">
            {gallery.slice(0, 3).map((image, index) => (
              <div key={`${project.id}-gallery-${index}`} className="relative aspect-[1.05/0.9] overflow-hidden rounded-[1.35rem] border" style={{ borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)", background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.03)" }}>
                <Image src={image} alt={`${project.title} ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 33vw, 14vw" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function ProjectsProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  const { theme } = useThemeMode();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLight = mounted && theme === "light";

  const featuredProjects = useMemo(() => {
    const featured = model.projects.filter((project) => project.featured).sort((a, b) => a.featuredRank - b.featuredRank).slice(0, 3);
    if (featured.length === 3) return featured;
    return [...featured, ...model.projects.filter((project) => !featured.some((item) => item.id === project.id))].slice(0, 3);
  }, [model.projects]);

  const restProjects = useMemo(
    () => model.projects.filter((project) => !featuredProjects.some((item) => item.id === project.id)),
    [featuredProjects, model.projects],
  );

  const weather = model.live.weather;
  const matches = model.live.matches;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="relative min-h-screen overflow-hidden py-28 md:py-32" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="projects-page">
      {/* Background is handled by Global Atmospheric Engine */}
      
      <div className="section-frame relative z-10 w-full max-w-[1420px] space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2.8rem] border px-6 py-8 md:px-10 md:py-12"
          style={{
            background: isLight
              ? "rgba(255,255,255,0.96)"
              : "linear-gradient(140deg, rgba(8,12,20,0.78), rgba(4,6,10,0.94))",
            borderColor: isLight ? "rgba(148,163,184,0.3)" : "rgba(255,255,255,0.08)",
            boxShadow: isLight ? "0 25px 80px rgba(15,23,42,0.08)" : "0 32px 90px rgba(0,0,0,0.45)",
          }}
        >
          <div className="absolute inset-y-0 left-0 w-[45%] bg-[radial-gradient(circle_at_center,rgba(0,255,135,0.16),transparent_58%)] opacity-60" />
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div className="space-y-5">
              <span className="eyebrow">{t(locale, "صفحة أعمال حية مرتبطة بالموقع", "A live projects showcase connected to the site")}</span>
              <h1 className="headline-arabic max-w-5xl text-4xl font-black leading-[0.94] text-foreground md:text-6xl xl:text-[5.5rem]">
                {t(locale, "مشاريع مبنية لتقود الانطباع، الثقة، والقرار من أول شاشة.", "Projects built to control impression, trust, and decision from the first screen.")}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-foreground-muted md:text-lg">
                {t(
                  locale,
                  "هذه ليست مجرد قائمة أعمال. هذا عرض حي يشرح كيف تتحول الفكرة إلى واجهة أوضح، تموضع أقوى، وتجربة تشعر المستخدم أن المشروع فعلاً يعرف ماذا يريد.",
                  "This is not a simple portfolio list. It is a live execution layer showing how the idea becomes stronger positioning, cleaner interface logic, and a sharper commercial impression.",
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {featuredProjects.map((project) => (
                  <span
                    key={`hero-${project.id}`}
                    className="rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]"
                    style={{
                      borderColor: accentStyles(project.accent, isLight).glow,
                      color: accentStyles(project.accent, isLight).tint,
                      background: accentStyles(project.accent, isLight).badge,
                    }}
                  >
                    {project.title}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/${locale}/contact`} className="button-primary-shell">
                  <ArrowUpRight className="h-4 w-4" />
                  {t(locale, "ابدأ مشروعك", "Start your project")}
                </Link>
                <Link href={`/${locale}/admin/projects`} className="button-secondary-shell">
                  <Sparkles className="h-4 w-4" />
                  {t(locale, "Projects Studio", "Projects Studio")}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: `${model.projects.length}`, label: t(locale, "مشاريع منشورة", "Published projects"), tint: "var(--primary)" },
                { value: "3", label: t(locale, "منطقة flagship", "Flagship slots"), tint: "var(--secondary)" },
                { value: "Live", label: t(locale, "طقس ومباريات", "Weather + matches"), tint: "var(--accent)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.7rem] border p-4"
                  style={{
                    borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
                    background: isLight ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="text-3xl font-black" style={{ color: stat.tint }}>{stat.value}</div>
                  <div className="mt-2 text-sm leading-7 text-foreground-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="space-y-8">
          {featuredProjects.map((project, index) => (
            <FeaturedProject key={project.id} project={project} locale={locale} isLight={isLight} reversed={index % 2 === 1} />
          ))}
        </section>

        <motion.section variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          {weather ? (
            <motion.article
              variants={item}
              className="relative overflow-hidden rounded-[2.4rem] border p-5 md:p-6"
              style={{
                background: isLight ? "rgba(255,255,255,0.96)" : "linear-gradient(160deg, rgba(5,10,18,0.88), rgba(4,7,16,0.97))",
                borderColor: isLight ? "rgba(148,163,184,0.3)" : "rgba(255,255,255,0.08)",
                boxShadow: isLight ? "0 25px 70px rgba(15,23,42,0.06)" : "0 28px 80px rgba(2,6,23,0.5)",
              }}
            >
              <WeatherScene condition={weather.condition} isDay={weather.isDay} />
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="eyebrow">{t(locale, "HTC weather deck", "HTC weather deck")}</span>
                    <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">
                      {t(locale, "طبقة طقس حية مرتبطة بالموقع", "A live weather layer inside the site")}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground-muted">
                        {weather.isDay ? t(locale, "نهاري", "Day mode") : t(locale, "ليلي", "Night mode")}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground-muted">
                        {localizeWeatherCondition(locale, weather.condition)}
                      </span>
                    </div>
                  </div>
                  <WeatherGlyph condition={weather.condition} />
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-foreground-muted">
                      <Globe className="h-4 w-4 text-[var(--primary)]" />
                      {weather.city}, {weather.country}
                    </div>
                    <div className="mt-2 text-6xl font-black text-foreground">{weather.temp}°</div>
                    <div className="mt-2 text-base text-foreground-muted">{localizeWeatherCondition(locale, weather.condition)}</div>
                  </div>
                  <div className="grid min-w-[220px] grid-cols-2 gap-3">
                    {[
                      { icon: Sparkles, label: t(locale, "المحسوسة", "Feels like"), value: `${weather.feelsLike}°` },
                      { icon: Droplets, label: t(locale, "الرطوبة", "Humidity"), value: `${weather.humidity}%` },
                      { icon: Wind, label: t(locale, "الرياح", "Wind"), value: `${weather.wind} m/s` },
                      { icon: Gauge, label: t(locale, "الضغط", "Pressure"), value: `${weather.pressure} hPa` },
                      { icon: Sunrise, label: t(locale, "الشروق", "Sunrise"), value: weather.sunrise },
                      { icon: Sunset, label: t(locale, "الغروب", "Sunset"), value: weather.sunset },
                    ].map((detail) => (
                      <div key={detail.label} className="rounded-[1.35rem] border p-3" style={{ background: isLight ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.04)", borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground-muted">
                          <detail.icon className="h-4 w-4 text-[var(--cyan)]" />
                          {detail.label}
                        </div>
                        <div className="mt-2 text-lg font-black text-foreground">{detail.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ) : null}

          <motion.article
            variants={item}
            className="relative overflow-hidden rounded-[2.4rem] border p-5 md:p-6"
            style={{
              background: isLight ? "linear-gradient(160deg, rgba(255,255,255,0.9), rgba(246,248,252,0.98))" : "linear-gradient(160deg, rgba(7,10,18,0.88), rgba(3,7,14,0.98))",
              borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,107,0,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_36%)] opacity-80" />
            <div className="relative z-10 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="eyebrow">{t(locale, "طبقة المباريات", "matches layer")}</span>
                    <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">
                      {t(locale, "مباريات حية بأولوية الدوريات الكبيرة", "Live football cards prioritising top leagues")}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-foreground-muted">
                      {t(
                        locale,
                        "الترتيب يبدأ بالمباشر ثم أهم الدوريات في اليوم نفسه، حتى تشعر الصفحة أنها حيّة وليست مجرد معرض صور.",
                        "Ranking starts with live fixtures and then the strongest leagues of the day, so the page feels connected rather than decorative.",
                      )}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[var(--secondary)]">
                    <Trophy className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-3">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    whileHover={{ x: locale === "ar" ? -4 : 4, rotateX: 2, rotateY: locale === "ar" ? -3 : 3 }}
                    className="rounded-[1.65rem] border p-4"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.03)",
                      borderColor: index === 0 ? "rgba(255,107,0,0.32)" : isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
                      boxShadow: index === 0 ? "0 22px 55px rgba(255,107,0,0.12)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-foreground-muted">{match.league}</div>
                      <div className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]" style={{ background: match.status === "LIVE" || match.status === "HT" ? "rgba(255,107,0,0.14)" : "rgba(148,163,184,0.14)", color: match.status === "LIVE" || match.status === "HT" ? "#ff6b00" : "var(--foreground-muted)" }}>
                        {match.status} · {match.time}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={match.homeLogo} alt={match.homeTeam} className="h-full w-full object-contain p-2" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-foreground">{match.homeTeam}</div>
                          <div className="text-xs text-foreground-muted">{t(locale, "مضيف", "Home")}</div>
                        </div>
                      </div>

                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-center">
                        <div className="text-2xl font-black text-foreground">
                          {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <div className="min-w-0 text-end">
                          <div className="truncate text-sm font-black text-foreground">{match.awayTeam}</div>
                          <div className="text-xs text-foreground-muted">{t(locale, "ضيف", "Away")}</div>
                        </div>
                        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={match.awayLogo} alt={match.awayTeam} className="h-full w-full object-contain p-2" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.article>
        </motion.section>

        {restProjects.length ? (
          <motion.section
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-[2.5rem] border p-5 md:p-7"
            style={{
              background: isLight ? "linear-gradient(160deg, rgba(255,255,255,0.84), rgba(246,248,252,0.98))" : "linear-gradient(160deg, rgba(7,10,18,0.88), rgba(4,7,14,0.97))",
              borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
            }}
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">{t(locale, "grid layer", "grid layer")}</span>
                <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">
                  {t(locale, "مشاريع إضافية تتحدث بنفس الهوية", "Additional projects speaking the same visual language")}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-foreground-muted">
                {t(locale, "أي مشروع جديد من الأدمن يظهر هنا مباشرة إذا لم يكن ضمن منطقة الـ flagship.", "Any new project from the admin panel lands here automatically if it is not part of the flagship area.")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {restProjects.map((project) => {
                const accent = accentStyles(project.accent, isLight);
                return (
                  <motion.article
                    key={project.id}
                    variants={item}
                    whileHover={{ y: -6, rotateX: 2, rotateY: 2 }}
                    className="overflow-hidden rounded-[1.9rem] border"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.03)",
                      borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
                      boxShadow: `0 20px 55px ${accent.glow}`,
                    }}
                  >
                    <div className="relative aspect-[1.28/0.92] overflow-hidden">
                      <Image src={project.image} alt={project.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
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
                          <Link href={project.href} target="_blank" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-black" style={{ background: accent.tint }}>
                            <ArrowUpRight className="h-4 w-4" />
                            {project.ctaLabel}
                          </Link>
                        ) : null}
                        {project.repoUrl ? (
                          <Link href={project.repoUrl} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-foreground">
                            <ExternalLink className="h-4 w-4" />
                            GitHub
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.section>
        ) : null}

        <section className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: t(locale, "صفحة تعيش فوق الـ CMS", "A page powered by the CMS, not hardcoded blocks"),
              body: t(locale, "الـ flagship والمشاريع الإضافية يأتون الآن من نفس طبقة الإدارة، لذلك أي تعديل أو صورة جديدة ينعكس مباشرة في الصفحة.", "The flagship section and the additional grid now read from the same admin-backed data layer, so every change or new image appears immediately."),
            },
            {
              icon: Globe,
              title: t(locale, "بيانات حية تضيف إحساساً حقيقياً", "Live data that adds a real-time layer"),
              body: t(locale, "الطقس والمباريات ليسا مجرد ديكور. هما طبقة إحساس حي تعطي الصفحة نبضاً فعلياً وتؤكد أن النظام متصل بالعالم الحقيقي.", "Weather and football are not decorative. They create a live layer that gives the page a real pulse and proves the system is connected."),
            },
            {
              icon: Trophy,
              title: t(locale, "هوية واحدة من البطاقة إلى الـ CTA", "One identity from hero to CTA"),
              body: t(locale, "تم ضبط الصفحة لتكون الأقوى بصرياً في الموقع من دون كسر الثيم الحالي: نفس الروح، لكن بعرض أوضح، أقوى، وأكثر إقناعاً.", "The page is tuned to be the strongest visual showcase in the site without breaking the current theme: same spirit, but clearer, bolder, and more persuasive."),
            },
          ].map((block) => (
            <div
              key={block.title}
              className="rounded-[2rem] border p-5"
              style={{
                background: isLight ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.03)",
                borderColor: isLight ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(0,255,135,0.1)] text-[var(--primary)]">
                <block.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-black text-foreground">{block.title}</h3>
              <p className="mt-3 text-sm leading-7 text-foreground-muted">{block.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
