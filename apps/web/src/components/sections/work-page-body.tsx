"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Filter } from "lucide-react";
import { useState } from "react";

import type { SiteViewModel } from "@/components/site/site-view-model";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function WorkPageBody({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const locale = model.locale;
  const [filter, setFilter] = useState<string | null>(null);

  // Collect unique tags
  const allTags = Array.from(new Set(model.projects.flatMap((p) => p.tags))).slice(0, 10);

  const filtered = filter ? model.projects.filter((p) => p.tags.includes(filter)) : model.projects;

  return (
    <div className="relative pb-32 pt-28" dir={isAr ? "rtl" : "ltr"} data-testid="work-page">
      {/* Hero */}
      <section className="section-frame mb-20">
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[var(--os-violet)] opacity-[0.05] blur-[100px]" />
        <motion.span {...inView(0)} className="eyebrow mb-5 inline-flex">{isAr ? "الأعمال المختارة" : "Selected work"}</motion.span>
        <motion.h1 {...inView(0.06)} className="headline-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold text-[var(--os-text-1)] max-w-3xl">
          {isAr
            ? "أعمال تربط التصميم، التشغيل، والتنفيذ."
            : "Work that connects design, operations, and delivery."}
        </motion.h1>
        <motion.p {...inView(0.12)} className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--os-text-2)]">
          {isAr
            ? "مواقع، تطبيقات، ومنتجات رقمية لأعمال حقيقية — بهوية واضحة ونتائج ملموسة."
            : "Websites, apps, and digital products for real businesses — clear identity, tangible results."}
        </motion.p>
      </section>

      {/* Filter pills */}
      {allTags.length > 1 && (
        <section className="section-frame mb-12">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-3.5 w-3.5 text-[var(--os-text-3)]" />
            <button
              onClick={() => setFilter(null)}
              className={`os-badge cursor-pointer transition-colors ${!filter ? "border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]" : "hover:border-[var(--os-teal-border)]"}`}
            >
              {isAr ? "الكل" : "All"}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag === filter ? null : tag)}
                className={`os-badge cursor-pointer transition-colors ${filter === tag ? "border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]" : "hover:border-[var(--os-teal-border)]"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Projects grid */}
      <section className="section-frame">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project, i) => (
            <motion.article key={project.id} {...inView(i * 0.05)} className="glass-card group overflow-hidden flex flex-col">
              {/* Image */}
              <div className="relative h-52 shrink-0 overflow-hidden">
                <Image
                  src={project.image || "/images/hero_tech.png"}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--os-surface)] via-transparent to-transparent opacity-80" />
                {/* Eyebrow overlay */}
                <div className="absolute bottom-4 left-4">
                  <span className="eyebrow text-[9px]">{project.eyebrow}</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-7">
                <h2 className="text-[17px] font-bold text-[var(--os-text-1)] leading-snug">{project.title}</h2>
                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-[var(--os-text-3)] line-clamp-3">{project.summary}</p>

                {/* Tags */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="os-badge text-[10px]">{tag}</span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-6 flex items-center gap-3">
                  <Link
                    href={`/${locale}/work/${project.slug}`}
                    className="flex-1 btn-secondary justify-center text-[12px]"
                  >
                    {project.ctaLabel}
                  </Link>
                  {project.href && (
                    <a href={project.href} target="_blank" rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--os-border)] text-[var(--os-text-3)] hover:border-[var(--os-teal-border)] hover:text-[var(--os-teal)] transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center text-[var(--os-text-3)]">
            <p>{isAr ? "لا توجد أعمال في هذه الفئة" : "No projects in this category"}</p>
          </div>
        )}
      </section>
    </div>
  );
}
