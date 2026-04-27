"use client";

import { ArrowUpRight, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useSpring, useMotionValue, useReducedMotion, useTransform } from "framer-motion";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { caseStudyCopy, getCaseStudyBySlug, workPageCopy } from "@/content/work";
import type { Locale } from "@/types/cms";
import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => a.featuredRank - b.featuredRank);
}

function href(locale: Locale, slug: string) {
  return `/${locale}/work/${slug}`;
}

function TiltProject({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={reduced ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("relative group max-w-full", className)}
    >
      <div className="relative z-10 max-w-full">
        {children}
      </div>
    </motion.div>
  );
}

export function WorkPageBody({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(workPageCopy[model.locale]);
  const caseCopy = repairMojibakeDeep(caseStudyCopy[model.locale]);
  const projects = sortedProjects(model);
  const isAr = model.locale === "ar";

  return (
    <div className="relative overflow-hidden pb-32">
      {/* ── WORK HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32" data-testid="projects-page">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
        </div>

        <div className="section-frame relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <div className={cn("flex items-center gap-3 mb-8", isAr ? "flex-row-reverse" : "")}>
               <span className="h-[1px] w-8 bg-cyan-500" />
               <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500">{t.eyebrow}</p>
            </div>
            <h1 className="headline-display text-[clamp(2.5rem,8vw,6.5rem)] font-black leading-[1] tracking-tight text-white">
              {t.title}
            </h1>
            <p className="mt-10 text-xl leading-relaxed text-slate-400 max-w-3xl">
              {t.body}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CASE STUDIES GRID ── */}
      <section className="relative z-10">
        <div className="section-frame">
          <div className="space-y-32 md:space-y-64">
            {projects.map((project, index) => {
              const content = getCaseStudyBySlug(project.slug, model.locale);
              const isEven = index % 2 === 0;

              return (
                <motion.article 
                  key={project.id}
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-150px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative max-w-full"
                >
                  <div className="grid max-w-full gap-12 md:gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
                    
                    {/* Visual Side */}
                    <div className={cn("relative min-w-0 max-w-full", isEven ? "lg:order-1" : "lg:order-2")}>
                      <TiltProject>
                        <Link href={href(model.locale, project.slug)} className="block relative aspect-[16/10] w-full max-w-full overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900 shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:rounded-[3rem] lg:rounded-[3.5rem]">
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            sizes="(max-width: 1024px) 100vw, 55vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 scale-90 group-hover:scale-100">
                             <div className="glass px-10 py-5 rounded-full border-white/20 text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-3 shadow-2xl">
                                {t.open}
                                <ArrowUpRight className="h-4 w-4" />
                             </div>
                          </div>
                        </Link>
                      </TiltProject>
                      
                      {/* Decorative Label */}
                      <div className={cn("pointer-events-none absolute top-4 z-20 p-2 sm:top-8 sm:p-4", isEven ? "left-3 sm:-left-4" : "right-3 sm:-right-4")}>
                         <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 shadow-2xl backdrop-blur-xl sm:px-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">0{index + 1} / Project</span>
                         </div>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className={cn("flex flex-col", isEven ? "lg:order-2" : "lg:order-1")}>
                      <div className={cn("flex items-center gap-4 mb-8", isAr ? "flex-row-reverse" : "")}>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">{content?.category ?? project.eyebrow}</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                      </div>

                      <h2 className="headline-display text-4xl md:text-7xl font-black text-white tracking-tight leading-tight">
                        {project.title}
                      </h2>
                      
                      <p className="mt-8 text-lg leading-relaxed text-slate-400 font-medium">
                        {content?.problem ?? project.description}
                      </p>

                      <div className="mt-12 grid gap-10 sm:grid-cols-2 border-t border-white/5 pt-12">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">{t.role}</p>
                          <p className="text-lg font-black text-white leading-snug">{content?.role ?? project.eyebrow}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">{t.stack}</p>
                          <div className="flex flex-wrap gap-2">
                            {(content?.stack ?? project.tags).slice(0, 4).map(tag => (
                              <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className={cn("mt-16 flex flex-wrap items-center gap-8", isAr ? "flex-row-reverse" : "")}>
                        <Link href={href(model.locale, project.slug)} className="button-liquid-primary px-12 h-16 text-sm">
                          {t.open}
                          <ArrowUpRight className="h-5 w-5" />
                        </Link>
                        {project.href && (
                          <a href={project.href} target="_blank" rel="noopener noreferrer" className={cn("group flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:text-cyan-400", isAr ? "flex-row-reverse" : "")}>
                            <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                               <Globe className="h-4 w-4" />
                            </div>
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
      <section className="py-48">
        <div className="section-frame">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="glass relative overflow-hidden rounded-[4rem] border-white/5 p-16 md:p-32 text-center shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-transparent to-violet-600/10" />
            <div className="relative z-10 max-w-4xl mx-auto">
               <Eyebrow className="mx-auto">{isAr ? "رؤية منتج" : "Product Vision"}</Eyebrow>
               <h2 className="headline-display mt-8 text-4xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">
                 {isAr ? "لنحوّل التعقيد إلى واجهة واضحة." : "Let's turn complexity into a clear interface."}
               </h2>
               <div className="mt-20 flex flex-col items-center gap-8">
                  <Link href={`/${model.locale}/contact`} className="button-liquid-primary px-16 h-20 text-xl font-black">
                    {isAr ? "ابدأ مشروعك" : "Start your project"}
                  </Link>
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">{isAr ? "متاح لمشاريع مختارة" : "Open for selected projects"}</p>
               </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
       <span className="h-[1px] w-8 bg-cyan-500" />
       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">{children}</p>
    </div>
  );
}
