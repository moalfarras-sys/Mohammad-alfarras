"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

import { cinematicReveal } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { Locale } from "@/types/cms";

const copy = {
  en: {
    eyebrow: "Frontend Developer · UI Designer · YouTube Creator",
    lines: ["I Build", "Product Surfaces,", "Not Detached Pages."],
    sub:
      "Germany-based builder working across web interfaces, product surfaces, Android media work, and Arabic technical storytelling.",
    primary: "View My Work",
    secondary: "Let's Talk",
    stats: [
      { n: "MoPlayer", label: "Product" },
      { n: "AR · EN", label: "Languages" },
      { n: "1.5M+", label: "Views" },
      { n: "Germany", label: "Base" },
    ],
    badges: [
      { t: "Germany", delay: 0 },
      { t: "YouTube creator", delay: 0.3 },
      { t: "Product-minded delivery", delay: 0.6 },
    ],
    scroll: "Scroll to explore",
  },
  ar: {
    eyebrow: "مطوّر Frontend · مصمم واجهات · يوتيوبر تقني",
    lines: ["أصمّم تجارب", "رقمية مميزة،", "لا مجرد مواقع."],
    sub:
      "مقيم في ألمانيا، أعمل على واجهات ويب، أسطح منتجات، Android media، ومحتوى تقني عربي.",
    primary: "اكتشف أعمالي",
    secondary: "تواصل معي",
    stats: [
      { n: "MoPlayer", label: "منتج" },
      { n: "AR · EN", label: "لغتان" },
      { n: "+1.5M", label: "مشاهدة" },
      { n: "ألمانيا", label: "الموقع" },
    ],
    badges: [
      { t: "ألمانيا", delay: 0 },
      { t: "صانع محتوى تقني", delay: 0.3 },
      { t: "تنفيذ بعقلية منتج", delay: 0.6 },
    ],
    scroll: "مرّر للاستكشاف",
  },
} as const;

function GradientOrbs({ reduced }: { reduced: boolean }) {
  void reduced;
  return null;
}

export function HeroSection({
  locale,
  portraitSrc,
  portraitAlt,
}: {
  locale: Locale;
  portraitSrc: string;
  portraitAlt: string;
}) {
  const isAr = locale === "ar";
  const t = copy[locale];
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const scrollHintOpacity = useTransform(scrollY, [0, 120], [1, 0]);

  const headClass = cn(
    "font-bold tracking-tight text-[var(--text-1)]",
    isAr ? "text-[clamp(2.5rem,8vw,4.5rem)] leading-[1.12]" : "text-[clamp(2.75rem,8vw,5rem)] leading-[0.98]",
  );

  return (
    <section ref={containerRef} className="relative overflow-hidden pb-12 pt-6 md:pb-20 md:pt-10">
      <div className="liquid-grad-hero pointer-events-none absolute inset-0" />
      <GradientOrbs reduced={!!reduced} />

      <div className="section-frame relative z-[1]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          {/* Profile column */}
          <div className={cn("relative mx-auto flex max-w-[320px] justify-center lg:mx-0 lg:max-w-none", isAr && "lg:order-2")}>
            <div className="relative h-[200px] w-[200px] md:h-[240px] md:w-[240px] lg:h-[280px] lg:w-[280px]">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  padding: 3,
                  background: "conic-gradient(from 0deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)",
                }}
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-[3px] overflow-hidden rounded-full bg-[var(--bg-base)]">
                <Image
                  src={portraitSrc}
                  alt={portraitAlt}
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 240px, 280px"
                />
              </div>

              {t.badges.map((b, i) => (
                <motion.span
                  key={b.t}
                  className={cn(
                    "glass absolute z-[2] max-w-[200px] whitespace-normal rounded-[var(--radius-md)] px-3 py-2 text-[11px] font-semibold leading-snug text-[var(--text-1)] shadow-lg md:text-xs",
                    i === 0 && (isAr ? "bottom-2 left-0" : "bottom-2 left-0"),
                    i === 1 && (isAr ? "right-0 top-2" : "right-0 top-2"),
                    i === 2 && (isAr ? "bottom-2 right-0" : "bottom-2 right-0"),
                  )}
                  initial={false}
                  animate={reduced ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
                >
                  {b.t}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Copy column */}
          <div className={cn("min-w-0", isAr && "lg:order-1")}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.15em] md:text-xs"
              style={{ color: "var(--accent-glow)" }}
            >
              {t.eyebrow}
            </p>

            <motion.div
              className="mt-6 space-y-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
              }}
            >
              {t.lines.map((line) => (
                <motion.h1 key={line} variants={cinematicReveal} className={headClass}>
                  {line}
                </motion.h1>
              ))}
            </motion.div>

            <p className="prose-frame mt-6 min-h-[1em] text-base leading-relaxed text-[var(--text-2)] md:text-lg">
              {t.sub}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/work`}
                className={cn("button-liquid-primary", isAr && "flex-row-reverse")}
              >
                {isAr ? (
                  <>
                    ← {t.primary}
                  </>
                ) : (
                  <>
                    {t.primary} →
                  </>
                )}
              </Link>
              <Link href={`/${locale}/contact`} className="button-liquid-secondary">
                {t.secondary}
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {t.stats.map((s) => (
                <div key={s.label} className="glass rounded-[var(--radius-md)] px-3 py-3 text-center md:px-4">
                  <div className="text-lg font-bold text-[var(--accent-glow)] md:text-xl">{s.n}</div>
                  <div className="text-[11px] font-medium text-[var(--text-2)] md:text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="mt-14 flex flex-col items-center justify-center gap-2 text-[var(--text-3)]"
          style={{ opacity: scrollHintOpacity }}
        >
          <ChevronDown className={cn("h-4 w-4", !reduced && "animate-bounce")} aria-hidden />
          <span className="text-xs font-medium tracking-wide">{t.scroll}</span>
        </motion.div>
      </div>
    </section>
  );
}
