"use client";

import Link from "next/link";

import type { Locale } from "@/types/cms";

export function ContactCtaSection({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <section className="py-[var(--section-py)]" id="contact">
      <div className="section-frame">
        <div className="glass relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-10 md:px-12 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
                {isAr ? "تواصل" : "Contact"}
              </p>
              <h2 className="font-display mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-[var(--text-1)]">
                {isAr ? "لنبنِ المسار الصحيح من أول رسالة" : "Build the right path from the first message"}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-2)] md:text-lg">
                {isAr
                  ? "متاح لمواقع الويب، أسطح المنتجات، دراسات الحالة، والدعم التقني من ألمانيا وعن بُعد."
                  : "Available for web presence, product surfaces, case studies, and technical consulting from Germany and remote."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={`/${locale}/contact`} className="button-liquid-primary min-h-[48px] min-w-[min(100%,200px)] justify-center">
                {isAr ? "← ابدأ المحادثة" : "Start the conversation →"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
