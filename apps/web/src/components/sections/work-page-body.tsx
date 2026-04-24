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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-2)]">
      {children}
    </span>
  );
}

export function WorkPageBody({ model }: { model: SiteViewModel }) {
  const t = workPageCopy[model.locale];
  const caseCopy = caseStudyCopy[model.locale];
  const projects = sortedProjects(model);
  const isAr = model.locale === "ar";

  return (
    <>
      <section className="pt-10 md:pt-16" data-testid="projects-page">
        <div className="section-frame">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{t.eyebrow}</p>
            <h1 className="headline-display mt-4 text-[clamp(2.2rem,6vw,4.8rem)] font-black leading-tight text-[var(--text-1)]">
              {t.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--text-2)] md:text-lg">{t.body}</p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-18">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{t.allTitle}</p>
          <div className="mt-6 grid gap-6">
            {projects.map((project) => {
              const content = getCaseStudyBySlug(project.slug, model.locale);
              return (
                <article key={project.id} className="glass overflow-hidden rounded-[var(--radius-lg)]">
                  <div className="grid gap-0 lg:grid-cols-[0.42fr_0.58fr]">
                    <Link href={href(model.locale, project.slug)} className="group relative block min-h-[260px] overflow-hidden">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 42vw"
                      />
                    </Link>
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip>{content?.category ?? project.eyebrow}</Chip>
                        {(content?.proofChips ?? project.tags).slice(0, 3).map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>

                      <h2 className="mt-5 text-[clamp(1.7rem,3vw,2.45rem)] font-black leading-tight text-[var(--text-1)]">
                        {project.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-2)] md:text-base">
                        {content?.problem ?? project.description}
                      </p>

                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">{t.role}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">{content?.role ?? project.eyebrow}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">{t.stack}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                            {(content?.stack ?? project.tags).slice(0, 3).join(" · ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">{t.proof}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-2)]">
                            {(content?.proofChips ?? project.tags).slice(0, 2).join(" · ")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link href={href(model.locale, project.slug)} className="button-liquid-primary">
                          {t.open}
                          <ArrowUpRight className={`h-4 w-4 ${isAr ? "-scale-x-100" : ""}`} />
                        </Link>
                        {project.href ? (
                          <a href={project.href} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary">
                            <ExternalLink className="h-4 w-4" />
                            {content?.liveLabel ?? caseCopy.liveCta}
                          </a>
                        ) : null}
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
