"use client";

import { ArrowUpRight, Download, Mail, ShieldCheck, Briefcase, Code2, Globe, Cpu, TrendingUp, Layout, Zap } from "lucide-react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

import { cvPageCopy } from "@/content/cv";
import { privacyCopy } from "@/content/legal";
import { socialLinks } from "@/content/site";
import { caseStudyCopy } from "@/content/work";

import type { SiteViewModel } from "./site-view-model";

// ── SHARED ANIMATIONS ──

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      data-testid={testId}
      className={`py-12 md:py-24 ${className}`}
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
    <div className={cn("flex items-center gap-3", className)}>
       <span className="h-[1px] w-8 bg-cyan-500" />
       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">{children}</p>
    </div>
  );
}

function TiltSkillCard({ children, icon, title, delay = 0 }: { children: React.ReactNode; icon: React.ReactNode; title: string; delay?: number }) {
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative"
    >
      <div style={{ transform: "translateZ(30px)" }} className="relative z-10 glass h-full rounded-[2.5rem] border-white/5 p-10 bg-white/[0.01] transition-all hover:bg-white/[0.03]">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
           {icon}
        </div>
        <h3 className="text-xl font-black text-white mb-8 tracking-tight">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      </div>
      <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// ── CONTACT CTA COMPONENT ──

function ContactCtaSection({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  return (
    <Section>
      <Frame>
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="glass relative overflow-hidden rounded-[3.5rem] border-white/5 p-16 md:p-24 text-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 via-transparent to-violet-600/5" />
          <div className="relative z-10 max-w-4xl mx-auto">
             <Eyebrow className="mx-auto">{isAr ? "دعنا نبدأ" : "Let's Connect"}</Eyebrow>
             <h2 className="headline-display mt-8 text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight">
               {isAr ? "حول رؤيتك إلى منتج رقمي متكامل." : "Transform your vision into a digital reality."}
             </h2>
             <div className="mt-16 flex flex-col items-center gap-8">
                <Link href={`/${locale}/contact`} className="button-liquid-primary px-16 h-20 text-xl font-black">
                  {isAr ? "ابدأ المحادثة" : "Start Conversation"}
                </Link>
             </div>
          </div>
        </motion.div>
      </Frame>
    </Section>
  );
}

// ── CV PAGE ──

export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(cvPageCopy[model.locale]);
  const isAr = model.locale === "ar";

  return (
    <div className="relative pb-24">
      {/* ── CV HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -right-1/4 top-0 h-[700px] w-[700px] rounded-full bg-violet-600/5 blur-[140px]" />
        </div>

        <Frame className="relative z-10">
          {/* Motion Asset Background */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-20 w-[800px] h-[800px] pointer-events-none z-[-1]"
          >
             <Image src="/images/career-motion.png" alt="Motion" width={800} height={800} className="w-full h-full object-contain" />
          </motion.div>

          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Eyebrow>{t.eyebrow}</Eyebrow>
              <h1 className="mt-8 headline-display text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[1] tracking-tighter text-white">
                {t.title}
              </h1>
              <p className="mt-10 max-w-2xl text-xl leading-relaxed text-slate-400 font-medium">
                {t.body}
              </p>
              
              <div className="mt-12 flex flex-wrap gap-6">
                <a href={model.downloads.branded} className="button-liquid-primary h-16 px-10 text-sm">
                  <Download className="h-4 w-4" />
                  {t.downloadDesigned}
                </a>
                <a href={model.downloads.ats} className="button-liquid-secondary h-16 px-10 text-sm">
                  <Download className="h-4 w-4" />
                  {t.downloadAts}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="glass relative rounded-[3rem] border border-white/5 p-10 md:p-14 shadow-2xl"
            >
               <h2 className="text-2xl font-black text-white mb-10 tracking-tight">{t.summaryTitle}</h2>
               <div className="space-y-8">
                 {t.principles.map((item, idx) => (
                   <div key={idx} className="flex gap-6 group">
                     <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                       <ShieldCheck className="h-6 w-6" />
                     </div>
                     <p className="text-base font-bold leading-relaxed text-slate-300 pt-1">{item}</p>
                   </div>
                 ))}
               </div>
            </motion.div>
          </div>
        </Frame>
      </section>

      {/* ── SKILLS GRID (WOOW) ── */}
      <Section className="bg-white/[0.01]">
        <Frame>
          <div className="mb-20">
            <Eyebrow>{t.skillsTitle}</Eyebrow>
            <h2 className="headline-display mt-6 text-4xl md:text-7xl font-black text-white tracking-tighter">Architecture & Execution</h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {t.skillGroups.map((group, idx) => (
              <TiltSkillCard 
                key={group.title} 
                title={group.title} 
                delay={idx * 0.1}
                icon={idx === 0 ? <Code2 className="h-32 w-32" /> : idx === 1 ? <Briefcase className="h-32 w-32" /> : <ShieldCheck className="h-32 w-32" />}
              >
                {group.items.map((item) => (
                  <span key={item} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
                    {item}
                  </span>
                ))}
              </TiltSkillCard>
            ))}
          </div>
        </Frame>
      </Section>

      {/* ── EXPERIENCE TIMELINE ── */}
      <Section>
        <Frame>
          <div className="max-w-5xl mx-auto">
            <div className="mb-24 text-center">
              <Eyebrow className="mx-auto">{t.experienceTitle}</Eyebrow>
              <h2 className="headline-display mt-8 text-4xl md:text-8xl font-black tracking-tighter text-white">Career Evolution</h2>
              <p className="mt-8 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">A narrative of growth across logistics and digital products</p>
            </div>

            <div className="relative space-y-32 before:absolute before:inset-y-0 before:left-4 before:w-[1px] before:bg-white/10 md:before:left-1/2 md:before:-translate-x-1/2">
              {model.cvExperience.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={cn("relative flex flex-col gap-12 md:flex-row md:items-center", idx % 2 !== 0 ? "md:flex-row-reverse" : "")}
                >
                  <div className="absolute left-[16px] top-0 z-20 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-[#050811] bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.6)] md:left-1/2" />
                  
                  <div className={cn("pl-12 md:w-1/2 md:pl-0", idx % 2 === 0 ? "md:text-right md:pr-20" : "md:text-left md:pl-20")}>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-3">{entry.period}</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{entry.role}</h3>
                    <p className="text-sm font-black text-slate-500 mt-2 uppercase tracking-widest">{entry.company} · {entry.location}</p>
                  </div>

                  <div className="pl-12 md:w-1/2 md:pl-0">
                    <div className="glass relative rounded-[3rem] border border-white/5 p-10 md:p-12 hover:bg-white/[0.02] transition-colors group">
                      <p className="text-base leading-relaxed text-slate-400 font-medium">{entry.description}</p>
                      
                      <div className="mt-10 space-y-4">
                        {entry.highlights.map((h, i) => (
                          <div key={i} className="flex gap-4 text-sm font-bold leading-relaxed text-slate-500">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/50 group-hover:bg-cyan-500 transition-colors" />
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
      <Section className="bg-white/[0.01]">
        <Frame>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="glass rounded-[3.5rem] border border-white/5 p-12">
              <h3 className="text-xl font-black text-white mb-12 flex items-center gap-4">
                <Globe className="h-6 w-6 text-cyan-500" />
                {isAr ? "اللغات" : "Language Proficiency"}
              </h3>
              <div className="space-y-10">
                {[
                  { label: isAr ? "العربية" : "Arabic", val: "100%", level: isAr ? "لغة أم" : "Native" },
                  { label: isAr ? "الإنجليزية" : "English", val: "95%", level: isAr ? "طلاقة مهنية" : "C1 - Professional" },
                  { label: isAr ? "الألمانية" : "German", val: "85%", level: isAr ? "مستوى متقدم - B2/C1" : "B2/C1 - Advanced" },
                ].map(lang => (
                  <div key={lang.label}>
                    <div className="mb-4 flex justify-between items-end">
                      <p className="font-black text-white text-lg">{lang.label}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang.level}</p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: lang.val }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[3.5rem] border border-white/5 p-12">
              <h3 className="text-xl font-black text-white mb-12 flex items-center gap-4">
                <Cpu className="h-6 w-6 text-violet-500" />
                {isAr ? "سحابة الأدوات" : "Tools Ecosystem"}
              </h3>
              <div className="flex flex-wrap gap-4">
                {["Figma", "VS Code", "Android Studio", "Premiere Pro", "After Effects", "Notion", "GitHub", "Vercel", "Supabase", "Linear", "VLC lib"].map((tool) => (
                  <motion.span 
                    key={tool} 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.2)" }}
                    className="px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02] text-sm font-black uppercase tracking-widest text-slate-300 transition-all cursor-default"
                  >
                    {tool}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </Frame>
      </Section>

      <ContactCtaSection locale={model.locale} />
    </div>
  );
}

// ── PROJECT PAGE ──

export function PortfolioProjectPage({ model, slug }: { model: SiteViewModel; slug: string }) {
  const project = model.projects.find((entry) => entry.slug === slug);
  if (!project) return null;

  const isAr = model.locale === "ar";
  const t = repairMojibakeDeep(caseStudyCopy[model.locale]);
  const gallery = project.gallery.length ? project.gallery : [project.image];
  const isMoPlayer = project.slug === "moplayer";

  return (
    <div className="relative pb-32" data-testid="project-page">
      {/* ── PROJECT HERO ── */}
      <section className="relative h-[90vh] min-h-[700px] w-full overflow-hidden">
        <motion.div 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image src={project.image} alt={project.title} fill priority className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-[#050811]" />
        
        <Frame className="relative h-full">
          <div className="flex h-full flex-col justify-end pb-24 md:pb-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Eyebrow>{project.eyebrow}</Eyebrow>
              <h1 className="headline-display text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.9] tracking-tighter text-white mt-8">
                {project.title}
              </h1>
              
              <div className={cn("mt-16 grid gap-12 md:grid-cols-4 border-t border-white/10 pt-16", isAr ? "flex-row-reverse" : "")}>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Role</p>
                    <p className="text-base font-black text-white uppercase tracking-widest">{isMoPlayer ? "Lead Architect" : "Frontend & Strategy"}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Target</p>
                    <p className="text-base font-black text-white uppercase tracking-widest">{isAr ? "السوق الألماني" : "German Market"}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Status</p>
                    <p className="text-base font-black text-emerald-400 uppercase tracking-widest">Operational</p>
                 </div>
                 <div className={cn("md:text-right", isAr ? "md:text-left" : "")}>
                    {project.href && (
                      <a href={project.href} target="_blank" className="button-liquid-primary px-10 h-16 bg-white text-black border-none hover:bg-slate-200 shadow-2xl">
                        {project.ctaLabel}
                        <ArrowUpRight className="h-5 w-5" />
                      </a>
                    )}
                 </div>
              </div>
            </motion.div>
          </div>
        </Frame>
      </section>

      {/* ── NARRATIVE GRID ── */}
      <section className="py-32">
        <Frame>
          <div className="grid gap-10 md:grid-cols-3">
             {[
               { title: t.challenge, body: project.challenge, icon: <Layout className="h-6 w-6" /> },
               { title: t.solution, body: project.solution, icon: <Cpu className="h-6 w-6" /> },
               { title: t.result, body: project.result, icon: <TrendingUp className="h-6 w-6" /> },
             ].map((card, idx) => (
               <motion.div
                 key={card.title}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
                 className="glass rounded-[3rem] p-12 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
               >
                 <div className="mb-10 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/10">
                    {card.icon}
                 </div>
                 <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{card.title}</h3>
                 <p className="text-base leading-relaxed text-slate-400 font-medium">{card.body}</p>
               </motion.div>
             ))}
          </div>
        </Frame>
      </section>

      {/* ── SPECS & TECH ── */}
      <section className="py-32 bg-white/[0.01]">
         <Frame>
            <div className="grid gap-20 lg:grid-cols-2 items-center">
               <div>
                  <Eyebrow>{isAr ? "المعايير التقنية" : "Technical Metrics"}</Eyebrow>
                  <h2 className="headline-display mt-8 text-4xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">Architecture Integrity.</h2>
                  <p className="mt-10 text-xl text-slate-500 leading-relaxed max-w-xl font-medium">
                    Built for performance and operational stability using modern tech stacks.
                  </p>
                  
                  <div className="mt-16 grid grid-cols-2 gap-6">
                     {project.metrics.map((m, idx) => (
                        <div key={idx} className="glass rounded-[2rem] p-8 border-white/5">
                           <p className="text-3xl font-black text-white tracking-tight">{m.value}</p>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">{m.label}</p>
                        </div>
                     ))}
                  </div>
               </div>
               
               <div className="glass rounded-[4rem] p-12 md:p-16 border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-16 opacity-[0.03]">
                     <Code2 className="h-64 w-64 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-10 tracking-tight">{isAr ? "القدرات المنفذة" : "Core Competencies"}</h3>
                  <div className="flex flex-wrap gap-4">
                     {project.tags.map(tag => (
                        <span key={tag} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                           {tag}
                        </span>
                     ))}
                  </div>
               </div>
            </div>
         </Frame>
      </section>

      {/* ── CINEMATIC GALLERY ── */}
      <section className="py-32">
        <Frame>
          <div className="space-y-32">
            {gallery.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-150px" }}
                className="relative glass rounded-[4rem] p-4 border-white/5 overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)] bg-white/[0.01]"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-[3rem]">
                  <Image src={img} alt={`${project.title} Gallery ${idx + 1}`} fill className="object-cover transition-transform duration-1000 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-12 md:p-16 flex items-center justify-between">
                   <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-3">Module 0{idx + 1}</p>
                      <h3 className="text-3xl font-black text-white tracking-tight">
                        {idx === 0 ? "Production Interface" : idx === 1 ? "Operational Logic" : "Final Outcome"}
                      </h3>
                   </div>
                   <div className="h-16 w-16 rounded-full border border-white/10 flex items-center justify-center opacity-20">
                      <Zap className="h-6 w-6 text-white" />
                   </div>
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

export function PortfolioPrivacyPage({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(privacyCopy[model.locale]);

  return (
    <div className="pt-32 pb-32">
      <Frame>
        <div className="max-w-4xl">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="headline-display mt-8 text-[clamp(2.5rem,7vw,5rem)] font-black leading-[1] tracking-tighter text-white">
            {t.title}
          </h1>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-cyan-500">{t.updated}</p>
          <p className="mt-8 text-xl leading-relaxed text-slate-400 font-medium">{t.intro}</p>
        </div>

        <div className="mt-20 grid gap-6">
          {t.sections.map((section) => (
            <div key={section.title} className="glass rounded-[2.5rem] p-10 border-white/5">
              <h2 className="text-2xl font-black text-white mb-4 tracking-tight">{section.title}</h2>
              <p className="text-base leading-relaxed text-slate-400 font-medium">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 glass rounded-[2.5rem] p-10 border-cyan-500/20 bg-cyan-500/[0.02]">
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">{t.todoTitle}</h2>
          <p className="text-base leading-relaxed text-slate-400 font-medium">{t.todo}</p>
        </div>

        <div className="mt-16 flex flex-wrap gap-6">
          <a href={`mailto:${socialLinks.email}`} className="button-liquid-primary h-16 px-10">
            <Mail className="h-4 w-4" />
            {t.contact}
          </a>
          <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-secondary h-16 px-10">
            MoPlayer Protocol
          </Link>
        </div>
      </Frame>
    </div>
  );
}
