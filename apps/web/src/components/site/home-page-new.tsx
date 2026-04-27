import { ArrowUpRight, Mail, PlayCircle, Zap, Code2, Truck, Tv } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

  const roles = [
    {
      icon: <Code2 className="h-5 w-5" />,
      title: isAr ? "مطوّر ومصمم" : "Developer & Designer",
      body: isAr ? "واجهات ويب، أندرويد، وأنظمة رقمية متكاملة" : "Web interfaces, Android, and integrated digital systems",
      href: `/${model.locale}/work`,
    },
    {
      icon: <PlayCircle className="h-5 w-5" />,
      title: isAr ? "يوتيوبر تقني" : "Arabic Tech YouTuber",
      body: isAr ? `${views} مشاهدة · ${subs} مشترك · ${vids} فيديو` : `${views} views · ${subs} subscribers · ${vids} videos`,
      href: `/${model.locale}/youtube`,
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: isAr ? "لوجستيات ونقل" : "Logistics Professional",
      body: isAr ? "Rhenus Home Delivery · تنسيق النقل · TMS" : "Rhenus Home Delivery · Disposition · TMS",
      href: `/${model.locale}/cv`,
    },
    {
      icon: <Tv className="h-5 w-5" />,
      title: isAr ? "صانع MoPlayer" : "MoPlayer Creator",
      body: isAr ? "تطبيق أندرويد TV للوسائط · تفعيل · تحديثات" : "Android TV media app · Activation · Releases",
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
      <section className="relative min-h-[90vh] overflow-hidden" data-testid="home-hero">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 10% 40%, rgba(0, 200, 212, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 60%, rgba(124, 58, 237, 0.06) 0%, transparent 40%)" }} />

        <div className="section-frame relative z-10 flex min-h-[90vh] flex-col justify-center pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">

            {/* Copy */}
            <div>
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  isAr ? "🇩🇪 ألمانيا" : "🇩🇪 Germany",
                  isAr ? "🇸🇾 سوريا" : "🇸🇾 Syrian roots",
                  `▶ ${views}`,
                  `👥 ${subs}`,
                  `📹 ${vids}`,
                  "MoPlayer",
                  "Web · UI/UX",
                  isAr ? "لوجستيات" : "Logistics · TMS",
                ].map((b) => (
                  <span key={b} className="glass rounded-full px-3 py-1.5 text-[11px] font-bold tracking-wide" style={{ color: "var(--text-2)", borderColor: "var(--glass-border)", backgroundColor: "var(--bg-elevated)" }}>
                    {b}
                  </span>
                ))}
              </div>

              <h1 className="mt-5 overflow-visible pb-2 font-black leading-[1.05]" style={{ fontSize: "clamp(2.5rem,5.5vw,4.5rem)", color: "var(--text-1)" }}>
                {isAr ? (
                  <>أحوّل العمليات الحقيقية<br />إلى تجارب رقمية واضحة.</>
                ) : (
                  <>I turn real-world operations<br />into clear digital experiences.</>
                )}
              </h1>

              <p className="mt-6 max-w-[55ch] text-[16px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {isAr
                  ? "أنا محمد الفراس، سوري/ألماني أعيش في ألمانيا. أعمل بين اللوجستيات، تطوير الويب، تصميم الواجهات، تطبيقات أندرويد، وصناعة المحتوى التقني. أحوّل الخبرة الواقعية إلى مواقع وتطبيقات واضحة، سريعة، ومقنعة."
                  : "I am Mohammad Alfarras, Syrian/German living in Germany. I work across logistics, web development, UI/UX design, Android apps, and tech content creation. I translate real-world expertise into clear, fast, and persuasive digital platforms."}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href={`/${model.locale}/work`} className="button-liquid-primary inline-flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  {isAr ? "اكتشف الأعمال" : "View Work"}
                </Link>
                <Link href={`/${model.locale}/apps/moplayer`} className="button-liquid-secondary inline-flex items-center gap-2">
                  <Zap className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  {isAr ? "استكشف MoPlayer" : "Explore MoPlayer"}
                </Link>
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary inline-flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  {isAr ? "شاهد يوتيوب" : "Watch YouTube"}
                </a>
              </div>
            </div>

            {/* Portrait / OS Interface */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[340px] lg:max-w-none">
                <div className="glass relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)]" style={{ boxShadow: "var(--shadow-hero)" }}>
                  <Image
                    src={model.portraitImage || "/images/protofeilnew.jpeg"}
                    alt={isAr ? "محمد الفراس" : "Mohammad Alfarras"}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width:1024px) 340px, 420px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-black/50 p-3 backdrop-blur-md">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">System Active</p>
                        <p className="text-sm font-semibold text-white">Mohammad Alfarras</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CHOOSE HOW YOU KNOW ME ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            {isAr ? "اختر كيف تعرفني" : "Choose how you know me"}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <Link key={r.title} href={r.href} className="glass group block rounded-[var(--radius-lg)] p-6 transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full text-[var(--accent)] border border-[var(--accent)] bg-[var(--accent-soft)]">
                  {r.icon}
                </div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-1)" }}>{r.title}</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{r.body}</p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                  {isAr ? "اكتشف" : "Explore"} <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORY ARC ── */}
      <section className="py-16 md:py-24 border-y border-[var(--glass-border)] bg-[var(--bg-elevated)]">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            {isAr ? "مسار القصة" : "The Story Arc"}
          </p>
          <div className="mt-8 flex flex-wrap lg:flex-nowrap gap-4">
            {storyNodes.map((node, i) => (
              <div key={node.year} className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]">
                    {i + 1}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-[var(--accent)] to-transparent opacity-20" />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{node.year}</p>
                  <h3 className="mt-1 font-bold text-[var(--text-1)]">{node.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-2)]">{node.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF WALL ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            {isAr ? "القدرات والأدوات" : "Proof Wall"}
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-bold text-[var(--text-1)] uppercase tracking-wider text-sm">{isAr ? "التقنيات الأساسية" : "Core Tech Stack"}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-2)]">TypeScript, React, Next.js, Node.js, TailwindCSS, PostgreSQL, Supabase, Vercel, Framer Motion.</p>
            </div>
            <div className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-bold text-[var(--text-1)] uppercase tracking-wider text-sm">{isAr ? "تطوير التطبيقات" : "App Development"}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-2)]">Kotlin, Android SDK, Android TV, Room, Retrofit, VLC/libVLC, APK release pipeline.</p>
            </div>
            <div className="glass rounded-[var(--radius-lg)] p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-bold text-[var(--text-1)] uppercase tracking-wider text-sm">{isAr ? "عمليات ولوجستيات" : "Operations & Logistics"}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-2)]">Disposition, Fleet Coordination, TMS integration, Customer Service, Process clarity, German workflow precision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                {isAr ? "مشاريع مميزة" : "Featured Projects"}
              </p>
              <h2 className="mt-2 overflow-visible pb-1 font-black leading-[1.2]" style={{ fontSize: "clamp(1.8rem,3vw,2.4rem)", color: "var(--text-1)" }}>
                {isAr ? "منطق تشغيلي وتصميم واضح" : "Operational logic & clear design"}
              </h2>
            </div>
            <Link href={`/${model.locale}/work`} className="button-liquid-secondary hidden md:inline-flex">
              {isAr ? "كل الأعمال" : "All work"}
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {projects.map((project) => (
              <Link href={`/${model.locale}/work/${project.slug}`} key={project.id}
                className="glass group block overflow-hidden rounded-[var(--radius-lg)] transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-elevated)]">
                  <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width:1024px) 100vw, 33vw" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>{project.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-bold" style={{ color: "var(--text-1)" }}>{project.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{project.summary}</p>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                    {isAr ? "التفاصيل" : "Case study"} <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex justify-center md:hidden">
            <Link href={`/${model.locale}/work`} className="button-liquid-secondary">{isAr ? "كل الأعمال" : "All work"}</Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section className="py-16 md:py-24 border-t border-[var(--glass-border)]">
        <div className="section-frame">
          <div className="glass rounded-[var(--radius-xl)] p-8 md:p-12 text-center" style={{ background: "linear-gradient(135deg, rgba(0,200,212,0.04) 0%, rgba(124,58,237,0.04) 100%)", boxShadow: "var(--shadow-elevated)" }}>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black leading-tight" style={{ color: "var(--text-1)" }}>
              {isAr ? "ما الذي يمكننا بناءه معاً؟" : "What can we build together?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              {isAr ? "مواقع أعمال، تطبيقات، أو استشارات تقنية. دعنا نضع خطة واضحة." : "Business websites, apps, or technical consulting. Let's map out a clear plan."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href={`/${model.locale}/contact`} className="button-liquid-primary inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {isAr ? "تواصل معي" : "Get in touch"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
