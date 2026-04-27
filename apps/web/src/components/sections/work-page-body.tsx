import { ArrowUpRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { caseStudyCopy, getCaseStudyBySlug, workPageCopy } from "@/content/work";
import type { Locale } from "@/types/cms";
import { cn } from "@/lib/cn";

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
  const isAr = model.locale === "ar";

  return (
    <div className="relative pb-32">
      {/* ── WORK HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32" data-testid="projects-page">
        {/* Background Accents */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--text-3) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="section-frame relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className={cn("flex items-center gap-3 mb-8", isAr ? "flex-row-reverse" : "")}>
               <span className="h-[1px] w-8 bg-[var(--accent)]" />
               <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">{t.eyebrow}</p>
            </div>
            <h1 className="headline-display text-[clamp(2.5rem,6vw,4.8rem)] font-black leading-[1.05] tracking-tight text-[var(--text-1)]">
              {t.title}
            </h1>
            <p className="mt-10 text-lg leading-relaxed text-[var(--text-2)] md:text-xl max-w-3xl">
              {t.body}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CASE STUDIES GRID ── */}
      <section className="relative z-10">
        <div className="section-frame">
          <div className="space-y-32 md:space-y-48">
            {projects.map((project, index) => {
              const content = getCaseStudyBySlug(project.slug, model.locale);
              const isEven = index % 2 === 0;

              return (
                <motion.article 
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative"
                >
                  <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
                    
                    {/* Visual Side */}
                    <div className={cn("relative", isEven ? "lg:order-1" : "lg:order-2")}>
                      <Link href={href(model.locale, project.slug)} className="block relative aspect-[16/10] overflow-hidden rounded-[2.5rem] border border-[var(--glass-border)] bg-slate-900 shadow-2xl">
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                        
                        {/* Hover Overlay Info */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100">
                           <div className="glass px-8 py-4 rounded-full border-white/20 text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                              {t.open}
                              <ArrowUpRight className="h-4 w-4" />
                           </div>
                        </div>
                      </Link>
                      
                      {/* Floating Accent */}
                      <div className={cn("absolute -z-10 h-64 w-64 rounded-full blur-[100px] opacity-20", index % 2 === 0 ? "-right-20 -top-20 bg-cyan-500" : "-left-20 -bottom-20 bg-violet-500")} />
                    </div>

                    {/* Content Side */}
                    <div className={cn("flex flex-col", isEven ? "lg:order-2" : "lg:order-1")}>
                      <div className={cn("flex items-center gap-4 mb-6", isAr ? "flex-row-reverse" : "")}>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{content?.category ?? project.eyebrow}</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--glass-border)] to-transparent" />
                      </div>

                      <h2 className="headline-display text-4xl md:text-5xl font-black text-[var(--text-1)] tracking-tight">
                        {project.title}
                      </h2>
                      
                      <p className="mt-8 text-lg leading-relaxed text-[var(--text-2)]">
                        {content?.problem ?? project.description}
                      </p>

                      <div className="mt-10 grid gap-8 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] mb-2">{t.role}</p>
                          <p className="text-[15px] font-bold text-[var(--text-1)] leading-snug">{content?.role ?? project.eyebrow}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] mb-2">{t.stack}</p>
                          <div className="flex flex-wrap gap-2">
                            {(content?.stack ?? project.tags).slice(0, 3).map(tag => (
                              <span key={tag} className="text-[13px] font-bold text-[var(--text-2)]">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className={cn("mt-12 flex flex-wrap items-center gap-6", isAr ? "flex-row-reverse" : "")}>
                        <Link href={href(model.locale, project.slug)} className="button-liquid-primary px-8">
                          {t.open}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                        {project.href && (
                          <a href={project.href} target="_blank" rel="noopener noreferrer" className={cn("group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[var(--text-2)] transition-colors hover:text-[var(--accent)]", isAr ? "flex-row-reverse" : "")}>
                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-3)] group-hover:bg-[var(--accent)] transition-colors" />
                            {content?.liveLabel ?? caseCopy.liveCta}
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="mt-32 md:mt-48">
        <div className="section-frame">
          <div className="glass relative overflow-hidden rounded-[3rem] border border-[var(--glass-border)] p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-violet-600/5" />
            <div className="relative z-10 max-w-3xl mx-auto">
               <h2 className="headline-display text-4xl font-black text-[var(--text-1)]">{isAr ? "هل لديك رؤية لمنتج أو خدمة؟" : "Have a vision for a product or service?"}</h2>
               <p className="mt-6 text-lg text-[var(--text-2)]">{isAr ? "لنحول هذا التعقيد إلى واجهة واضحة وثقة تبني أعمالاً حقيقية." : "Let's transform complexity into a clear interface and trust that builds real business."}</p>
               <div className="mt-12 flex flex-col items-center gap-6">
                  <Link href={`/${model.locale}/contact`} className="button-liquid-primary px-12 py-5 text-lg">
                    {isAr ? "ابدأ مشروعك" : "Start your project"}
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
