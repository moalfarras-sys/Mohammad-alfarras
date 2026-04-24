"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { Locale } from "@/types/cms";

export function PageHero({
  locale,
  eyebrow,
  title,
  body,
  actions,
  side,
}: {
  locale: Locale;
  eyebrow: string;
  title: string | ReactNode;
  body?: string | ReactNode;
  actions?: ReactNode;
  side?: ReactNode;
}) {
  const isAr = locale === "ar";
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-12 pt-10 md:pb-16 md:pt-16">
      <div className="liquid-grad-hero pointer-events-none absolute inset-0" aria-hidden />
      {!reduced ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.div
            className="absolute -left-20 -top-16 h-[360px] w-[360px] rounded-full bg-indigo-600/20 blur-3xl"
            animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-20 top-0 h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-3xl"
            animate={{ y: [0, 16, 0], x: [0, -12, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      ) : null}

      <div className="section-frame relative">
        <div className={cn("grid items-center gap-10", side ? "lg:grid-cols-[1.1fr_0.9fr]" : "")}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{eyebrow}</p>
            <h1
              className={cn(
                "font-display mt-4 max-w-[18ch] font-extrabold tracking-tight text-[var(--text-1)]",
                isAr
                  ? "text-[clamp(2rem,6vw,3.6rem)] leading-[1.15]"
                  : "text-[clamp(2.25rem,6vw,4rem)] leading-[1.05]",
              )}
            >
              {title}
            </h1>
            {body ? (
              <p className="prose-frame mt-5 text-base leading-relaxed text-[var(--text-2)] md:text-lg">{body}</p>
            ) : null}
            {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
          </div>
          {side}
        </div>
      </div>
    </section>
  );
}
