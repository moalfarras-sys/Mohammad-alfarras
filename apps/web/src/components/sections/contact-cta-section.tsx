"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/types/cms";

export function ContactCtaSection({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <section className="py-24" id="contact">
      <div className="section-frame">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card relative overflow-hidden rounded-[2rem] border-[var(--os-teal-border)] p-10 md:p-14"
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Bg accent */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--os-teal)]/[0.04] to-[var(--os-violet)]/[0.04]" />
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--os-teal)] opacity-[0.05] blur-[80px]" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="eyebrow mb-4 inline-flex">{isAr ? "تواصل" : "Contact"}</p>
              <h2 className="headline-display text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold text-[var(--os-text-1)]">
                {isAr
                  ? "لنبنِ المسار الصحيح من أول رسالة."
                  : "Let's map the right path from the first message."}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--os-text-2)]">
                {isAr
                  ? "متاح لمواقع الويب، أسطح المنتجات، MoPlayer، والاستشارة التقنية من ألمانيا وعن بُعد."
                  : "Available for web presence, product surfaces, MoPlayer consulting, and technical advisory — Germany based, operating globally."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={`/${locale}/contact`}
                className="btn-primary px-8 h-13"
              >
                {isAr ? "ابدأ المحادثة" : "Start the conversation"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
