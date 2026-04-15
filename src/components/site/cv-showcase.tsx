"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, Download, Languages, Sparkles, Target } from "lucide-react";

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
  cta?: {
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

function text(locale: CvPresentationModel["locale"], ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function toneColor(tone: CvMetric["tone"]) {
  switch (tone) {
    case "secondary":
      return "var(--secondary)";
    case "accent":
      return "var(--accent)";
    default:
      return "var(--primary)";
  }
}

export function CvShowcase({ cv, compact = false, metrics = [], cta }: Props) {
  const { builder, experience, projects, certifications, locale } = cv;
  const isArabic = locale === "ar";
  const orderedEducation = builder.education;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "relative overflow-hidden",
        compact ? "rounded-[2rem] border border-white/8 bg-background-muted p-4" : "px-5 py-10 md:px-8 md:py-16",
      )}
      data-testid="cv-showcase"
    >
      {/* Background is handled by Global Atmospheric Engine */}

      <div className={cn("relative z-10", compact ? "space-y-6" : "section-frame space-y-10")}>
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="grid gap-6 rounded-[3rem] border border-border/60 bg-surface/50 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-14 shadow-2xl backdrop-blur-2xl transition-all perspective-[1200px]"
        >
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(0,255,135,0.18)] bg-[rgba(0,255,135,0.06)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-[var(--primary)]">
              <Sparkles className="h-4 w-4" />
              {text(locale, "سيرة تنفيذ وهوية رقمية", "Execution-led resume")}
            </div>

            <div className="space-y-4">
              <h1
                className={cn(
                  "headline-arabic text-4xl font-black leading-[1.02] text-foreground md:text-6xl",
                  compact && "text-3xl md:text-5xl",
                )}
              >
                {text(locale, builder.profile.name_ar, builder.profile.name_en)}
              </h1>
              <p
                className={cn(
                  "max-w-2xl text-xl font-semibold leading-9 text-foreground-muted",
                  compact && "text-base leading-8",
                )}
              >
                {text(locale, builder.profile.headline_ar, builder.profile.headline_en)}
              </p>
            </div>

            <p
              className={cn(
                "max-w-3xl text-base leading-8 text-foreground-muted md:text-lg",
                compact && "text-sm leading-7",
              )}
            >
              {text(locale, builder.summary.body_ar, builder.summary.body_en)}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <span>{builder.profile.email}</span>
              <span className="text-foreground-soft">•</span>
              <span>{builder.profile.phone}</span>
              <span className="text-foreground-soft">•</span>
              <span>{text(locale, builder.profile.location_ar, builder.profile.location_en)}</span>
            </div>

            {cta ? (
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href={cta.primaryHref} target="_blank" className="button-primary-shell">
                  <Download className="h-4 w-4" />
                  {cta.primaryLabel}
                </Link>
                <Link href={cta.secondaryHref} target="_blank" className="button-secondary-shell">
                  <ArrowUpRight className="h-4 w-4" />
                  {cta.secondaryLabel}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-surface/70 p-6 shadow-sm backdrop-blur-xl">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(0,255,135,0.22), transparent 40%)",
                }}
              />
              <div className="relative z-10 flex items-center gap-4">
                {builder.theme.showPhoto ? (
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[2rem] border border-border/40 shadow-lg">
                    <Image
                      src={builder.profile.portrait || "/images/portrait.jpg"}
                      alt={builder.profile.name_en}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                    {text(locale, "جاهز للتنفيذ", "Ready to build")}
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {text(locale, builder.profile.availability_ar, builder.profile.availability_en)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {builder.links.slice(0, 3).map((link) => (
                      <Link
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-foreground"
                      >
                        {text(locale, link.label_ar, link.label_en)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {builder.theme.showMetrics && metrics.length > 0 ? (
              <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.8rem] border border-border/40 bg-surface/60 p-5 text-center shadow-sm backdrop-blur-md"
                  >
                    <div
                      className="text-[11px] font-black uppercase tracking-[0.24em]"
                      style={{ color: toneColor(metric.tone) }}
                    >
                      {metric.label}
                    </div>
                    <div className="mt-3 text-3xl font-black text-foreground">{metric.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </motion.section>

        {/* ── CORE PHILOSOPHY / ABOUT EXTENDED ── */}
        {!compact ? (
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="rounded-[3rem] border border-[var(--primary)]/20 bg-surface/40 p-6 shadow-2xl backdrop-blur-xl md:p-10"
            style={{
              background: "radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)"
            }}
          >
            <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
              <div className="space-y-4">
                <div className="eyebrow">{text(locale, "من أنا؟", "Who am I?")}</div>
                <h2 className="text-2xl font-black md:text-3xl lg:text-4xl" style={{ color: "var(--foreground)"}}>
                  {text(locale, "عقل هندسي، وأداة تنفيذية", "An engineering mind, an execution tool")}
                </h2>
                <p className="text-base leading-8 text-foreground-muted md:text-lg md:leading-9">
                  {text(locale, 
                    "لا أكتب الكود فقط ليعمل، بل ليحل مشكلة تجارية أو يعزز تجربة المستخدم. جذوري في قطاع اللوجستيات في ألمانيا علمتني أن الوقت هو أكبر ثمن، وأن الواجهات يجب أن ترشد المستخدم دون تعقيد.", 
                    "I don't just write code to make things work; I build solutions to solve business problems and empower users. My roots in European logistics taught me that time is extremely valuable, and interfaces must guide users effortlessly."
                  )}
                </p>
              </div>
              <div className="space-y-4">
                <div className="eyebrow" style={{ borderColor: "rgba(255,107,0,0.2)", color: "var(--accent-warm)", backgroundColor: "rgba(255,107,0,0.05)" }}>
                  {text(locale, "ماذا أقدم؟", "What I bring to the table?")}
                </div>
                <h2 className="text-2xl font-black md:text-3xl lg:text-4xl" style={{ color: "var(--foreground)"}}>
                  {text(locale, "تأثير من الثانية الأولى", "Impact from the first second")}
                </h2>
                <p className="text-base leading-8 text-foreground-muted md:text-lg md:leading-9">
                  {text(locale, 
                    "أدمج بين صناعة المحتوى، وتصميم الجرافيك، والبرمجة الحديثة (Next.js & Frontend) لبناء هويات رقمية حقيقية تتحدث نيابة عنك عندما تكون نائماً. من الفكرة إلى الإطلاق، التفاصيل تصنع الفارق.", 
                    "I merge content creation, graphical design, and modern engineering (Next.js & Frontend) to build digital identities that speak for you while you sleep. From idea to launch, details matter."
                  )}
                </p>
              </div>
            </div>
          </motion.section>
        ) : null}

        <div className={cn("grid gap-8", compact ? "grid-cols-1" : "lg:grid-cols-[1.15fr_0.85fr]")}>
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="rounded-[3rem] border border-border/60 bg-surface/40 p-6 md:p-10 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <div className="eyebrow">{text(locale, "الخبرات", "Experience")}</div>
                <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground md:text-4xl">
                  {text(locale, "خط زمني حي يشرح ما وراء الوظيفة", "A real timeline behind the title")}
                </h2>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-foreground-soft md:inline-flex">
                {text(locale, "رحلة تنفيذ", "Execution path")}
              </div>
            </div>

            <div className="relative space-y-5">
              <div
                className={cn(
                  "absolute top-2 bottom-2 w-px bg-gradient-to-b from-[var(--primary)] via-[var(--secondary)] to-transparent",
                  isArabic ? "right-4" : "left-4",
                )}
              />

              {experience.map((entry, index) => (
                <motion.article
                  key={entry.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  whileHover={{
                    rotateX: compact ? 0 : 2,
                    rotateY: compact ? 0 : (isArabic ? 3 : -3),
                    y: -5,
                    backgroundColor: "var(--surface-soft)",
                  }}
                  className="relative rounded-[2rem] border border-border/40 bg-surface/30 p-6 shadow-sm backdrop-blur-md transition-all md:[transform-style:preserve-3d] perspective-[1000px]"
                >
                  <div
                    className={cn(
                      "absolute top-7 h-3 w-3 rounded-full bg-[var(--primary)] shadow-[0_0_24px_rgba(0,255,135,0.7)]",
                      isArabic ? "-right-[0.1rem]" : "-left-[0.1rem]",
                    )}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--secondary)]">
                        {entry.company}
                      </div>
                      <h3 className="text-2xl font-black text-foreground">{entry.role}</h3>
                      <div className="text-sm font-semibold text-foreground-muted">{entry.location}</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground-soft">
                      {entry.period}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-8 text-foreground-muted md:text-base">
                    {entry.description}
                  </p>
                  {entry.highlights.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.highlights.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </motion.article>
              ))}
            </div>
          </motion.section>

          <div className="space-y-8">
            <motion.section
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="rounded-[2.5rem] border border-border/60 bg-surface/50 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="eyebrow">{text(locale, "المهارات", "Skills")}</div>
              <h2 className="headline-arabic mt-4 text-2xl font-black text-foreground md:text-3xl">
                {text(locale, "قوة عملية يمكن قياسها", "Measured strengths")}
              </h2>

              <div className="mt-6 space-y-4">
                {builder.skills.map((skill) => (
                  <div key={skill.id} className="rounded-[1.4rem] border border-border/70 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {text(locale, skill.label_ar, skill.label_en)}
                      </span>
                      <span className="font-mono text-sm font-black text-foreground">
                        {formatNumber(locale, skill.level)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.75, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${builder.theme.accent}, ${builder.theme.secondary})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="rounded-[2.5rem] border border-border/60 bg-surface/50 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="eyebrow">{text(locale, "اللغات والتعليم", "Languages and Education")}</div>
              <div className="mt-4 grid gap-5">
                <div className="rounded-[1.6rem] border border-border/70 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-foreground-soft">
                    <Languages className="h-4 w-4" />
                    {text(locale, "اللغات", "Languages")}
                  </div>
                  <div className="space-y-4">
                    {builder.languages.map((language) => (
                      <div key={language.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              {text(locale, language.label_ar, language.label_en)}
                            </div>
                            <div className="text-xs text-foreground-muted">
                              {text(locale, language.level_ar, language.level_en)}
                            </div>
                          </div>
                          <div className="text-xs font-black text-foreground">
                            {formatNumber(locale, language.proficiency)}%
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${language.proficiency}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-warm))`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-border/70 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-foreground-soft">
                    <Target className="h-4 w-4" />
                    {text(locale, "المحطات التعليمية", "Education")}
                  </div>
                  <div className="space-y-4">
                    {orderedEducation.map((entry) => (
                      <article key={entry.id}>
                        <div className="text-sm font-black text-foreground">
                          {text(locale, entry.degree_ar, entry.degree_en)}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-foreground-muted">
                          {text(locale, entry.school_ar, entry.school_en)} • {entry.period}
                        </div>
                        <div className="mt-2 text-sm leading-7 text-foreground-muted">
                          {text(locale, entry.details_ar, entry.details_en)}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {projects.length > 0 || certifications.length > 0 ? (
          <div className={cn("grid gap-8", compact ? "grid-cols-1" : "lg:grid-cols-[1.05fr_0.95fr]")}>
            {projects.length > 0 ? (
              <motion.section
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="rounded-[3rem] border border-border/60 bg-surface/50 p-6 shadow-2xl backdrop-blur-2xl md:p-10"
              >
                <div className="eyebrow">{text(locale, "الأعمال", "Projects")}</div>
                <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground">
                  {text(locale, "أعمال مرتبطة مباشرة بالسيرة", "Projects connected to the CV")}
                </h2>
                <div className="mt-6 grid gap-4">
                  {projects.map((project) => (
                    <motion.article
                      key={project.id}
                      whileHover={{ y: -3 }}
                      className="rounded-[1.8rem] border border-border/70 bg-white/[0.03] p-5"
                    >
                      <h3 className="text-xl font-black text-foreground">{project.title}</h3>
                      <p className="mt-3 text-sm leading-8 text-foreground-muted">{project.summary}</p>
                      {project.href ? (
                        <Link
                          href={project.href}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]"
                        >
                          {text(locale, "فتح المشروع", "Open project")}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </motion.article>
                  ))}
                </div>
              </motion.section>
            ) : null}

            {certifications.length > 0 ? (
              <motion.section
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="rounded-[3rem] border border-border/60 bg-surface/50 p-6 shadow-2xl backdrop-blur-2xl md:p-10"
              >
                <div className="eyebrow">{text(locale, "الشهادات", "Certifications")}</div>
                <h2 className="headline-arabic mt-4 text-3xl font-black text-foreground">
                  {text(locale, "اعتماد ومعرفة تطبيقية", "Credentials and practical growth")}
                </h2>
                <div className="mt-6 space-y-4">
                  {certifications.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-[1.8rem] border border-border/70 bg-white/[0.03] p-5"
                    >
                      <div className="text-lg font-black text-foreground">{entry.name}</div>
                      <div className="mt-1 text-sm font-semibold text-foreground-muted">{entry.issuer}</div>
                      <div className="mt-3 text-sm leading-8 text-foreground-muted">
                        {entry.description}
                      </div>
                    </article>
                  ))}
                </div>
              </motion.section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
