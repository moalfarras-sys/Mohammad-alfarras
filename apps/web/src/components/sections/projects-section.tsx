"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import type { SiteViewModel } from "@/components/site/site-view-model";
import type { Locale } from "@/types/cms";

function caseStudyHref(locale: Locale, slug: string) {
  return `/${locale}/work/${slug}`;
}

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => {
    const rankA = typeof a.featuredRank === "number" ? a.featuredRank : 999;
    const rankB = typeof b.featuredRank === "number" ? b.featuredRank : 999;
    return rankA - rankB;
  });
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[var(--text-2)] backdrop-blur-sm">
      {children}
    </span>
  );
}

export function ProjectsSection({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const reduced = useReducedMotion();
  const ordered = sortedProjects(model);
  const featured = ordered[0];
  const rest = ordered.slice(1, 5);

  if (!featured) return null;

  return (
    <section className="py-[var(--section-py)]" id="work">
      <div className="section-frame">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
          {isAr ? "الأعمال" : "Work"}
        </p>
        <h2 className="font-display mt-3 max-w-[22ch] text-[clamp(1.75rem,4vw,2.85rem)] font-extrabold leading-tight text-[var(--text-1)]">
          {isAr ? "مشاريع مختارة" : "Selected projects"}
        </h2>
        <p className="prose-frame mt-4 text-base text-[var(--text-2)] md:text-lg">
          {isAr
            ? "تجارب رقمية مبنية لرفع الثقة، وتبسيط الرسالة، وتحسين الانطباع الأول."
            : "Digital work built to lift trust, clarify the story, and sharpen the first impression."}
        </p>

        <div className="mt-12 space-y-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0.15 : 0.55 }}
            className="group relative overflow-hidden glass rounded-[28px]"
          >
            <div className="grid gap-0 lg:grid-cols-2">
              <Link
                href={caseStudyHref(model.locale, featured.slug)}
                className="relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[320px]"
              >
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#030712]/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="p-6 text-sm font-semibold text-white">
                    {isAr ? "عرض المشروع →" : "View Project →"}
                  </span>
                </div>
              </Link>
              <div className="flex flex-col justify-center p-6 md:p-8">
                <div className="mb-3 flex flex-wrap gap-2">
                  {featured.tags.slice(0, 5).map((tag) => (
                    <TechBadge key={tag}>{tag}</TechBadge>
                  ))}
                </div>
                <h3 className="font-display text-2xl font-bold text-[var(--text-1)]">{featured.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--text-2)]">{featured.summary}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={caseStudyHref(model.locale, featured.slug)} className="button-liquid-primary">
                    {isAr ? "← عرض المشروع" : "View Project →"}
                  </Link>
                  {featured.href ? (
                    <a
                      href={featured.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-liquid-secondary"
                    >
                      {isAr ? "↗ معاينة مباشرة" : "↗ Live Demo"}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.article>

          <div className="grid gap-6 md:grid-cols-2">
            {rest.map((project, idx) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0.15 : 0.45, delay: reduced ? 0 : idx * 0.06 }}
                className="group relative overflow-hidden glass rounded-[28px]"
              >
                <Link
                  href={caseStudyHref(model.locale, project.slug)}
                  className="relative block aspect-[16/10] overflow-hidden rounded-t-[28px]"
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#030712]/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="p-5 text-sm font-semibold text-white">
                      {isAr ? "عرض المشروع →" : "View Project →"}
                    </span>
                  </div>
                </Link>
                <div className="p-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {project.tags.slice(0, 4).map((tag) => (
                      <TechBadge key={tag}>{tag}</TechBadge>
                    ))}
                  </div>
                  <h3 className="font-display text-xl font-bold text-[var(--text-1)]">{project.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{project.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={caseStudyHref(model.locale, project.slug)} className="button-liquid-primary text-sm">
                      {isAr ? "← التفاصيل" : "Details →"}
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
