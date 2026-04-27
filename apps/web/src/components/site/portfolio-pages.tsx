import { ArrowUpRight, Download, Mail, PlayCircle, ShieldCheck, Clock, Briefcase, Code2, Globe, Cpu } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/cn";

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

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]", className)}>
      {children}
    </p>
  );
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex min-h-8 items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-2)]", className)}>
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
  const isAr = model.locale === "ar";

  return (
    <div className="relative pb-24">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-48 md:pb-24">
        {/* Background Accents */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[140px]" />
          <div className="absolute -left-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--text-3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <Frame className="relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-[var(--accent)]" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">{t.eyebrow}</p>
              </div>
              <h1 className="mt-8 headline-display text-[clamp(2.2rem,5vw,4.5rem)] font-black leading-[1.05] tracking-tight text-[var(--text-1)]">
                {t.title}
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--text-2)] md:text-xl">
                {t.body}
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <a href={model.downloads.branded} className="button-liquid-primary px-8">
                  <Download className="h-4 w-4" />
                  {t.downloadDesigned}
                </a>
                <a href={model.downloads.ats} className="button-liquid-secondary px-8">
                  <Download className="h-4 w-4" />
                  {t.downloadAts}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass relative rounded-[2.5rem] border border-[var(--glass-border)] p-8 md:p-12"
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
               <div className="absolute -inset-2 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 opacity-20 blur-2xl" />
               <div className="relative">
                  <h2 className="text-xl font-black text-[var(--text-1)] mb-8">{t.summaryTitle}</h2>
                  <div className="space-y-6">
                    {t.principles.map((item, idx) => (
                      <div key={idx} className="flex gap-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold leading-relaxed text-[var(--text-2)]">{item}</p>
                      </div>
                    ))}
                  </div>
               </div>
            </motion.div>
          </div>
        </Frame>
      </section>

      {/* ── SKILLS DASHBOARD ── */}
      <Section className="bg-white/[0.01]">
        <Frame>
          <div className="mb-12">
            <Eyebrow>{t.skillsTitle}</Eyebrow>
            <h2 className="headline-display mt-4 text-4xl font-black">Architecture & Execution</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {t.skillGroups.map((group, idx) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass group relative overflow-hidden rounded-[2rem] border border-[var(--glass-border)] p-8 transition-all hover:border-[var(--accent-glow)]"
              >
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   {idx === 0 ? <Code2 className="h-24 w-24" /> : idx === 1 ? <Briefcase className="h-24 w-24" /> : <ShieldCheck className="h-24 w-24" />}
                </div>
                <h3 className="text-lg font-black text-[var(--text-1)] mb-6">{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span key={item} className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--text-2)] hover:text-[var(--accent)] hover:border-[var(--accent-soft)] transition-colors">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Frame>
      </Section>

      {/* ── EXPERIENCE TIMELINE (CINEMATIC) ── */}
      <Section className="py-24">
        <Frame>
          <div className="max-w-4xl mx-auto">
            <div className="mb-20 text-center">
              <Eyebrow>{t.experienceTitle}</Eyebrow>
              <h2 className="headline-display mt-6 text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-tighter">Career Evolution</h2>
              <p className="mt-6 text-[var(--text-3)] font-bold uppercase tracking-[0.2em] text-xs">A narrative of growth across logistics and digital products</p>
            </div>

            <div className="relative space-y-24 before:absolute before:inset-y-0 before:left-4 before:w-[2px] before:bg-gradient-to-b before:from-[var(--accent)] before:via-[var(--accent)] before:to-transparent md:before:left-1/2 md:before:-translate-x-1/2">
              {model.cvExperience.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={cn("relative flex flex-col gap-8 md:flex-row md:items-center", idx % 2 !== 0 ? "md:flex-row-reverse" : "")}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[8px] top-0 z-20 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[var(--bg-base)] bg-[var(--accent)] shadow-[0_0_20px_rgba(0,229,255,0.6)] md:left-1/2" />
                  
                  {/* Period Indicator */}
                  <div className={cn("pl-10 md:w-1/2 md:pl-0", idx % 2 === 0 ? "md:text-right md:pr-16" : "md:text-left md:pl-16")}>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">{entry.period}</p>
                    <h3 className="text-2xl font-black text-[var(--text-1)]">{entry.role}</h3>
                    <p className="text-sm font-bold text-[var(--text-3)]">{entry.company} · {entry.location}</p>
                  </div>

                  {/* Content Card */}
                  <div className="pl-10 md:w-1/2 md:pl-0">
                    <div className={cn("glass relative rounded-[2rem] border border-[var(--glass-border)] p-8 md:p-10", idx % 2 === 0 ? "md:mr-auto" : "md:ml-auto")}>
                      <p className="text-sm leading-relaxed text-[var(--text-2)]">{entry.description}</p>
                      
                      <div className="mt-8 space-y-3">
                        {entry.highlights.map((h, i) => (
                          <div key={i} className="flex gap-3 text-[13px] font-medium leading-relaxed text-[var(--text-3)]">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Frame>
      </Section>

      {/* ── LANGUAGES & TOOLS ── */}
      <Section className="bg-slate-950/40">
        <Frame>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Language Proficiency */}
            <div className="glass rounded-[2.5rem] border border-[var(--glass-border)] p-10">
              <h3 className="text-lg font-black text-[var(--text-1)] mb-10 flex items-center gap-3">
                <Globe className="h-5 w-5 text-[var(--accent)]" />
                {isAr ? "اللغات" : "Language Proficiency"}
              </h3>
              <div className="space-y-8">
                {[
                  { label: isAr ? "العربية" : "Arabic", val: "100%", level: isAr ? "لغة أم" : "Native" },
                  { label: isAr ? "الإنجليزية" : "English", val: "95%", level: isAr ? "طلاقة مهنية" : "C1 - Professional" },
                  { label: isAr ? "الألمانية" : "German", val: "85%", level: isAr ? "مستوى متقدم - B2/C1" : "B2/C1 - Advanced" },
                ].map(lang => (
                  <div key={lang.label}>
                    <div className="mb-3 flex justify-between items-end">
                      <p className="font-black text-[var(--text-1)]">{lang.label}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{lang.level}</p>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: lang.val }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-[var(--accent)]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Ecosystem */}
            <div className="glass rounded-[2.5rem] border border-[var(--glass-border)] p-10">
              <h3 className="text-lg font-black text-[var(--text-1)] mb-10 flex items-center gap-3">
                <Cpu className="h-5 w-5 text-[var(--accent)]" />
                {isAr ? "سحابة الأدوات" : "Tools Ecosystem"}
              </h3>
              <div className="flex flex-wrap gap-3">
                {["Figma", "VS Code", "Android Studio", "Premiere Pro", "After Effects", "Notion", "GitHub", "Vercel", "Supabase", "Linear"].map((tool) => (
                  <motion.span 
                    key={tool} 
                    whileHover={{ scale: 1.05, borderColor: "var(--accent-glow)" }}
                    className="rounded-xl border border-[var(--glass-border)] bg-white/5 px-5 py-3 text-sm font-bold text-[var(--text-1)] transition-colors"
                  >
                    {tool}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Project Quick Access */}
          <div className="mt-8 glass rounded-[2.5rem] border border-[var(--glass-border)] p-10">
             <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-1)]">{isAr ? "إثباتات العمل" : "Proof of Work"}</h3>
                  <p className="text-sm text-[var(--text-3)] mt-1">{isAr ? "مشاريع مختارة تعكس المهارات المذكورة" : "Selected projects reflecting the core skills"}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {model.projects.slice(0, 4).map(p => (
                    <Link key={p.id} href={`/${model.locale}/work/${p.slug}`} className="group flex items-center gap-3 rounded-full border border-[var(--glass-border)] bg-white/5 px-6 py-2.5 transition-all hover:bg-[var(--accent-soft)] hover:border-[var(--accent-glow)]">
                      <div className="h-2 w-2 rounded-full bg-[var(--accent)] group-hover:scale-125 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-widest text-[var(--text-1)]">{p.title}</span>
                    </Link>
                  ))}
                </div>
             </div>
          </div>
        </Frame>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="pb-32">
        <Frame>
          <div className="glass relative overflow-hidden rounded-[3rem] border border-[var(--glass-border)] p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-600/5" />
            <div className="relative z-10 max-w-3xl mx-auto">
               <Eyebrow>{isAr ? "ماذا بعد؟" : "What is next?"}</Eyebrow>
               <h2 className="headline-display mt-8 text-4xl font-black text-[var(--text-1)]">{t.ownershipTitle}</h2>
               <div className="mt-12 grid gap-4 sm:grid-cols-2">
                 {t.ownership.map((item, idx) => (
                   <div key={idx} className="glass rounded-2xl p-6 border-white/5 text-left flex gap-4 items-start">
                      <div className="h-2 w-2 mt-2 rounded-full bg-[var(--accent)] shrink-0" />
                      <p className="text-sm font-bold leading-relaxed text-[var(--text-2)]">{item}</p>
                   </div>
                 ))}
               </div>
               <div className="mt-16 flex flex-col items-center gap-6">
                  <Link href={`/${model.locale}/contact`} className="button-liquid-primary px-12 py-5 text-lg">
                    {isAr ? "تواصل معي" : "Start a conversation"}
                  </Link>
                  <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-widest">{isAr ? "ألمانيا · متاح للمشاريع الجديدة" : "Germany · Available for new projects"}</p>
               </div>
            </div>
          </div>
        </Frame>
      </Section>
    </div>
  );
}

export function PortfolioProjectPage({ model, slug }: { model: SiteViewModel; slug: string }) {
  const project = model.projects.find((entry) => entry.slug === slug);
  if (!project) return null;

  const isAr = model.locale === "ar";
  const t = caseStudyCopy[model.locale];
  const gallery = project.gallery.length ? project.gallery : [project.image];
  const isMoPlayer = project.slug === "moplayer";

  return (
    <div className="relative pb-32" data-testid="project-page">
      {/* ── CINEMATIC HERO ── */}
      <section className="relative h-[90vh] min-h-[700px] w-full overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={project.image}
            alt={project.title}
            fill
            priority
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-[var(--bg-base)]" />
        
        <Frame className="relative h-full">
          <div className="flex h-full flex-col justify-end pb-20 md:pb-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={cn("flex items-center gap-3 mb-8", isAr ? "flex-row-reverse" : "")}>
                <span className="h-[1px] w-8 bg-[var(--accent)]" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">{project.eyebrow}</p>
              </div>
              <h1 className="headline-display text-[clamp(3rem,8vw,6rem)] font-black leading-[1] tracking-tighter text-[var(--text-1)]">
                {project.title}
              </h1>
              
              <div className={cn("mt-12 grid gap-10 md:grid-cols-4 border-t border-white/10 pt-10", isAr ? "flex-row-reverse" : "")}>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)] mb-2">Role</p>
                    <p className="text-sm font-black text-white">{isMoPlayer ? "Lead Architect" : "Frontend & Strategy"}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)] mb-2">Target</p>
                    <p className="text-sm font-black text-white">{isAr ? "السوق الألماني" : "German Market"}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)] mb-2">Status</p>
                    <p className="text-sm font-black text-emerald-400">Deployed & Operational</p>
                 </div>
                 <div className={cn("md:text-right", isAr ? "md:text-left" : "")}>
                    {project.href && (
                      <a href={project.href} target="_blank" className="button-liquid-primary px-8 h-14 bg-white text-black border-none hover:bg-slate-200">
                        {project.ctaLabel}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                 </div>
              </div>
            </motion.div>
          </div>
        </Frame>
      </section>

      {/* ── CASE STUDY GRID ── */}
      <section className="py-24">
        <Frame>
          <div className="grid gap-8 md:grid-cols-3">
             {[
               { title: t.challenge, body: project.challenge, icon: <Layout className="h-5 w-5" /> },
               { title: t.solution, body: project.solution, icon: <Cpu className="h-5 w-5" /> },
               { title: t.result, body: project.result, icon: <TrendingUp className="h-5 w-5" /> },
             ].map((card, idx) => (
               <motion.div
                 key={card.title}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
                 className="glass rounded-[2.5rem] p-10 border-white/5 bg-white/[0.01]"
               >
                 <div className="mb-6 h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--accent)] border border-white/10">
                    {card.icon}
                 </div>
                 <h3 className="text-xl font-black text-white mb-4">{card.title}</h3>
                 <p className="text-sm leading-relaxed text-slate-400">{card.body}</p>
               </motion.div>
             ))}
          </div>
        </Frame>
      </section>

      {/* ── TECHNICAL SPECS ── */}
      <section className="py-24 bg-white/[0.01]">
         <Frame>
            <div className="grid gap-16 lg:grid-cols-2">
               <div>
                  <Eyebrow>{isAr ? "مواصفات التكنولوجيا" : "Technical Specs"}</Eyebrow>
                  <h2 className="headline-display mt-6 text-4xl md:text-6xl font-black text-white tracking-tight">System Architecture</h2>
                  <p className="mt-8 text-lg text-slate-400 leading-relaxed max-w-xl">
                    High-performance execution using modern stacks tailored for operational stability and visual control.
                  </p>
                  
                  <div className="mt-12 grid grid-cols-2 gap-4">
                     {project.metrics.map((m, idx) => (
                        <div key={idx} className="glass rounded-2xl p-6 border-white/5">
                           <p className="text-2xl font-black text-white">{m.value}</p>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{m.label}</p>
                        </div>
                     ))}
                  </div>
               </div>
               
               <div className="glass rounded-[3rem] p-10 border-white/5 flex flex-col justify-center">
                  <h3 className="text-xl font-black text-white mb-8">{isAr ? "المهارات المستخدمة" : "Core Competencies"}</h3>
                  <div className="flex flex-wrap gap-3">
                     {project.tags.map(tag => (
                        <span key={tag} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300">
                           {tag}
                        </span>
                     ))}
                  </div>
                  {project.repoUrl && (
                    <div className="mt-10 pt-10 border-t border-white/10">
                       <a href={project.repoUrl} target="_blank" className="text-sm font-black uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2 hover:text-cyan-400 transition-colors">
                          <Code2 className="h-4 w-4" />
                          View Source Code
                       </a>
                    </div>
                  )}
               </div>
            </div>
         </Frame>
      </section>

      {/* ── CINEMATIC GALLERY ── */}
      <section className="py-24">
        <Frame>
          <div className="space-y-24">
            {gallery.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative glass rounded-[3.5rem] p-4 border-white/5 overflow-hidden shadow-2xl bg-white/[0.01]"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-[2.5rem]">
                  <Image
                    src={img}
                    alt={`${project.title} Gallery ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-8 md:p-12">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Phase 0{idx + 1}</p>
                   <h3 className="text-2xl font-black text-white tracking-tight">
                     {idx === 0 ? "Production Interface" : idx === 1 ? "Strategic Implementation" : "Final Delivery"}
                   </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </Frame>
      </section>

      <ContactCtaSection locale={model.locale} />
    </div>
  );
}

function CaseBlock({ title, items, chip = false }: { title: string; items: string[]; chip?: boolean }) {
  return (
    <div className="glass rounded-[2rem] p-8 border-white/5">
      <Eyebrow className="mb-4">{title}</Eyebrow>
      {chip ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="text-sm font-medium text-slate-400 flex items-start gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
               {item}
            </li>
          ))}
        </ul>
      )}
    </div>
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
