"use client";

import { Download, Mail, Briefcase, Code2, Globe, Cpu, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

import { repairMojibakeDeep } from "@/lib/text-cleanup";
import { cvPageCopy } from "@/content/cv";
import { privacyCopy } from "@/content/legal";
import { caseStudyCopy } from "@/content/work";
import type { SiteViewModel } from "./site-view-model";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
});

// ═══════════════════════════════════
// CV PAGE
// ═══════════════════════════════════
export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(cvPageCopy[model.locale]);
  const isAr = model.locale === "ar";

  const skillIcons = [<Code2 className="h-4 w-4" key="code" />, <Globe className="h-4 w-4" key="globe" />, <Cpu className="h-4 w-4" key="cpu" />];

  return (
    <div className="relative pb-32" dir={isAr ? "rtl" : "ltr"} data-testid="cv-page">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[var(--os-teal)] opacity-[0.05] blur-[120px]" />
        </div>
        <div className="section-frame relative z-10 grid gap-14 lg:grid-cols-[1fr_380px] lg:items-center">
          <div>
            <motion.span {...inView(0)} className="eyebrow mb-6 inline-flex">{t.eyebrow}</motion.span>
            <motion.h1 {...inView(0.08)} className="headline-display text-[clamp(2rem,5vw,4rem)] font-bold text-[var(--os-text-1)]">
              {t.title}
            </motion.h1>
            <motion.p {...inView(0.15)} className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--os-text-2)]">
              {t.body}
            </motion.p>

            {/* Downloads */}
            <motion.div {...inView(0.22)} className="mt-8 flex flex-wrap gap-4">
              {model.downloads.branded && (
                <a href={model.downloads.branded} download className="btn-primary">
                  <Download className="h-4 w-4" /> {t.downloadDesigned}
                </a>
              )}
              {model.downloads.ats && (
                <a href={model.downloads.ats} download className="btn-secondary">
                  <Download className="h-4 w-4" /> {t.downloadAts}
                </a>
              )}
              {model.downloads.docx ? (
                <a href={model.downloads.docx} download className="btn-secondary">
                  <Download className="h-4 w-4" /> {isAr ? "تنزيل DOCX" : "Download DOCX"}
                </a>
              ) : null}
            </motion.div>
          </div>

          {/* Portrait */}
          <motion.div {...inView(0.1)} className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-full bg-[var(--os-violet)] opacity-[0.06] blur-[60px]" />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-[var(--os-border)] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <Image src={model.portraitImage || "/images/portrait.jpg"} alt="Mohammad Alfarras" fill className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--os-surface)] via-transparent to-transparent opacity-50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="py-20 bg-[var(--os-surface)]/30">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12">
            <span className="eyebrow">{t.experienceTitle}</span>
          </motion.div>
          <div className="space-y-6 max-w-3xl">
            {model.cvExperience.map((exp, i) => (
              <motion.div key={exp.id} {...inView(i * 0.08)} className="glass-card p-8">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[16px] font-bold text-[var(--os-text-1)]">{exp.role}</h3>
                    <p className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-[var(--os-teal)]">
                      <Briefcase className="h-3.5 w-3.5" /> {exp.company}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-[var(--os-text-3)] uppercase tracking-widest">{exp.period}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--os-text-3)]">{exp.location}</p>
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-[var(--os-text-2)]">{exp.description}</p>
                {exp.highlights.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {exp.highlights.map((h, j) => (
                      <li key={j} className="flex items-start gap-3 text-[12px] text-[var(--os-text-3)]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--os-teal)]" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-16">
        <div className="section-frame">
          <motion.div {...inView(0)} className="glass-card p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <span className="eyebrow mb-3 inline-flex">{isAr ? "اللغات" : "Languages"}</span>
              <p className="text-[15px] font-bold text-[var(--os-text-1)]">Arabic · German · English</p>
              <p className="mt-2 text-[13px] text-[var(--os-text-3)]">
                {isAr ? "محتوى وواجهات ثنائية وثلاثية اللغة حسب المشروع." : "Bilingual and trilingual content and UI work as the project requires."}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CV-linked projects */}
      {model.cvProjects.length > 0 ? (
        <section className="py-20 bg-[var(--os-surface)]/30">
          <div className="section-frame">
            <motion.div {...inView(0)} className="mb-12">
              <span className="eyebrow">{t.projectsTitle}</span>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-2">
              {model.cvProjects.map((proj, i) => (
                <motion.div key={proj.id} {...inView(i * 0.06)} className="glass-card p-6">
                  <h3 className="text-[15px] font-bold text-[var(--os-text-1)]">{proj.title}</h3>
                  <p className="mt-2 text-[13px] text-[var(--os-text-2)] line-clamp-3">{proj.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {proj.href ? (
                      <a href={proj.href} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-[var(--os-teal)] hover:underline">
                        {isAr ? "الموقع" : "Live site"} ↗
                      </a>
                    ) : null}
                    {proj.repoUrl ? (
                      <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-[var(--os-text-3)] hover:text-[var(--os-teal)]">
                        {isAr ? "المستودع" : "Repository"} ↗
                      </a>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Skills */}
      <section className="py-20">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12">
            <span className="eyebrow">{t.skillsTitle}</span>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {t.skillGroups.map((g, i) => (
              <motion.div key={g.title} {...inView(i * 0.08)} className="glass-card p-8">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]">
                  {skillIcons[i] ?? <Code2 className="h-4 w-4" />}
                </div>
                <h3 className="text-[14px] font-bold text-[var(--os-text-1)] mb-4">{g.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((item) => (
                    <span key={item} className="os-badge text-[11px]">{item}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 bg-[var(--os-surface)]/30">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-10">
            <span className="eyebrow">{t.ownershipTitle}</span>
          </motion.div>
          <div className="grid gap-4 max-w-3xl">
            {t.ownership.map((p, i) => (
              <motion.div key={i} {...inView(i * 0.07)} className="glass-card flex items-start gap-5 p-6">
                <span className="mt-0.5 text-[11px] font-bold tabular-nums text-[var(--os-teal)] opacity-60">0{i + 1}</span>
                <p className="text-[14px] leading-relaxed text-[var(--os-text-2)]">{p}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20">
        <div className="section-frame">
          <motion.div {...inView(0)} className="glass-card relative overflow-hidden rounded-[2rem] p-12 text-center border-[var(--os-teal-border)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--os-teal)]/[0.04] to-[var(--os-violet)]/[0.04]" />
            <h2 className="headline-display text-[2rem] font-bold text-[var(--os-text-1)]">{t.contactTitle}</h2>
            <p className="mt-4 text-[14px] text-[var(--os-text-2)]">{t.contactBody}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href={`/${model.locale}/contact`} className="btn-primary">{t.contactCta}</Link>
              <a href={`mailto:${model.contact.emailAddress}`} className="btn-secondary">
                <Mail className="h-4 w-4" /> {model.contact.emailAddress}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════
// PRIVACY PAGE
// ═══════════════════════════════════
export function PortfolioPrivacyPage({ locale }: { locale: string }) {
  const t = privacyCopy[locale as "en" | "ar"] ?? privacyCopy.en;
  const isAr = locale === "ar";
  return (
    <div className="relative pb-32 pt-32" dir={isAr ? "rtl" : "ltr"} data-testid="privacy-page">
      <div className="section-frame max-w-3xl">
        <motion.h1 {...inView(0)} className="headline-display text-[2.5rem] font-bold text-[var(--os-text-1)] mb-4">{t.title}</motion.h1>
        <motion.p {...inView(0.05)} className="text-[13px] text-[var(--os-text-3)] mb-10">{t.updated}</motion.p>
        <div className="space-y-8">
          {t.sections.map((s, i) => (
            <motion.div key={i} {...inView(i * 0.05)} className="glass-card p-8">
              <h2 className="text-[16px] font-bold text-[var(--os-text-1)] mb-4">{s.title}</h2>
              <p className="text-[14px] leading-relaxed text-[var(--os-text-2)]">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════
// PORTFOLIO PROJECT PAGE (case study)
// ═══════════════════════════════════
export function PortfolioProjectPage({ model, projectId }: { model: SiteViewModel; projectId: string }) {
  const t = repairMojibakeDeep(caseStudyCopy[model.locale]);
  const isAr = model.locale === "ar";
  const project = model.projects.find((p) => p.id === projectId || p.slug === projectId);

  if (!project) return (
    <div className="pt-40 text-center text-[var(--os-text-3)]">
      <p>Project not found.</p>
      <Link href={`/${model.locale}/work`} className="mt-8 btn-secondary inline-flex">← {isAr ? "العودة" : "Back"}</Link>
    </div>
  );

  return (
    <div className="relative pb-32 pt-28" dir={isAr ? "rtl" : "ltr"} data-testid="project-page">
      {/* Hero */}
      <section className="section-frame mb-16">
        <Link href={`/${model.locale}/work`} className="mb-8 inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--os-text-3)] hover:text-[var(--os-teal)] transition-colors">
          ← {isAr ? "العودة للأعمال" : "Back to work"}
        </Link>
        <motion.div {...inView(0)}>
          <span className="eyebrow mb-4 inline-flex">{project.eyebrow}</span>
          <h1 className="headline-display text-[clamp(2rem,5vw,4.5rem)] font-bold text-[var(--os-text-1)] mt-4">{project.title}</h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[var(--os-text-2)]">{project.description}</p>
        </motion.div>

        {project.image && (
          <motion.div {...inView(0.1)} className="mt-10 overflow-hidden rounded-[2rem] border border-[var(--os-border)] shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            <Image src={project.image} alt={project.title} width={1200} height={680} className="w-full h-auto object-cover" />
          </motion.div>
        )}
      </section>

      {/* Details */}
      <div className="section-frame grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {project.challenge && (
            <motion.div {...inView(0)} className="glass-card p-8">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-[var(--os-teal)] mb-4">{t.challenge}</h2>
              <p className="text-[14px] leading-relaxed text-[var(--os-text-2)]">{project.challenge}</p>
            </motion.div>
          )}
          {project.solution && (
            <motion.div {...inView(0.05)} className="glass-card p-8">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-[var(--os-teal)] mb-4">{t.solution}</h2>
              <p className="text-[14px] leading-relaxed text-[var(--os-text-2)]">{project.solution}</p>
            </motion.div>
          )}
          {project.result && (
            <motion.div {...inView(0.1)} className="glass-card p-8 border-[var(--os-teal-border)] bg-[var(--os-teal-soft)]/20">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-[var(--os-teal)] mb-4">{t.result}</h2>
              <p className="text-[14px] leading-relaxed text-[var(--os-text-2)]">{project.result}</p>
            </motion.div>
          )}
          {/* Gallery */}
          {project.gallery.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {project.gallery.map((img, i) => (
                <motion.div key={i} {...inView(i * 0.07)} className="overflow-hidden rounded-xl border border-[var(--os-border)]">
                  <Image src={img} alt={`${project.title} screenshot ${i + 1}`} width={640} height={400} className="w-full h-auto object-cover" />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {project.metrics.length > 0 && (
            <motion.div {...inView(0.08)} className="glass-card p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-text-3)]">{isAr ? "مؤشرات" : "Signals"}</p>
              <dl className="space-y-3">
                {project.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="text-[20px] font-black text-[var(--os-text-1)] tabular-nums">{m.value}</dt>
                    <dd className="text-[11px] text-[var(--os-text-3)]">{m.label}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}
          {project.tags.length > 0 && (
            <motion.div {...inView(0)} className="glass-card p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-text-3)]">{isAr ? "المجال" : "Stack & Tags"}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => <span key={tag} className="os-badge text-[11px]">{tag}</span>)}
              </div>
            </motion.div>
          )}
          {project.href && (
            <motion.div {...inView(0.05)}>
              <a href={project.href} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center">
                {project.ctaLabel} <ArrowUpRight className="h-4 w-4" />
              </a>
            </motion.div>
          )}
        </aside>
      </div>
    </div>
  );
}
