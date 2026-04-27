import { ArrowUpRight, Download, Mail, PlayCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

import { cvPageCopy } from "@/content/cv";
import { privacyCopy } from "@/content/legal";
import { homeContent, socialLinks } from "@/content/site";
import { caseStudyCopy, getCaseStudyBySlug } from "@/content/work";

import type { SiteProject, SiteViewModel } from "./site-view-model";

function Section({
  children,
  className = "",
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      data-testid={testId}
      className={`py-12 md:py-18 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`section-frame ${className}`}>{children}</div>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
      {children}
    </p>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-2)]">
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <motion.div 
    whileHover={{ y: -5, boxShadow: "var(--shadow-elevated)", borderColor: "var(--primary-border)" }} 
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={`glass rounded-[var(--radius-lg)] p-5 md:p-6 ${className}`}
  >
    {children}
  </motion.div>;
}

function formatCompactNumber(value: unknown, fallback: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
    return String(value);
  }
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

function projectHref(locale: SiteViewModel["locale"], project: SiteProject) {
  return `/${locale}/work/${project.slug}`;
}

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => a.featuredRank - b.featuredRank);
}

function projectContent(project: SiteProject, locale: SiteViewModel["locale"]) {
  return getCaseStudyBySlug(project.slug, locale);
}

export function PortfolioHomePage({ model }: { model: SiteViewModel }) {
  const t = homeContent[model.locale];
  const isAr = model.locale === "ar";
  const projects = sortedProjects(model).slice(0, 3);
  const youtubeStats = [
    { value: formatCompactNumber(model.youtube.views, t.youtubeProof[0].value), label: t.youtubeProof[0].label },
    { value: formatCompactNumber(model.youtube.subscribers, t.youtubeProof[1].value), label: t.youtubeProof[1].label },
    { value: formatCompactNumber(model.youtube.videos, t.youtubeProof[2].value), label: t.youtubeProof[2].label },
  ];

  return (
    <>
      <Section className="pt-10 md:pt-16" testId="home-hero">
        <Frame>
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Eyebrow>{t.eyebrow}</Eyebrow>
              <h1 className="headline-display mt-4 max-w-[22ch] overflow-visible text-[clamp(1.9rem,4.5vw,3.8rem)] font-black leading-[1.15] text-[var(--text-1)] pb-1">
                {t.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-2)] md:text-lg">
                {t.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/${model.locale}/work`} className="button-liquid-primary">
                  {t.primaryCta}
                  <ArrowUpRight className={`h-4 w-4 ${isAr ? "-scale-x-100" : ""}`} />
                </Link>
                <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-secondary">
                  {t.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto aspect-[4/5] max-w-[470px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">
                <Image
                  src={model.portraitImage || "/images/protofeilnew.jpeg"}
                  alt={model.locale === "ar" ? "محمد الفراس" : "Mohammad Alfarras"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 470px"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 to-transparent p-5 text-white">
                  <p className="text-sm font-bold">{model.profile.name}</p>
                  <p className="mt-1 text-xs leading-6 text-white/78">{model.profile.subtitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {t.proof.map((item) => (
              <Card key={item.label} className="rounded-[var(--radius-md)]">
                <div className="text-lg font-bold text-[var(--text-1)]">{item.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]">{item.label}</div>
              </Card>
            ))}
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <Eyebrow>{t.capabilitiesEyebrow}</Eyebrow>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {t.capabilities.map((item) => (
              <Card key={item.title}>
                <h2 className="text-xl font-bold text-[var(--text-1)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{item.body}</p>
              </Card>
            ))}
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow>{t.flagshipEyebrow}</Eyebrow>
              <h2 className="mt-3 text-[clamp(1.8rem,4vw,3.2rem)] font-black leading-tight text-[var(--text-1)]">
                {t.flagshipTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--text-2)]">{t.flagshipBody}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Android", "Android TV", "APK", "Support", "Privacy"].map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
              <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-primary mt-7">
                {isAr ? "استكشف المنتج" : "Explore the product"}
              </Link>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">
              <Image
                src="/images/moplayer-hero-3d-final.png"
                alt="MoPlayer"
                fill
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 620px"
              />
            </div>
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>{t.workEyebrow}</Eyebrow>
              <h2 className="mt-3 max-w-3xl text-[clamp(1.8rem,4vw,3rem)] font-black leading-tight text-[var(--text-1)]">
                {t.workTitle}
              </h2>
            </div>
            <Link href={`/${model.locale}/work`} className="button-liquid-secondary">
              {isAr ? "كل الأعمال" : "All work"}
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {projects.map((project) => {
              const content = projectContent(project, model.locale);
              return (
                <Link
                  href={projectHref(model.locale, project)}
                  key={project.id}
                  className="group glass block overflow-hidden rounded-[var(--radius-lg)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                      {content?.category ?? project.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-[var(--text-1)]">{project.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--text-2)]">
                      {content?.problem ?? project.summary}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <Eyebrow>{isAr ? "يوتيوب كدليل شرح" : "YouTube proof"}</Eyebrow>
              <h2 className="mt-3 text-3xl font-black text-[var(--text-1)]">
                {isAr ? "المحتوى التقني جزء من الثقة." : "Technical content is part of the trust story."}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">
                {isAr
                  ? "القناة تُظهر القدرة على الشرح، تنظيم الصورة، وبناء جمهور عربي حول التقنية والمنتجات."
                  : "The channel shows communication quality, visual discipline, and Arabic audience-building around technology and products."}
              </p>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary mt-6">
                <PlayCircle className="h-4 w-4" />
                {isAr ? "افتح القناة" : "Open channel"}
              </a>
            </Card>
            <div className="grid gap-3 sm:grid-cols-3">
              {youtubeStats.map((stat) => (
                <Card key={stat.label} className="flex flex-col justify-between rounded-[var(--radius-md)]">
                  <div className="text-3xl font-black text-[var(--text-1)]">{stat.value}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </Frame>
      </Section>

      <Section className="pb-20">
        <Frame>
          <Card className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <Eyebrow>{t.proofEyebrow}</Eyebrow>
              <h2 className="mt-3 text-3xl font-black text-[var(--text-1)]">{t.finalTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{t.finalBody}</p>
              <Link href={`/${model.locale}/contact`} className="button-liquid-primary mt-6">
                <Mail className="h-4 w-4" />
                {t.finalCta}
              </Link>
            </div>
            <ol className="grid gap-3">
              {t.process.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--bg)]">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-7 text-[var(--text-2)]">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </Frame>
      </Section>
    </>
  );
}

export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const t = cvPageCopy[model.locale];

  return (
    <>
      <section className="relative overflow-hidden pt-32 md:pt-40" data-testid="cv-page">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 90% 0%, rgba(124,58,237,0.08) 0%, transparent 60%)" }} />
        
        <div className="section-frame relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.eyebrow}</p>
              <h1 className="mt-4 overflow-visible pb-2 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,4.5vw,3.8rem)" }}>
                {t.title}
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-2)] md:text-lg">{t.body}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href={model.downloads.branded} className="button-liquid-primary inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t.downloadDesigned}
                </a>
                <a href={model.downloads.ats} className="button-liquid-secondary inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t.downloadAts}
                </a>
              </div>
            </div>

            {/* Profile summary card */}
            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>{t.summaryTitle}</h2>
              <ul className="mt-6 grid gap-4">
                {t.principles.map((item) => (
                  <li key={item} className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                      <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    </div>
                    <span className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.skillsTitle}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {t.skillGroups.map((group) => (
              <div key={group.title} className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>{group.title}</h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--glass-border)", color: "var(--text-2)", background: "var(--bg-elevated)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* ── LANGUAGES & TOOLS ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="grid gap-10 lg:grid-cols-2">
            
            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{model.locale === "ar" ? "اللغات" : "Language Bars"}</p>
              <div className="mt-8 grid gap-6">
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-[var(--text-1)]">
                    <span>{model.locale === "ar" ? "العربية" : "Arabic"}</span>
                    <span className="text-[var(--text-3)]">{model.locale === "ar" ? "لغة أم" : "Native"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full bg-[var(--accent)]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-[var(--text-1)]">
                    <span>{model.locale === "ar" ? "الإنجليزية" : "English"}</span>
                    <span className="text-[var(--text-3)]">{model.locale === "ar" ? "طلاقة مهنية" : "Fluent / Professional"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full bg-[var(--accent)]" style={{ width: "95%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-[var(--text-1)]">
                    <span>{model.locale === "ar" ? "الألمانية" : "German"}</span>
                    <span className="text-[var(--text-3)]">{model.locale === "ar" ? "مستوى متقدم - B2/C1" : "Advanced - B2/C1"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full bg-[var(--accent)]" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{model.locale === "ar" ? "سحابة الأدوات" : "Tools Cloud"}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Figma", "VS Code", "Android Studio", "Premiere Pro", "After Effects", "Notion", "GitHub", "Vercel", "Supabase", "Cursor", "Linear"].map((tool) => (
                  <span key={tool} className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] px-4 py-2 text-sm font-semibold text-[var(--text-1)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

          </div>
          
          <div className="mt-10 glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{model.locale === "ar" ? "مشاريع مميزة" : "Project Badges"}</p>
            <div className="mt-6 flex flex-wrap gap-4">
               {model.projects.slice(0, 4).map(p => (
                 <Link key={p.id} href={`/${model.locale}/work/${p.slug}`} className="flex items-center gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-2 hover:bg-[var(--glass-border)] transition">
                   <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                   <span className="text-sm font-bold text-[var(--text-1)]">{p.title}</span>
                 </Link>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.experienceTitle}</p>
            <div className="mt-8 grid gap-8 relative before:absolute before:inset-y-0 before:left-4 before:w-[2px] before:bg-gradient-to-b before:from-[var(--accent)] before:to-[var(--glass-border)] md:before:left-[160px]">
              {model.cvExperience.map((entry) => (
                <div key={entry.id} className="relative grid gap-4 pl-12 md:grid-cols-[140px_1fr] md:gap-10 md:pl-0">
                  <div className="absolute left-[11px] top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-[var(--bg-base)] md:left-[157px]" style={{ borderColor: "var(--accent)" }} />
                  
                  <div className="hidden pt-1 text-right text-xs font-bold md:block" style={{ color: "var(--text-3)" }}>
                    {entry.period}
                  </div>
                  
                  <div className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="md:hidden mb-2 text-xs font-bold" style={{ color: "var(--text-3)" }}>{entry.period}</div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>{entry.role}</h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      {entry.company} · {entry.location}
                    </p>
                    <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{entry.description}</p>
                    
                    {entry.highlights.length ? (
                      <ul className="mt-5 grid gap-2.5">
                        {entry.highlights.slice(0, 4).map((highlight) => (
                          <li key={highlight} className="flex gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-3)]" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OWNERSHIP ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.ownershipTitle}</p>
              <h2 className="mt-3 overflow-visible pb-1 font-black leading-[1.2] text-[var(--text-1)]" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)" }}>
                {t.ownershipTitle}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {t.ownership.map((item) => (
                <div key={item} className="glass rounded-[var(--radius-md)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="pb-24 pt-10">
        <div className="section-frame">
          <div className="glass flex flex-col items-start gap-6 rounded-[var(--radius-xl)] p-8 md:flex-row md:items-center md:justify-between md:p-12" style={{ background: "linear-gradient(135deg, rgba(0,200,212,0.05) 0%, rgba(124,58,237,0.04) 100%)", boxShadow: "var(--shadow-elevated)" }}>
            <div className="max-w-xl">
              <h2 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>{t.contactTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{t.contactBody}</p>
            </div>
            <Link href={`/${model.locale}/contact`} className="button-liquid-primary shrink-0">
              {t.contactCta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function PortfolioProjectPage({ model, slug }: { model: SiteViewModel; slug: string }) {
  const project = model.projects.find((entry) => entry.slug === slug);
  if (!project) return null;

  const t = caseStudyCopy[model.locale];
  const content = getCaseStudyBySlug(project.slug, model.locale);
  const gallery = project.gallery.length ? project.gallery : [project.image];
  const isMoPlayer = project.slug === "moplayer";

  return (
    <>
      <Section className="pt-10 md:pt-16">
        <Frame>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <Eyebrow>{content?.category ?? project.eyebrow}</Eyebrow>
              <h1 className="headline-display mt-4 text-[clamp(2.2rem,6vw,4.7rem)] font-black leading-tight text-[var(--text-1)]">
                {project.title}
              </h1>
              <p className="mt-5 text-base leading-8 text-[var(--text-2)]">
                {content?.problem ?? project.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(content?.proofChips ?? project.tags).slice(0, 6).map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {isMoPlayer ? (
                  <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-primary">
                    {t.productCta}
                  </Link>
                ) : null}
                {project.href ? (
                  <a href={project.href} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary">
                    {content?.liveLabel ?? t.liveCta}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">
              <Image
                src={project.image}
                alt={project.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 620px"
              />
            </div>
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Eyebrow>{t.role}</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{content?.role ?? project.eyebrow}</p>
            </Card>
            <Card>
              <Eyebrow>{t.problem}</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{content?.problem ?? project.challenge}</p>
            </Card>
            <Card>
              <Eyebrow>{t.outcome}</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{content?.outcome ?? project.result}</p>
            </Card>
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <div className="grid gap-5 lg:grid-cols-2">
            <CaseBlock title={t.constraints} items={content?.constraints ?? [project.challenge]} />
            <CaseText title={t.strategy} body={content?.strategy ?? project.solution} />
            <CaseBlock title={t.technical} items={content?.technicalDecisions ?? project.tags} />
            <CaseBlock title={t.ux} items={content?.uxDecisions ?? [project.solution]} />
            <CaseBlock title={t.changed} items={content?.changed ?? [project.result]} />
            <CaseBlock title={t.stack} items={content?.stack ?? project.tags} chip />
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <Eyebrow>{t.gallery}</Eyebrow>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {gallery.slice(0, 6).map((image, index) => (
              <figure key={`${image}-${index}`} className="glass overflow-hidden rounded-[var(--radius-lg)]">
                <div className="relative aspect-[16/11]">
                  <Image
                    src={image}
                    alt={`${project.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              </figure>
            ))}
          </div>
        </Frame>
      </Section>

      <Section>
        <Frame>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <CaseBlock title={t.lessons} items={content?.lessons ?? [project.result]} />
            <Card>
              <Eyebrow>{t.nextEyebrow}</Eyebrow>
              <h2 className="mt-3 text-3xl font-black text-[var(--text-1)]">{t.nextTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{t.nextBody}</p>
              <Link href={`/${model.locale}/contact`} className="button-liquid-primary mt-6">
                {t.nextCta}
              </Link>
            </Card>
          </div>
        </Frame>
      </Section>
    </>
  );
}

function CaseText({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{body}</p>
    </Card>
  );
}

function CaseBlock({ title, items, chip = false }: { title: string; items: string[]; chip?: boolean }) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      {chip ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip key={item}>{item}</Chip>
          ))}
        </div>
      ) : (
        <ul className="mt-4 grid gap-3">
          {items.map((item) => (
            <li key={item} className="text-sm leading-7 text-[var(--text-2)]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PortfolioPrivacyPage({ model }: { model: SiteViewModel }) {
  const t = privacyCopy[model.locale];

  return (
    <Section className="pt-10 md:pt-16">
      <Frame>
        <div className="max-w-4xl">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="headline-display mt-4 text-[clamp(2.1rem,6vw,4.5rem)] font-black leading-tight text-[var(--text-1)]">
            {t.title}
          </h1>
          <p className="mt-4 text-sm font-semibold text-[var(--accent)]">{t.updated}</p>
          <p className="mt-5 text-base leading-8 text-[var(--text-2)]">{t.intro}</p>
        </div>

        <div className="mt-10 grid gap-4">
          {t.sections.map((section) => (
            <Card key={section.title}>
              <h2 className="text-xl font-bold text-[var(--text-1)]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{section.body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-[color-mix(in_srgb,var(--accent)_45%,transparent)]">
          <h2 className="text-xl font-bold text-[var(--text-1)]">{t.todoTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{t.todo}</p>
        </Card>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`mailto:${socialLinks.email}`} className="button-liquid-primary">
            <Mail className="h-4 w-4" />
            {t.contact}
          </a>
          <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-secondary">
            MoPlayer
          </Link>
        </div>
      </Frame>
    </Section>
  );
}
