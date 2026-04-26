import { ArrowUpRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { caseStudyCopy, getCaseStudyBySlug, workPageCopy } from "@/content/work";
import type { Locale } from "@/types/cms";

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => a.featuredRank - b.featuredRank);
}

function href(locale: Locale, slug: string) {
  return `/${locale}/work/${slug}`;
}

export function WorkPageBody({ model }: { model: SiteViewModel }) {
  const t = workPageCopy[model.locale];
  const caseCopy = caseStudyCopy[model.locale];
  const projects = sortedProjects(model);

  return (
    <>
      {/* ── WORK HERO ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40" data-testid="projects-page">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,200,212,0.08) 0%, transparent 60%)" }} />
        
        <div className="section-frame relative z-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.eyebrow}</p>
            <h1 className="mt-4 overflow-visible pb-2 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>
              {t.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[var(--text-2)] md:text-lg">{t.body}</p>
          </div>
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <div className="grid gap-12 lg:gap-20">
            {projects.map((project, index) => {
              const content = getCaseStudyBySlug(project.slug, model.locale);
              const isEven = index % 2 === 0;

              return (
                <article key={project.id} className="group relative">
                  {/* Cinematic Glow Behind Card */}
                  <div className="pointer-events-none absolute -inset-4 z-0 rounded-[var(--radius-xl)] bg-gradient-to-b from-[var(--primary-soft)] to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                  
                  <div className="glass relative z-10 overflow-hidden rounded-[var(--radius-xl)]" style={{ boxShadow: "var(--shadow-elevated)" }}>
                    <div className={`grid gap-0 lg:grid-cols-2 lg:items-stretch`}>
                      
                      {/* Image Side */}
                      <Link href={href(model.locale, project.slug)} className={`relative block min-h-[300px] overflow-hidden lg:min-h-full ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)]/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-20" />
                      </Link>

                      {/* Content Side */}
                      <div className={`flex flex-col justify-center p-8 md:p-12 lg:p-16 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                        <div className="flex items-center gap-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                            {content?.category ?? project.eyebrow}
                          </p>
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--glass-border)] to-transparent" />
                        </div>

                        <h2 className="mt-5 text-[clamp(1.8rem,3vw,2.5rem)] font-black leading-tight text-[var(--text-1)]">
                          {project.title}
                        </h2>
                        
                        <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-2)] md:text-base">
                          {content?.problem ?? project.description}
                        </p>

                        <div className="mt-8 grid gap-5 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-3)]">{t.role}</p>
                            <p className="mt-1 text-sm font-medium text-[var(--text-2)]">{content?.role ?? project.eyebrow}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-3)]">{t.stack}</p>
                            <p className="mt-1 text-sm font-medium text-[var(--text-2)]">
                              {(content?.stack ?? project.tags).slice(0, 4).join(" · ")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-2">
                          {(content?.proofChips ?? project.tags).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-2)]">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-4">
                          <Link href={href(model.locale, project.slug)} className="button-liquid-primary inline-flex items-center gap-2">
                            {t.open}
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          {project.href && (
                            <a href={project.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]">
                              <ExternalLink className="h-4 w-4" />
                              {content?.liveLabel ?? caseCopy.liveCta}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
