import { ArrowUpRight, Mail, PlayCircle, Zap, Code2, Truck, Tv, MessageCircleMore } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

import { socialLinks } from "@/content/site";
import type { SiteViewModel } from "./site-view-model";

function formatNum(val: unknown, fb: string) {
  if (typeof val === "number" && Number.isFinite(val)) {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M+`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K+`;
    return String(val);
  }
  return typeof val === "string" && val.trim() ? val : fb;
}

function sortedProjects(m: SiteViewModel) {
  return [...m.projects].sort((a, b) => a.featuredRank - b.featuredRank);
}

export function PortfolioHomePageNew({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const projects = sortedProjects(model).slice(0, 3);
  const views = formatNum(model.youtube.views, "1.5M+");
  const subs = formatNum(model.youtube.subscribers, "6.1K+");
  const vids = formatNum(model.youtube.videos, "162");

  const modes = [
    {
      id: "dev",
      icon: <Code2 className="h-6 w-6" />,
      title: isAr ? "نمط المطور" : "Developer Mode",
      body: isAr ? "بناء أنظمة ويب متكاملة، واجهات معقدة، وتطبيقات أندرويد." : "Building end-to-end web systems, complex interfaces, and Android apps.",
      accent: "cyan",
      href: `/${model.locale}/work`,
    },
    {
      id: "creator",
      icon: <PlayCircle className="h-6 w-6" />,
      title: isAr ? "نمط صانع المحتوى" : "Creator Mode",
      body: isAr ? "مراجعات تقنية، شروحات أدوات، وسرد قصص المنتجات بالعربية." : "Technical reviews, tool tutorials, and product storytelling in Arabic.",
      accent: "red",
      href: `/${model.locale}/youtube`,
    },
    {
      id: "ops",
      icon: <Truck className="h-6 w-6" />,
      title: isAr ? "نمط العمليات" : "Operations Mode",
      body: isAr ? "تحويل الضغط اللوجستي إلى أنظمة رقمية دقيقة ومنظمة." : "Turning logistics pressure into precise, organized digital systems.",
      accent: "indigo",
      href: `/${model.locale}/cv`,
    },
    {
      id: "product",
      icon: <Tv className="h-6 w-6" />,
      title: isAr ? "نمط المنتج" : "Product Mode",
      body: isAr ? "MoPlayer: من الفكرة إلى إصدار APK وأنظمة التفعيل." : "MoPlayer: From idea to APK releases and activation systems.",
      accent: "violet",
      href: `/${model.locale}/apps/moplayer`,
    },
  ];

  const storyNodes = isAr ? [
    { year: "سوريا", title: "الجذور", text: "النشأة وبداية الشغف التقني." },
    { year: "ألمانيا", title: "الانتقال", text: "بناء حياة جديدة، تعلم اللغة والتأقلم." },
    { year: "اللوجستيات", title: "العمليات", text: "إدارة التوزيع في Rhenus Home Delivery." },
    { year: "الويب", title: "البرمجة", text: "بناء أنظمة مخصصة ومواقع احترافية." },
    { year: "يوتيوب", title: "المحتوى", text: "مشاركة الخبرة التقنية مع الجمهور العربي." },
    { year: "MoPlayer", title: "المنتج", text: "إطلاق تطبيق Android TV متكامل." }
  ] : [
    { year: "Syria", title: "Roots", text: "Early life and initial technical curiosity." },
    { year: "Germany", title: "Relocation", text: "Building a new foundation, language, and culture." },
    { year: "Logistics", title: "Operations", text: "Disposition and fleet management at Rhenus." },
    { year: "Web", title: "Development", text: "Building tailored systems and digital interfaces." },
    { year: "YouTube", title: "Content", text: "Sharing technical expertise with the Arabic world." },
    { year: "MoPlayer", title: "Product", text: "Launching an end-to-end Android TV application." }
  ];

  return (
    <div data-testid="home-page-new">
      {/* ── HERO COMMAND CENTER ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden" data-testid="home-hero">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "var(--hero-home-gradient)" }} />

        <div className="section-frame relative z-10 w-full pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">

            {/* Content Side */}
            <div className="flex flex-col items-start">
              <div className="mb-8 flex flex-wrap gap-2.5">
                {[
                  { label: isAr ? "🇩🇪 مقيم في ألمانيا" : "🇩🇪 Based in Germany", color: "text-cyan-400" },
                  { label: isAr ? "🇸🇾 جذور سورية" : "🇸🇾 Syrian roots", color: "text-indigo-400" },
                  { label: `▶ ${views}`, color: "text-red-400" },
                  { label: isAr ? "لوجستيات · TMS" : "Logistics · TMS", color: "text-emerald-400" },
                  { label: "MoPlayer", color: "text-violet-400" },
                ].map((b) => (
                  <span key={b.label} className="glass flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)] transition-colors hover:border-[var(--accent-glow)]">
                    <span className={cn("h-1.5 w-1.5 rounded-full bg-current", b.color)} />
                    {b.label}
                  </span>
                ))}
              </div>

              <h1 className="overflow-visible pb-2 font-black leading-[1.05] tracking-tight text-[var(--text-1)]" style={{ fontSize: "clamp(2.5rem,6vw,4.8rem)" }}>
                {isAr ? (
                  <>أحوّل العمليات الحقيقية<br /><span className="gradient-text">إلى تجارب رقمية واضحة.</span></>
                ) : (
                  <>I turn real-world operations<br /><span className="gradient-text">into clear digital experiences.</span></>
                )}
              </h1>

              <p className="mt-8 max-w-[58ch] text-[17px] leading-relaxed text-[var(--text-2)] md:text-lg">
                {isAr
                  ? "أنا محمد الفراس، سوري/ألماني أعيش في ألمانيا. أعمل بين اللوجستيات، تطوير الويب، تصميم الواجهات، تطبيقات أندرويد، وصناعة المحتوى التقني. أحوّل الخبرة الواقعية إلى مواقع وتطبيقات واضحة، سريعة، ومقنعة."
                  : "I am Mohammad Alfarras, Syrian/German living in Germany. I work across logistics, web development, UI/UX design, Android apps, and tech content creation. I translate real-world expertise into clear, fast, and persuasive digital platforms."}
              </p>

              <div className="mt-12 flex flex-wrap gap-4">
                <Link href={`/${model.locale}/work`} className="button-liquid-primary group inline-flex items-center gap-3 py-4 px-8 text-base">
                  {isAr ? "اكتشف الأعمال" : "View Work"}
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
                <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-secondary inline-flex items-center gap-3 py-4 px-8 text-base">
                  <Zap className="h-5 w-5 text-violet-400" />
                  {isAr ? "استكشف MoPlayer" : "Explore MoPlayer"}
                </Link>
              </div>
            </div>

            {/* Visual Side - OS Frame */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px]">
                {/* Decorative background glow */}
                <div className="absolute -inset-10 z-0 bg-[var(--accent)] opacity-10 blur-[100px] animate-pulse" />
                
                <div className="glass group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border-2 border-[var(--glass-border)] transition-all duration-500 hover:border-[var(--accent-glow)]" style={{ boxShadow: "var(--shadow-hero)" }}>
                  <Image
                    src={model.portraitImage || "/images/protofeilnew.jpeg"}
                    alt={isAr ? "محمد الفراس" : "Mohammad Alfarras"}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width:1024px) 420px, 500px"
                  />
                  
                  {/* Glass overlay with info */}
                  <div className="absolute inset-x-4 bottom-4 z-10">
                    <div className="glass flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent-glow)] bg-black/20">
                           <div className="h-2 w-2 animate-ping rounded-full bg-[var(--accent)]" />
                           <div className="absolute h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Digital OS v2.0</p>
                          <p className="text-[15px] font-bold text-white">System Active</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-white/40">Status</p>
                        <p className="text-[13px] font-bold text-emerald-400">Available</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle vignette */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CHOOSE YOUR MODE ── */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="section-frame relative z-10">
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
              {isAr ? "اختر النمط" : "Choose your mode"}
            </p>
            <h2 className="mt-4 text-[clamp(2.2rem,4vw,3.2rem)] font-black text-[var(--text-1)]">
              {isAr ? "استكشف النظام من زوايا مختلفة" : "Explore the system from different angles"}
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map((mode) => (
              <Link key={mode.id} href={mode.href} className="glass group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2" style={{ boxShadow: "var(--shadow-card)" }}>
                {/* Background accent glow */}
                <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[60px] opacity-0 transition-opacity duration-500 group-hover:opacity-20 ${
                  mode.accent === 'cyan' ? 'bg-cyan-400' : 
                  mode.accent === 'red' ? 'bg-red-400' : 
                  mode.accent === 'indigo' ? 'bg-indigo-400' : 'bg-violet-400'
                }`} />
                
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                  mode.accent === 'cyan' ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' : 
                  mode.accent === 'red' ? 'text-red-400 border-red-400/30 bg-red-400/10' : 
                  mode.accent === 'indigo' ? 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10' : 'text-violet-400 border-violet-400/30 bg-violet-400/10'
                }`}>
                  {mode.icon}
                </div>
                
                <h3 className="text-xl font-black text-[var(--text-1)]">{mode.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-2)]">{mode.body}</p>
                
                <div className="mt-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[var(--accent)] opacity-60 transition-opacity group-hover:opacity-100">
                  {isAr ? "دخول النمط" : "Enter Mode"} 
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT I BUILD ── */}
      <section className="py-20 md:py-32 bg-[var(--bg-elevated)] border-y border-[var(--glass-border)]">
        <div className="section-frame">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
                {isAr ? "ماذا أبني" : "What I build"}
              </p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-black leading-tight text-[var(--text-1)]">
                {isAr ? "حلول رقمية مصممة للنمو والوضوح" : "Digital solutions built for growth and clarity"}
              </h2>
              <p className="mt-6 text-lg text-[var(--text-2)]">
                {isAr ? "أركز على تحويل التعقيد إلى بساطة بصرية وتدفقات عمل منطقية." : "I focus on turning complexity into visual simplicity and logical workflows."}
              </p>
              
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                {capabilities.map((cap) => (
                  <div key={cap.title} className="flex flex-col gap-3">
                    <div className="h-1 w-12 bg-[var(--accent)] rounded-full" />
                    <h3 className="text-[16px] font-black text-[var(--text-1)]">{cap.title}</h3>
                    <p className="text-sm text-[var(--text-2)] leading-relaxed">{cap.body}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-[var(--glass-border)] bg-black/40">
              {/* This would be a premium project mockup or abstract visual */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
              <div className="flex h-full items-center justify-center p-8">
                 <div className="text-center">
                    <div className="glass mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10">
                      <Code2 className="h-10 w-10 text-[var(--accent)]" />
                    </div>
                    <p className="text-sm font-bold text-white/40 tracking-widest uppercase">System Framework</p>
                    <p className="mt-2 text-xl font-black text-white">Logic · Design · Execution</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STORY ARC ── */}
      <section className="py-20 md:py-32">
        <div className="section-frame">
          <div className="mb-16">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
              {isAr ? "مسار القصة" : "The Story Arc"}
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-black text-[var(--text-1)]">
              {isAr ? "من اللوجستيات إلى العالم الرقمي" : "From logistics to the digital world"}
            </h2>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)] via-[var(--violet)] to-transparent opacity-20 md:left-1/2" />
            
            <div className="grid gap-12">
              {storyNodes.map((node, i) => (
                <div key={node.year} className={cn("relative flex flex-col md:flex-row md:items-center gap-8 md:gap-20", i % 2 === 1 ? "md:flex-row-reverse" : "")}>
                  {/* Marker */}
                  <div className="absolute left-4 top-2 h-3 w-3 -translate-x-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] md:left-1/2" />
                  
                  <div className="md:w-1/2 pl-12 md:pl-0 md:text-right">
                    {i % 2 === 1 ? (
                      <div className="md:text-left">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">{node.year}</span>
                        <h3 className="mt-1 text-xl font-black text-[var(--text-1)]">{node.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{node.text}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">{node.year}</span>
                        <h3 className="mt-1 text-xl font-black text-[var(--text-1)]">{node.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{node.text}</p>
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF WALL ── */}
      <section className="py-20 md:py-32 border-t border-[var(--glass-border)]">
        <div className="section-frame">
          <div className="mb-16 flex flex-col items-center text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
              {isAr ? "القدرات والأدوات" : "Proof Wall"}
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3rem)] font-black text-[var(--text-1)]">
              {isAr ? "أدوات نستخدمها لتحويل الأفكار إلى واقع" : "Tools we use to turn ideas into reality"}
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: isAr ? "التقنيات الأساسية" : "Core Tech Stack",
                tags: ["TypeScript", "React", "Next.js", "TailwindCSS", "PostgreSQL", "Supabase", "Framer Motion"],
                icon: <Code2 className="h-5 w-5" />,
              },
              {
                title: isAr ? "تطوير التطبيقات" : "App Development",
                tags: ["Kotlin", "Android SDK", "Android TV", "Room", "Retrofit", "VLC/libVLC", "APK Release"],
                icon: <Tv className="h-5 w-5" />,
              },
              {
                title: isAr ? "عمليات ولوجستيات" : "Operations & Logistics",
                tags: ["Disposition", "Fleet Management", "TMS Integration", "Process Clarity", "German Workflow"],
                icon: <Truck className="h-5 w-5" />,
              },
            ].map((card) => (
              <div key={card.title} className="glass rounded-3xl p-8 border border-[var(--glass-border)] hover:border-[var(--accent-glow)] transition-all duration-300">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  {card.icon}
                </div>
                <h3 className="text-lg font-black text-[var(--text-1)] uppercase tracking-wider">{card.title}</h3>
                <div className="mt-6 flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-[var(--text-2)] border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ── */}
      <section className="py-20 md:py-32">
        <div className="section-frame">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
                {isAr ? "مشاريع مختارة" : "Featured Work"}
              </p>
              <h2 className="mt-4 text-[clamp(2.2rem,4vw,3.2rem)] font-black text-[var(--text-1)] leading-tight">
                {isAr ? "بناء أنظمة تشغيل رقمية" : "Building Digital Operating Systems"}
              </h2>
            </div>
            <Link href={`/${model.locale}/work`} className="button-liquid-secondary group flex items-center gap-2 px-8">
              {isAr ? "مشاهدة الكل" : "View all projects"}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-3">
            {projects.map((project) => (
              <Link href={`/${model.locale}/work/${project.slug}`} key={project.id}
                className="glass group relative block overflow-hidden rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2"
                style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-elevated)]">
                  <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" sizes="(max-width:1024px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent opacity-60" />
                </div>
                <div className="relative z-10 p-8">
                  <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-[var(--accent)]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">{project.eyebrow}</p>
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-[var(--text-1)]">{project.title}</h3>
                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--text-2)]">{project.summary}</p>
                  
                  <div className="mt-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[var(--accent)] opacity-60 transition-opacity group-hover:opacity-100">
                    {isAr ? "دراسة الحالة" : "View Case Study"} <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 md:py-32 border-t border-[var(--glass-border)]">
        <div className="section-frame">
          <div className="glass relative overflow-hidden rounded-[3rem] p-12 md:p-20 text-center">
            {/* Background design elements */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />
            
            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black leading-tight text-[var(--text-1)]">
                {isAr ? "هل لديك مشروع يحتاج إلى وضوح؟" : "Have a project that needs clarity?"}
              </h2>
              <p className="mt-8 text-lg text-[var(--text-2)] leading-relaxed">
                {isAr 
                  ? "سواء كان موقعاً تجارياً، تطبيقاً، أو منتجاً رقمياً معقداً، يمكننا البدء من تحليل الهدف الحقيقي والوصول إلى تنفيذ هندسي دقيق." 
                  : "Whether it's a business site, an app, or a complex digital product, we start by analyzing the real goal and moving to precise engineering execution."}
              </p>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <Link href={`/${model.locale}/contact`} className="button-liquid-primary group flex items-center gap-3 py-5 px-10 text-lg">
                  <Mail className="h-5 w-5" />
                  {isAr ? "ابدأ المحادثة الآن" : "Start a conversation"}
                </Link>
                <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary flex items-center gap-3 py-5 px-10 text-lg">
                  <MessageCircleMore className="h-5 w-5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
