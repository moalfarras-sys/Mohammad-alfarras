"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";
import type { Locale } from "@/types/cms";

const services = {
  en: [
    {
      icon: "🎨",
      accent: "var(--accent-1)",
      title: "Web Design & Development",
      body:
        "From wireframe to pixel-perfect reality. I build fast, beautiful, and accessible websites using Next.js and modern web standards — designed to convert visitors into clients.",
    },
    {
      icon: "⚡",
      accent: "var(--accent-2)",
      title: "Frontend Development",
      body:
        "React, Next.js, TypeScript — I write clean, scalable, maintainable code with AI-assisted workflows that ship faster without cutting quality.",
    },
    {
      icon: "🌐",
      accent: "var(--accent-cyan)",
      title: "Bilingual & RTL Websites",
      body:
        "Arabic + English, flawless RTL layouts — I specialize in bilingual digital experiences most developers simply can't build right. This is my superpower.",
    },
    {
      icon: "✦",
      accent: "var(--accent-2)",
      title: "UI/UX Design",
      body:
        "Figma-first design system thinking. Modern aesthetics: Liquid Glass, Bento Grids, cinematic animations. Interfaces people remember long after they close the tab.",
    },
    {
      icon: "▶",
      accent: "var(--accent-red)",
      title: "Arabic Tech Content",
      body:
        "I teach modern web development to thousands of Arabic developers on YouTube — making cutting-edge tools accessible across the Arab world.",
    },
    {
      icon: "🤖",
      accent: "var(--accent-green)",
      title: "AI-Powered Development",
      body:
        "I use Cursor AI, Claude Code, and LLM agents as core development tools — shipping in days what used to take weeks, without sacrificing quality.",
    },
  ],
  ar: [
    {
      icon: "🎨",
      accent: "var(--accent-1)",
      title: "تصميم وتطوير الويب",
      body:
        "من الفكرة إلى الموقع الكامل. أبني مواقع سريعة وجميلة وقابلة للوصول بـ Next.js — مصممة لتحويل الزوار إلى عملاء.",
    },
    {
      icon: "⚡",
      accent: "var(--accent-2)",
      title: "تطوير الواجهات الأمامية",
      body: "React وNext.js وTypeScript — كود نظيف وقابل للتطوير مع سير عمل مدعوم بالذكاء الاصطناعي.",
    },
    {
      icon: "🌐",
      accent: "var(--accent-cyan)",
      title: "مواقع ثنائية اللغة وRTL",
      body:
        "عربي + إنكليزي، تخطيط RTL مثالي — أتخصص في التجارب الرقمية ثنائية اللغة. هذه قوتي الخارقة.",
    },
    {
      icon: "✦",
      accent: "var(--accent-2)",
      title: "تصميم UI/UX",
      body:
        "تفكير منظومة تصميم Figma أولاً. جماليات حديثة: Liquid Glass وBento Grids وحركات سينمائية. واجهات لا تُنسى.",
    },
    {
      icon: "▶",
      accent: "var(--accent-red)",
      title: "محتوى تقني عربي",
      body:
        "أعلّم آلاف المطورين العرب على يوتيوب — أجعل أحدث أدوات وتقنيات الويب في متناول الجميع في العالم العربي.",
    },
    {
      icon: "🤖",
      accent: "var(--accent-green)",
      title: "تطوير مدعوم بالذكاء الاصطناعي",
      body:
        "أستخدم Cursor AI وClaude Code وأعوانًا ذكيين كأدوات تطوير أساسية — أنجز في أيام ما كان يستغرق أسابيع، دون التنازل عن الجودة.",
    },
  ],
} as const;

export function ServicesSection({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const items = services[locale];
  const reduced = useReducedMotion();

  return (
    <section className="py-[var(--section-py)]" id="services">
      <div className="section-frame">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
          {isAr ? "الخدمات" : "Services"}
        </p>
        <h2 className="font-display mt-3 max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-[var(--text-1)]">
          {isAr ? "ما أقدّمه" : "What I deliver"}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: reduced ? 0.15 : 0.5, delay: reduced ? 0 : idx * 0.05 }}
              whileHover={reduced ? undefined : { y: -4 }}
              className={cn(
                "glass group relative overflow-hidden rounded-[var(--radius-lg)] p-6 transition-[border-color,box-shadow] duration-300",
                "hover:border-white/20",
              )}
              style={{
                backgroundImage: "var(--grad-card)",
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <div
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ background: `color-mix(in srgb, ${item.accent} 18%, transparent)`, color: item.accent }}
              >
                {item.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-1)]">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--text-2)]">{item.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
