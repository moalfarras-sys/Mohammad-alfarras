"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Code2,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Palette,
  PlayCircle,
  Rocket,
  Sparkles,
} from "lucide-react";

import { AboutSection } from "@/components/sections/about-section";
import { PageHero } from "@/components/sections/page-hero";
import { ContactCtaSection } from "@/components/sections/contact-cta-section";
import type { SiteViewModel } from "@/components/site/site-view-model";

const copy = {
  en: {
    eyebrow: "About Mohammad",
    title: "Builder of web interfaces, product surfaces, and Arabic tech content from Germany.",
    body:
      "I bridge operational discipline with digital product work. The result is web and product surfaces that stay structured under real business pressure.",
    numbersTitle: "Numbers that back the story",
    numbers: [
      { value: "MoPlayer", label: "Flagship product", Icon: Rocket },
      { value: "AR · EN", label: "Bilingual publishing", Icon: Code2 },
      { value: "6.1K+", label: "YouTube subscribers", Icon: PlayCircle },
      { value: "1.5M+", label: "Video views", Icon: Sparkles },
    ],
    stackTitle: "The working stack",
    stackItems: [
      {
        Icon: Code2,
        label: "Frontend",
        value: "Next.js 16 · React · TypeScript · Tailwind CSS v4 · Framer Motion",
      },
      {
        Icon: Palette,
        label: "Design",
        value: "Figma · design tokens · bilingual layouts · restrained motion · product storytelling",
      },
      {
        Icon: Sparkles,
        label: "AI-assisted",
        value: "Cursor · Claude Code · Codex · LLM agents for velocity without losing taste",
      },
      {
        Icon: Languages,
        label: "Languages",
        value: "Arabic (native) · English (fluent) · German (intermediate)",
      },
    ],
    journeyTitle: "Journey",
    certsTitle: "Learning & records",
    valuesTitle: "How I work",
    values: [
      {
        title: "Design-led code",
        body:
          "Every component decision starts from the first impression — how it looks, feels, and loads — not from the easiest technical path.",
      },
      {
        title: "Bilingual by default",
        body:
          "Arabic and English aren't afterthoughts. RTL layouts, typography, and direction-aware animations ship from day one.",
      },
      {
        title: "AI as a force multiplier",
        body:
          "I combine Cursor, Claude Code, and Codex agents with manual craft — the goal is faster shipping without diluting quality.",
      },
    ],
    contactTitle: "Let's build",
    contactBody:
      "I'm open for focused web projects, product surfaces, and technical consulting from Germany and remote.",
    viewCv: "Open full CV",
  },
  ar: {
    eyebrow: "عن محمد",
    title: "يبني واجهات ويب، أسطح منتجات، ومحتوى تقني عربي من ألمانيا.",
    body:
      "أجمع بين الانضباط التشغيلي والعمل الرقمي. النتيجة واجهات ويب ومنتجات تبقى منظمة تحت ضغط الأعمال الحقيقي.",
    numbersTitle: "أرقام تدعم القصة",
    numbers: [
      { value: "MoPlayer", label: "المنتج الرئيسي", Icon: Rocket },
      { value: "AR · EN", label: "نشر ثنائي اللغة", Icon: Code2 },
      { value: "+6.1K", label: "مشترك في يوتيوب", Icon: PlayCircle },
      { value: "+1.5M", label: "مشاهدة فيديو", Icon: Sparkles },
    ],
    stackTitle: "أدواتي اليومية",
    stackItems: [
      {
        Icon: Code2,
        label: "الواجهات",
        value: "Next.js 16 · React · TypeScript · Tailwind CSS v4 · Framer Motion",
      },
      {
        Icon: Palette,
        label: "التصميم",
        value: "Figma · Design tokens · تخطيطات ثنائية اللغة · حركة هادئة · سرد منتجي",
      },
      {
        Icon: Sparkles,
        label: "الذكاء الاصطناعي",
        value: "Cursor · Claude Code · Codex · وكلاء LLM للسرعة دون فقد الذوق",
      },
      {
        Icon: Languages,
        label: "اللغات",
        value: "العربية (الأم) · الإنجليزية (متقدم) · الألمانية (متوسط)",
      },
    ],
    journeyTitle: "المسار",
    certsTitle: "التعلّم والسجلات",
    valuesTitle: "كيف أعمل",
    values: [
      {
        title: "كود يقوده التصميم",
        body:
          "كل قرار مكوّن يبدأ من الانطباع الأول — كيف يبدو ويشعر ويتحمّل — لا من أسهل مسار تقني.",
      },
      {
        title: "ثنائية اللغة افتراضيًا",
        body:
          "العربية والإنجليزية ليستا لاحقة. تخطيطات RTL والطباعة والحركة المدركة للاتجاه تُشحن منذ اليوم الأول.",
      },
      {
        title: "الذكاء الاصطناعي كمضاعف",
        body:
          "أجمع بين Cursor وClaude Code وCodex مع الصنعة اليدوية — الهدف شحن أسرع بدون إضعاف الجودة.",
      },
    ],
    contactTitle: "لنبني معًا",
    contactBody:
      "متاح لمشاريع ويب مركّزة، أسطح منتجات، واستشارات تقنية من ألمانيا وعن بُعد.",
    viewCv: "افتح السيرة الكاملة",
  },
} as const;

function Number({ value, label, Icon, delay, reduced }: { value: string; label: string; Icon: typeof Rocket; delay: number; reduced: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0.15 : 0.45, delay: reduced ? 0 : delay }}
      className="glass relative overflow-hidden rounded-[var(--radius-lg)] p-5"
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 text-[var(--accent-glow)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-3xl font-extrabold text-[var(--text-1)] md:text-4xl">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--text-3)]">{label}</div>
    </motion.div>
  );
}

export function AboutPageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const reduced = useReducedMotion();
  const isAr = model.locale === "ar";
  const portrait = model.portraitImage || model.brandMedia.profilePortrait || "/images/protofeilnew.jpeg";

  return (
    <>
      <PageHero
        locale={model.locale}
        eyebrow={t.eyebrow}
        title={t.title}
        body={t.body}
        actions={
          <>
            <Link href={`/${model.locale}/cv`} className="button-liquid-primary">
              <GraduationCap className="h-4 w-4" />
              {t.viewCv}
            </Link>
            <Link href={`/${model.locale}/contact`} className="button-liquid-secondary">
              <Mail className="h-4 w-4" />
              {isAr ? "تواصل" : "Get in touch"}
            </Link>
          </>
        }
        side={
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[28px]"
          >
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#6366f1]/30 via-transparent to-[#8b5cf6]/30 blur-2xl" aria-hidden />
            <div className="glass relative h-full w-full overflow-hidden rounded-[28px]">
              <Image
                src={portrait}
                alt={model.profile.name}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-[var(--radius-md)] bg-black/45 px-3 py-2 text-xs backdrop-blur">
                <div className="flex items-center gap-2 text-white/95">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="font-medium">{model.profile.location}</span>
                </div>
                <div className="mt-1 text-[11px] text-white/70">{model.profile.subtitle}</div>
              </div>
            </div>
          </motion.div>
        }
      />

      {/* Numbers */}
      <section className="py-12 md:py-16">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.numbersTitle}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.numbers.map((n, idx) => (
              <Number key={n.label} value={n.value} label={n.label} Icon={n.Icon} delay={idx * 0.06} reduced={!!reduced} />
            ))}
          </div>
        </div>
      </section>

      {/* Main about (portrait + story + skills) */}
      <AboutSection locale={model.locale} portraitSrc={portrait} portraitAlt={model.profile.name} variant="page" />

      {/* Working stack */}
      <section className="py-12 md:py-16">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.stackTitle}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {t.stackItems.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0.15 : 0.45, delay: reduced ? 0 : idx * 0.05 }}
                className="glass rounded-[var(--radius-lg)] p-5 md:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 text-[var(--accent-glow)]">
                    <item.Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--accent-glow)]">{item.label}</div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-2)] md:text-base">{item.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey (experience timeline) */}
      {model.experience.length ? (
        <section className="py-12 md:py-16">
          <div className="section-frame">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.journeyTitle}</p>
            <h2 className="font-display mt-3 max-w-[22ch] text-[clamp(1.6rem,3.6vw,2.3rem)] font-extrabold leading-tight text-[var(--text-1)]">
              {isAr ? "من المستودع إلى الواجهات الرقمية." : "From the warehouse to the web."}
            </h2>
            <div className="mt-10 relative">
              <div
                className={`pointer-events-none absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent ${isAr ? "right-5" : "left-5"}`}
                aria-hidden
              />
              <ul className="space-y-5">
                {model.experience.map((entry, idx) => (
                  <motion.li
                    key={entry.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: reduced ? 0.15 : 0.45, delay: reduced ? 0 : idx * 0.05 }}
                    className="relative pl-14 rtl:pr-14 rtl:pl-0"
                  >
                    <span className="absolute top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-600/20 ltr:left-0 rtl:right-0">
                      <BadgeCheck className="h-5 w-5" />
                    </span>
                    <div className="glass rounded-[var(--radius-lg)] p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-display text-lg font-bold text-[var(--text-1)]">{entry.role}</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[var(--text-2)]">
                          {entry.company}
                        </span>
                        <span className="text-[11px] text-[var(--text-3)]">{entry.period}</span>
                      </div>
                      {entry.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{entry.description}</p>
                      ) : null}
                      {entry.highlights?.length ? (
                        <ul className="mt-3 grid gap-1.5 text-sm text-[var(--text-2)]">
                          {entry.highlights.slice(0, 4).map((h) => (
                            <li key={h} className="flex items-start gap-2">
                              <ArrowRight className={`mt-1 h-3.5 w-3.5 shrink-0 text-[var(--accent-glow)] ${isAr ? "-scale-x-100" : ""}`} />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* Certifications */}
      {model.certifications.length ? (
        <section className="py-12 md:py-16">
          <div className="section-frame">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.certsTitle}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {model.certifications.map((cert, idx) => (
                <motion.a
                  key={cert.id}
                  href={cert.credentialUrl || "#"}
                  target={cert.credentialUrl ? "_blank" : undefined}
                  rel={cert.credentialUrl ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduced ? 0.15 : 0.4, delay: reduced ? 0 : idx * 0.04 }}
                  className="glass group block rounded-[var(--radius-lg)] p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 text-[var(--accent-glow)]">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--text-1)]">{cert.name}</h3>
                      <p className="mt-1 text-xs text-[var(--text-3)]">{cert.issuer}</p>
                      {cert.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-2)]">{cert.description}</p>
                      ) : null}
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Values */}
      <section className="py-12 md:py-16">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.valuesTitle}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {t.values.map((v, idx) => (
              <motion.article
                key={v.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0.15 : 0.4, delay: reduced ? 0 : idx * 0.05 }}
                className="glass rounded-[var(--radius-lg)] p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 text-[var(--accent-glow)]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-1)]">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{v.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <ContactCtaSection locale={model.locale} />
    </>
  );
}
