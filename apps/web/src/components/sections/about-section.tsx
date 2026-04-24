"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { Locale } from "@/types/cms";

const copy = {
  en: {
    label: "About Me",
    headline: "A builder who connects product thinking, interface craft, and Arabic explanation.",
    p1: "I'm Mohammad, a Germany-based builder from Al-Hasakah, Syria. I work across bilingual web interfaces, digital products, Android media surfaces, and Arabic technical storytelling.",
    p2: "My work blends product thinking, content structure, and technical execution. The goal is not decoration; it is a clearer product or service story that can be maintained.",
    skills: [
      { label: "Design", items: "Figma · UI/UX · Design systems · Prototyping" },
      { label: "Frontend", items: "Next.js · React · TypeScript · Tailwind CSS" },
      { label: "AI Tools", items: "Cursor AI · Claude Code · Codex · GPT" },
      { label: "Languages", items: "Arabic 🇸🇦 · English 🇬🇧 · German 🇩🇪" },
    ],
    cta: "Full story",
  },
  ar: {
    label: "عني",
    headline: "يبني بين التفكير المنتجي، صنعة الواجهة، والشرح العربي.",
    p1: "أنا محمد، مقيم في ألمانيا ومن الحسكة، سوريا. أعمل على واجهات ويب ثنائية اللغة، منتجات رقمية، أسطح Android media، ومحتوى تقني عربي.",
    p2: "أمزج بين التفكير المنتجي، بنية المحتوى، والتنفيذ التقني. الهدف ليس الزخرفة؛ بل قصة منتج أو خدمة أوضح وقابلة للصيانة.",
    skills: [
      { label: "التصميم", items: "Figma · UI/UX · Design systems · Prototyping" },
      { label: "الواجهات", items: "Next.js · React · TypeScript · Tailwind CSS" },
      { label: "أدوات الذكاء الاصطناعي", items: "Cursor AI · Claude Code · Codex · GPT" },
      { label: "اللغات", items: "العربية 🇸🇦 · الإنجليزية 🇬🇧 · الألمانية 🇩🇪" },
    ],
    cta: "السيرة الكاملة",
  },
} as const;

export function AboutSection({
  locale,
  portraitSrc,
  portraitAlt,
  variant = "home",
}: {
  locale: Locale;
  portraitSrc: string;
  portraitAlt: string;
  variant?: "home" | "page";
}) {
  const isAr = locale === "ar";
  const t = copy[locale];
  const reduced = useReducedMotion();

  return (
    <section className={cn("py-[var(--section-py)]", variant === "page" && "pt-8")} id="about">
      <div className="section-frame">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0.15 : 0.55 }}
            className={cn("relative", isAr && "lg:order-2")}
          >
            <div className="glass relative mx-auto aspect-[4/5] max-w-[420px] overflow-hidden rounded-[var(--radius-xl)]">
              <Image
                src={portraitSrc}
                alt={portraitAlt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 420px"
                loading={variant === "page" ? "eager" : "lazy"}
              />
            </div>
          </motion.div>

          <div className={cn("min-w-0", isAr && "lg:order-1")}>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.label}</p>
            <h2 className="font-display mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-[var(--text-1)]">
              {t.headline}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[var(--text-2)] md:text-lg">{t.p1}</p>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-2)] md:text-lg">{t.p2}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.skills.map((cluster) => (
                <div key={cluster.label} className="glass rounded-[var(--radius-md)] px-4 py-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--accent-glow)]">{cluster.label}</div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{cluster.items}</p>
                </div>
              ))}
            </div>

            {variant === "home" ? (
              <Link href={`/${locale}/about`} className="button-liquid-primary mt-8 inline-flex">
                {t.cta} →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
