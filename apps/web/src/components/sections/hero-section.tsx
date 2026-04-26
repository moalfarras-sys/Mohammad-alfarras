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
    lines: ["I Build Product Surfaces,", "Not Detached Pages."],
    sub: "Germany-based builder working across web interfaces, Android media, and Arabic technical storytelling.",
    primary: "View My Work",
    secondary: "Let's Talk",
    stats: [
      { n: "MoPlayer", label: "Product" },
      { n: "AR · EN", label: "Languages" },
      { n: "1.5M+", label: "Views" },
      { n: "Germany", label: "Base" },
    ],
    badge: "Germany · YouTube creator · Product-minded delivery",
    scroll: "Scroll to explore",
  },
  ar: {
    eyebrow: "مطوّر Frontend · مصمم واجهات · يوتيوبر تقني",
    lines: ["أصمّم تجارب رقمية مميزة،", "لا مجرد مواقع."],
    sub: "مقيم في ألمانيا، أعمل على واجهات ويب، وسائط Android، ومحتوى تقني عربي.",
    primary: "اكتشف أعمالي",
    secondary: "تواصل معي",
    stats: [
      { n: "MoPlayer", label: "منتج" },
      { n: "AR · EN", label: "لغتان" },
      { n: "+1.5M", label: "مشاهدة" },
      { n: "ألمانيا", label: "الموقع" },
    ],
    badge: "ألمانيا · صانع محتوى تقني · تنفيذ بعقلية منتج",
    scroll: "مرّر للاستكشاف",
  },
} as const;

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

  /* Safe line-heights — no more clipping */
  const headClass = cn(
    "font-bold tracking-tight text-[var(--text-1)] pb-1 overflow-visible",
    isAr
      ? "text-[clamp(1.85rem,5vw,3.6rem)] leading-[1.3]"
      : "text-[clamp(1.95rem,4.5vw,3.8rem)] leading-[1.12]",
  );

  return (
    <section ref={containerRef} className="relative overflow-hidden pb-10 pt-8 md:pb-20 md:pt-14">
      <div className="liquid-grad-hero pointer-events-none absolute inset-0" />

      <div className="section-frame relative z-[1]">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">

          {/* Copy column — first on mobile, left on desktop (LTR) / right on desktop (RTL) */}
          <div className={cn("min-w-0 order-2 lg:order-1", isAr && "lg:order-2")}>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] md:text-xs" style={{ color: "var(--accent-glow)" }}>
              {t.eyebrow}
            </p>

            <motion.div
              className="mt-4 overflow-visible"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
              }}
            >
              {t.lines.map((line) => (
                <motion.h1 key={line} variants={cinematicReveal} className={headClass}>
                  {line}
                </motion.h1>
              ))}
            </motion.div>

            <p className="prose-frame mt-5 text-[15px] leading-relaxed text-[var(--text-2)] md:text-base">
              {t.sub}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/${locale}/work`} className="button-liquid-primary">
                {t.primary}
              </Link>
              <Link href={`/${locale}/contact`} className="button-liquid-secondary">
                {t.secondary}
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {t.stats.map((s) => (
                <div key={s.label} className="glass rounded-[var(--radius-md)] px-3 py-3 text-center">
                  <div className="text-base font-bold text-[var(--accent-glow)] md:text-lg">{s.n}</div>
                  <div className="mt-0.5 text-[11px] font-medium text-[var(--text-2)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Portrait column — clean frame, no spinning ring */}
          <div className={cn("order-1 lg:order-2 flex justify-center", isAr && "lg:order-1")}>
            <div className="relative w-full max-w-[220px] md:max-w-[280px] lg:max-w-none">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--glass-border)] shadow-[var(--shadow-elevated)]">
                <Image
                  src={portraitSrc}
                  alt={portraitAlt}
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 220px, (max-width: 1280px) 280px, 340px"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-base)] to-transparent opacity-50" />
              </div>
              <motion.span
                className="glass absolute -bottom-3 left-3 right-3 rounded-[var(--radius-md)] px-3 py-2 text-center text-[11px] font-semibold leading-snug text-[var(--text-1)] shadow-lg"
                initial={false}
                animate={reduced ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {t.badge}
              </motion.span>
            </div>
          </div>
        </div>

        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-2 text-[var(--text-3)]"
          style={{ opacity: scrollHintOpacity }}
        >
          <ChevronDown className={cn("h-4 w-4", !reduced && "animate-bounce")} aria-hidden />
          <span className="text-xs font-medium tracking-wide">{t.scroll}</span>
        </motion.div>
      </div>
    </section>
  );
}
