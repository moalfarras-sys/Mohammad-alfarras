"use client";

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

  return (
    <section className="relative overflow-hidden pb-12 pt-10 md:pb-16 md:pt-16">
      <div className="liquid-grad-hero pointer-events-none absolute inset-0" aria-hidden />

      <div className="section-frame relative">
        <div className={cn("grid items-center gap-10", side ? "lg:grid-cols-[1.1fr_0.9fr]" : "")}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{eyebrow}</p>
            <h1
              className={cn(
                "font-display mt-4 max-w-[22ch] overflow-visible pb-1 font-extrabold tracking-tight text-[var(--text-1)]",
                isAr
                  ? "text-[clamp(1.75rem,4.5vw,3rem)] leading-[1.35]"
                  : "text-[clamp(1.85rem,4.5vw,3.2rem)] leading-[1.15]",
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
