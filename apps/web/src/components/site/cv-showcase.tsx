"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants, useInView } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  Code2,
  GraduationCap,
  Heart,
  Languages,
  Lightbulb,
  MapPin,
  MessageCircleMore,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/locale-format";
import type { CvPresentationModel } from "@/lib/cv-presenter";

type CvMetric = {
  label: string;
  value: string;
  tone: "primary" | "secondary" | "accent";
};

type Props = {
  cv: CvPresentationModel;
  compact?: boolean;
  metrics?: CvMetric[];
  youtube?: { subscribers: string; videos: string };
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

function t(locale: CvPresentationModel["locale"], ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function toneColor(tone: CvMetric["tone"]) {
  switch (tone) {
    case "secondary": return "var(--secondary)";
    case "accent": return "var(--color-accent)";
    default: return "var(--primary)";
  }
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start));
      }
    }, 25);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 1 — HERO / IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HeroSection({ cv, metrics }: { cv: CvPresentationModel; metrics: CvMetric[] }) {
  const { builder, locale } = cv;
  const isArabic = locale === "ar";

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={stagger}
      className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/4 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-15 blur-[140px]"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      <div className="section-frame">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t(locale, "سيرة تنفيذ وهوية رقمية", "Execution-driven digital identity")}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="headline-arabic text-4xl font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl"
            >
              {t(locale, builder.profile.name_ar, builder.profile.name_en)}
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-xl font-semibold leading-9 text-foreground-muted">
              {t(locale, builder.profile.headline_ar, builder.profile.headline_en)}
            </motion.p>

            <motion.p variants={fadeUp} className="max-w-3xl text-base leading-8 text-foreground-muted md:text-lg">
              {t(locale, builder.summary.body_ar, builder.summary.body_en)}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{t(locale, builder.profile.location_ar, builder.profile.location_en)}</span>
              <span className="text-foreground-soft">·</span>
              <span>{builder.profile.email}</span>
              <span className="text-foreground-soft">·</span>
              <span dir="ltr">{builder.profile.phone}</span>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
              <Link href={`/${locale}/contact`} className="button-primary-shell">
                <MessageCircleMore className="h-4 w-4" />
                {t(locale, "تواصل معي", "Get in touch")}
              </Link>
              <Link href={`/${locale}/projects`} className="button-secondary-shell">
                <Briefcase className="h-4 w-4" />
                {t(locale, "شاهد أعمالي", "View my work")}
              </Link>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="relative mx-auto w-full max-w-sm">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--primary), var(--color-accent), transparent 70%)" }}
            />

            <div className="hero-image-frame relative overflow-hidden rounded-[2.5rem]">
              <div className="relative aspect-3/4 overflow-hidden rounded-[2.5rem]">
                <Image
                  src={builder.profile.portrait || "/images/portrait.jpg"}
                  alt={builder.profile.name_en}
                  fill
                  priority
                  sizes="(max-width: 1024px) 80vw, 35vw"
                  className="object-cover"
                  style={{ objectPosition: "center top" }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-3 rounded-3xl border border-primary/30 bg-black/70 px-4 py-3 backdrop-blur-xl">
                <div className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {t(locale, builder.profile.availability_ar, builder.profile.availability_en).slice(0, 50)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {metrics.length > 0 && (
          <motion.div variants={fadeUp} className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-border-glass bg-surface/60 p-5 text-center backdrop-blur-md"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: toneColor(metric.tone) }}>
                  {metric.label}
                </div>
                <div className="mt-2 text-3xl font-black text-foreground">{metric.value}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 2 — MY STORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StorySection({ locale }: { locale: CvPresentationModel["locale"] }) {
  const cards = locale === "ar"
    ? [
        { icon: Zap, title: "الخلفية العملية", body: "سنوات في قطاع اللوجستيات والتشغيل داخل ألمانيا بنت عندي عقلية الانضباط: الوقت يساوي ثقة، والتأخير يساوي خسارة. نقلت هذا المنطق إلى كل واجهة أبنيها.", accent: "var(--primary)" },
        { icon: Lightbulb, title: "الرؤية التقنية", body: "لا أكتب الكود ليعمل فقط، بل ليحل مشكلة تجارية حقيقية. أدمج بين التصميم البصري وهندسة الواجهات والمحتوى لبناء تجارب رقمية تتحدث عنك وأنت نائم.", accent: "var(--secondary)" },
        { icon: Heart, title: "صناعة المحتوى", body: "أكثر من 1.5 مليون مشاهدة على يوتيوب بمحتوى عربي صادق من ألمانيا. مراجعات تقنية تبني ثقة لا يستطيع الإعلان شراءها.", accent: "var(--color-accent)" },
      ]
    : [
        { icon: Zap, title: "Operational roots", body: "Years in German logistics and operations built a mindset of discipline: time equals trust, delay equals loss. I carry that logic into every interface I build.", accent: "var(--primary)" },
        { icon: Lightbulb, title: "Technical vision", body: "I don't write code to just work — I write it to solve real business problems. I merge visual design, frontend engineering, and content into digital experiences that represent you.", accent: "var(--secondary)" },
        { icon: Heart, title: "Content creation", body: "Over 1.5M views on YouTube with honest Arabic tech content from Germany. Real reviews that build trust no advertising budget can buy.", accent: "var(--color-accent)" },
      ];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={stagger}
      className="px-5 py-12 md:px-8 md:py-16"
    >
      <div className="section-frame space-y-8">
        <motion.div variants={fadeUp}>
          <span className="eyebrow">{t(locale, "من أنا؟", "Who am I?")}</span>
          <h2 className="headline-arabic mt-4 max-w-3xl text-3xl font-black text-foreground md:text-4xl" style={{ lineHeight: 1.15 }}>
            {t(locale, "عقل عمليات، ذوق تصميم، وتنفيذ بلا مساومة", "Operations mindset, design taste, zero-compromise execution")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-foreground-muted md:text-lg">
            {t(locale,
              "الطريق من اللوجستيات إلى التقنية لم يكن عشوائياً. كل بيئة عمل فيها علمتني أن الجودة تبدأ من الترتيب، والثقة تُبنى من التفاصيل.",
              "The path from logistics to tech was not random. Every environment I worked in taught me that quality starts with structure, and trust is built from details."
            )}
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="glass-card group rounded-4xl p-6 md:p-8"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${card.accent}15`, border: `1px solid ${card.accent}30` }}
              >
                <card.icon className="h-5 w-5" style={{ color: card.accent }} />
              </div>
              <h3 className="mt-5 text-xl font-black text-foreground">{card.title}</h3>
              <p className="mt-3 text-sm leading-8 text-foreground-muted">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 3 — CAREER TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TimelineSection({ cv }: { cv: CvPresentationModel }) {
  const { experience, locale } = cv;
  const isArabic = locale === "ar";

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={stagger}
      className="px-5 py-12 md:px-8 md:py-16"
    >
      <div className="section-frame space-y-8">
        <motion.div variants={fadeUp}>
          <span className="eyebrow">{t(locale, "المسيرة المهنية", "Career path")}</span>
          <h2 className="headline-arabic mt-4 max-w-3xl text-3xl font-black text-foreground md:text-4xl" style={{ lineHeight: 1.15 }}>
            {t(locale, "خط زمني حي — ما وراء المسمى الوظيفي", "A living timeline — beyond the job title")}
          </h2>
        </motion.div>

        <div className="relative space-y-5">
          <div
            className={cn(
              "absolute top-2 bottom-2 w-px",
              isArabic ? "right-4" : "left-4",
            )}
            style={{ background: "linear-gradient(to bottom, var(--primary), var(--secondary), transparent)" }}
          />

          {experience.map((entry, index) => (
            <motion.article
              key={entry.id}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              className={cn(
                "relative glass-card rounded-4xl p-6 md:p-8",
                isArabic ? "mr-6 md:mr-8" : "ml-6 md:ml-8",
              )}
            >
              <div
                className={cn(
                  "absolute top-8 h-3 w-3 rounded-full bg-primary shadow-[0_0_20px_rgba(0,255,135,0.6)]",
                  isArabic ? "-right-[1.85rem] md:-right-[2.35rem]" : "-left-[1.85rem] md:-left-[2.35rem]",
                )}
              />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--secondary)" }}>
                    {entry.company}
                  </div>
                  <h3 className="text-xl font-black text-foreground md:text-2xl">{entry.role}</h3>
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {entry.location}
                  </div>
                </div>
                <div className="rounded-full border border-border-glass bg-surface/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-foreground-soft backdrop-blur-sm">
                  {entry.period}
                </div>
              </div>

              <p className="mt-4 text-sm leading-8 text-foreground-muted md:text-base">{entry.description}</p>

              {entry.highlights.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.highlights.map((item) => (
                    <span key={item} className="rounded-full border border-border-glass bg-surface/40 px-3 py-1.5 text-xs font-bold text-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 4 — SKILLS + TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SkillsSection({ cv }: { cv: CvPresentationModel }) {
  const { builder, locale } = cv;

  const tools = [
    "Next.js", "React", "TypeScript", "Tailwind CSS", "Figma",
    "Vercel", "Supabase", "Framer Motion", "Node.js", "Git",
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={stagger}
      className="px-5 py-12 md:px-8 md:py-16"
    >
      <div className="section-frame">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <motion.div variants={fadeUp}>
              <span className="eyebrow">{t(locale, "القدرات", "Core strengths")}</span>
              <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl" style={{ lineHeight: 1.15 }}>
                {t(locale, "قوة عملية يمكن قياسها", "Measured strengths")}
              </h2>
            </motion.div>

            <div className="space-y-3">
              {builder.skills.map((skill) => (
                <motion.div
                  key={skill.id}
                  variants={fadeUp}
                  className="glass-card rounded-[1.4rem] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-foreground">
                      {t(locale, skill.label_ar, skill.label_en)}
                    </span>
                    <span className="font-mono text-sm font-black text-foreground">
                      {formatNumber(locale, skill.level)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, var(--primary), var(--secondary))` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <motion.div variants={fadeUp}>
              <span className="eyebrow" style={{ borderColor: "rgba(255,107,0,0.2)", color: "var(--secondary)", backgroundColor: "rgba(255,107,0,0.05)" }}>
                {t(locale, "الأدوات والتقنيات", "Tools & technologies")}
              </span>
              <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl" style={{ lineHeight: 1.15 }}>
                {t(locale, "تطور مستمر، لا قائمة ثابتة", "Continuous growth, not a static list")}
              </h2>
              <p className="mt-3 text-sm leading-8 text-foreground-muted">
                {t(locale,
                  "الأدوات تتغير، لكن العقلية ثابتة: تعلّم سريع، تطبيق عملي، ونتائج حقيقية.",
                  "Tools change, but the mindset stays: fast learning, practical application, real results."
                )}
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-border-glass bg-surface/60 px-4 py-2 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {tool}
                </span>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="glass-card space-y-4 rounded-4xl p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft">
                <Languages className="h-4 w-4" />
                {t(locale, "اللغات", "Languages")}
              </div>
              <div className="space-y-3">
                {builder.languages.map((lang) => (
                  <div key={lang.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{t(locale, lang.label_ar, lang.label_en)}</span>
                      <span className="text-xs font-semibold text-foreground-muted">{t(locale, lang.level_ar, lang.level_en)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${lang.proficiency}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, var(--primary), var(--color-accent))" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {builder.education.length > 0 && (
              <motion.div variants={fadeUp} className="glass-card space-y-4 rounded-4xl p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft">
                  <GraduationCap className="h-4 w-4" />
                  {t(locale, "التعليم", "Education")}
                </div>
                {builder.education.map((entry) => (
                  <article key={entry.id} className="space-y-1">
                    <div className="text-sm font-black text-foreground">{t(locale, entry.degree_ar, entry.degree_en)}</div>
                    <div className="text-xs font-semibold text-foreground-muted">
                      {t(locale, entry.school_ar, entry.school_en)} · {entry.period}
                    </div>
                  </article>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 5 — STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StatsSection({ locale, youtube }: { locale: CvPresentationModel["locale"]; youtube?: Props["youtube"] }) {
  const stats = locale === "ar"
    ? [
        { value: 4, suffix: "+", label: "سنوات خبرة عملية" },
        { value: 1.5, suffix: "M+", label: "مشاهدة يوتيوب" },
        { value: 40, suffix: "+", label: "مشروع رقمي" },
        { value: 3, suffix: "", label: "لغات (عربي · ألماني · إنكليزي)" },
      ]
    : [
        { value: 4, suffix: "+", label: "Years of operational experience" },
        { value: 1.5, suffix: "M+", label: "YouTube views" },
        { value: 40, suffix: "+", label: "Digital projects" },
        { value: 3, suffix: "", label: "Languages (AR · DE · EN)" },
      ];

  return (
    <section className="px-5 py-12 md:px-8 md:py-16">
      <div className="section-frame">
        <div className="glass-card overflow-hidden rounded-[3rem] p-8 md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(0,255,135,0.12), transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(168,85,247,0.08), transparent 50%)" }}
          />

          <div className="relative grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl font-black text-foreground md:text-5xl">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground-muted">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 6 — PROJECTS + CERTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ProjectsCertsSection({ cv }: { cv: CvPresentationModel }) {
  const { projects, certifications, locale } = cv;
  if (projects.length === 0 && certifications.length === 0) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={stagger}
      className="px-5 py-12 md:px-8 md:py-16"
    >
      <div className="section-frame">
        <div className={cn("grid gap-8", certifications.length > 0 ? "lg:grid-cols-[1.05fr_0.95fr]" : "")}>
          {projects.length > 0 && (
            <div className="space-y-6">
              <motion.div variants={fadeUp}>
                <span className="eyebrow">{t(locale, "أعمال مختارة", "Selected work")}</span>
                <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground" style={{ lineHeight: 1.15 }}>
                  {t(locale, "مشاريع مرتبطة بالسيرة مباشرة", "Projects connected to this CV")}
                </h2>
              </motion.div>
              <div className="space-y-4">
                {projects.map((project) => (
                  <motion.article
                    key={project.id}
                    variants={fadeUp}
                    whileHover={{ y: -3 }}
                    className="glass-card rounded-4xl p-6"
                  >
                    <h3 className="text-xl font-black text-foreground">{project.title}</h3>
                    <p className="mt-3 text-sm leading-8 text-foreground-muted">{project.summary}</p>
                    {project.href && (
                      <Link
                        href={project.href}
                        target="_blank"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground"
                      >
                        {t(locale, "فتح المشروع", "Open project")}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )}
                  </motion.article>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div className="space-y-6">
              <motion.div variants={fadeUp}>
                <span className="eyebrow">{t(locale, "الشهادات", "Certifications")}</span>
                <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground" style={{ lineHeight: 1.15 }}>
                  {t(locale, "اعتماد ومعرفة عملية", "Credentials & growth")}
                </h2>
              </motion.div>
              <div className="space-y-4">
                {certifications.map((entry) => (
                  <motion.article key={entry.id} variants={fadeUp} className="glass-card rounded-4xl p-6">
                    <div className="text-lg font-black text-foreground">{entry.name}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground-muted">{entry.issuer}</div>
                    <div className="mt-3 text-sm leading-8 text-foreground-muted">{entry.description}</div>
                  </motion.article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 7 — CLOSING CTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ClosingCta({ locale }: { locale: CvPresentationModel["locale"] }) {
  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="section-frame">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="contact-cta-frame text-center"
        >
          <div className="mx-auto mb-6 h-px w-24 opacity-40" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />

          <span className="eyebrow mx-auto">{t(locale, "الخطوة التالية", "Next step")}</span>

          <h2
            className="headline-arabic mx-auto mt-6 max-w-3xl text-3xl font-black text-foreground md:text-5xl"
            style={{ lineHeight: 1.15 }}
          >
            {t(locale,
              "الانطباع الأول يُصنع مرة واحدة. لنجعله الأقوى.",
              "First impressions happen once. Let's make yours the strongest."
            )}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-foreground-muted">
            {t(locale,
              "إذا كنت تبحث عن شخص يجمع بين الانضباط العملي والحس البصري — أنا على بعد رسالة واحدة.",
              "If you're looking for someone who combines operational discipline with visual sense — I'm one message away."
            )}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/${locale}/contact`} className="button-primary-shell">
              <MessageCircleMore className="h-5 w-5" />
              {t(locale, "تواصل معي", "Get in touch")}
            </Link>
            <Link href={`/${locale}/projects`} className="button-secondary-shell">
              <Briefcase className="h-4 w-4" />
              {t(locale, "شاهد أعمالي", "See my work")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function CvShowcase({ cv, compact = false, metrics = [], youtube }: Props) {
  const { locale } = cv;

  if (compact) {
    return <CompactCv cv={cv} metrics={metrics} />;
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} data-testid="cv-showcase" className="relative overflow-hidden">
      <HeroSection cv={cv} metrics={metrics} />
      <StorySection locale={locale} />
      <TimelineSection cv={cv} />
      <StatsSection locale={locale} youtube={youtube} />
      <SkillsSection cv={cv} />
      <ProjectsCertsSection cv={cv} />
      <ClosingCta locale={locale} />
    </div>
  );
}

function CompactCv({ cv, metrics }: { cv: CvPresentationModel; metrics: CvMetric[] }) {
  const { builder, experience, locale } = cv;

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="rounded-4xl border border-border-glass bg-surface/50 p-5 backdrop-blur-xl"
      data-testid="cv-showcase-compact"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {builder.theme.showPhoto && (
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl border border-border-glass">
              <Image src={builder.profile.portrait || "/images/portrait.jpg"} alt={builder.profile.name_en} fill sizes="56px" className="object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-foreground">{t(locale, builder.profile.name_ar, builder.profile.name_en)}</h2>
            <p className="text-sm text-foreground-muted">{t(locale, builder.profile.headline_ar, builder.profile.headline_en)}</p>
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {metrics.slice(0, 4).map((m) => (
              <div key={m.label} className="rounded-xl border border-border-glass bg-surface/60 p-3 text-center">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: toneColor(m.tone) }}>{m.label}</div>
                <div className="mt-1 text-lg font-black text-foreground">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {experience.slice(0, 2).map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border-glass bg-surface/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-soft">{entry.company} · {entry.period}</div>
            <div className="mt-1 text-sm font-bold text-foreground">{entry.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
