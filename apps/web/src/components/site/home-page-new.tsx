"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Code2, Play, Globe, Cpu, Truck, Clapperboard } from "lucide-react";
import type { SiteViewModel } from "./site-view-model";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function PortfolioHomePageNew({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const locale = model.locale;

  const rankedProjects = [...model.projects].sort(
    (a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99),
  );
  const featuredOnly = rankedProjects.filter((p) => p.featured);
  const homeProjects = (featuredOnly.length ? featuredOnly : rankedProjects).slice(0, 4);

  const proof = isAr
    ? [
        { label: "المقر", val: "ألمانيا 🇩🇪" },
        { label: "الجذور", val: "سوريا 🇸🇾" },
        { label: "المشاهدات", val: "1.5M+" },
        { label: "المشتركين", val: "6.1K+" },
      ]
    : [
        { label: "Base", val: "Germany 🇩🇪" },
        { label: "Roots", val: "Syria 🇸🇾" },
        { label: "Views", val: "1.5M+" },
        { label: "Subscribers", val: "6.1K+" },
      ];

  const knowMeCards = isAr
    ? [
        { icon: <Code2 className="h-6 w-6" />, title: "وضع المطوّر", body: "واجهات ويب، Next.js، أنظمة واضحة للشركات والأفراد." },
        { icon: <Clapperboard className="h-6 w-6" />, title: "وضع صانع المحتوى", body: "مراجعات تقنية وقصص منتجات بلغة عربية من ألمانيا." },
        { icon: <Truck className="h-6 w-6" />, title: "وضع اللوجستيات", body: "خبرة ميدانية في التنسيق، التواصل، والضغط التشغيلي." },
        { icon: <Cpu className="h-6 w-6" />, title: "وضع منتج MoPlayer", body: "منتج وسائط لـ Android TV — واجهة نظيفة وأداء حقيقي." },
      ]
    : [
        { icon: <Code2 className="h-6 w-6" />, title: "Developer mode", body: "Web surfaces, Next.js systems, and crisp product UX." },
        { icon: <Clapperboard className="h-6 w-6" />, title: "YouTube creator mode", body: "Arabic tech reviews and honest hardware storytelling." },
        { icon: <Truck className="h-6 w-6" />, title: "Logistics mode", body: "Real dispatch discipline — speed, clarity, reliability." },
        { icon: <Cpu className="h-6 w-6" />, title: "MoPlayer product mode", body: "Android TV media product — focused UI on libVLC." },
      ];

  const whatIBuild = isAr
    ? [
        { title: "واجهات ويب وNext.js", body: "مواقع وخدمات مبنية على أداء وجاهزية إنتاج.", href: `/${locale}/work` },
        { title: "تجارب Android TV", body: "MoPlayer والبنية حول libVLC لتجربة شاشة كبيرة.", href: `/${locale}/apps/moplayer` },
        { title: "محتوى تقني عربي", body: "مراجعات وشرح منتجات بصوت واضح من ألمانيا.", href: `/${locale}/youtube` },
        { title: "تشغيل وتنسيق", body: "ربط احتياجات العملاء بالتنفيذ الرقمي دون ضوضاء.", href: `/${locale}/contact` },
      ]
    : [
        { title: "Web & Next.js systems", body: "Production-ready sites and services with performance in mind.", href: `/${locale}/work` },
        { title: "Android TV experiences", body: "MoPlayer and libVLC-based flows for the living room.", href: `/${locale}/apps/moplayer` },
        { title: "Arabic tech media", body: "Reviews and product clarity for an Arabic-speaking audience.", href: `/${locale}/youtube` },
        { title: "Ops-aware delivery", body: "Translating real customer pressure into calm digital systems.", href: `/${locale}/contact` },
      ];

  const services = isAr
    ? [
        { icon: <Code2 />, title: "تطوير الويب", desc: "بناء أنظمة Next.js متطورة مع واجهات برمجية قوية وأداء فائق." },
        { icon: <Play />, title: "صناعة المحتوى", desc: "مراجعات تقنية احترافية وقصص منتجات تجذب الملايين على يوتيوب." },
        { icon: <Globe />, title: "الحلول التشغيلية", desc: "تحويل العمليات اللوجستية المعقدة إلى أدوات رقمية سهلة الاستخدام." },
        { icon: <Cpu />, title: "تطبيقات TV", desc: "تصميم وتطوير تطبيقات Android TV مخصصة لتجربة شاشة كبيرة." },
      ]
    : [
        { icon: <Code2 />, title: "Web Engineering", desc: "Building advanced Next.js systems with robust APIs and peak performance." },
        { icon: <Play />, title: "Content Creation", desc: "Professional tech reviews and product stories that reach millions." },
        { icon: <Globe />, title: "Operational Logic", desc: "Converting complex logistics workflows into usable digital tools." },
        { icon: <Cpu />, title: "TV Applications", desc: "Custom Android TV experiences engineered for the big screen." },
      ];

  return (
    <div className="relative pt-20" dir={isAr ? "rtl" : "ltr"}>
      <div className="noise-overlay" />

      {/* ══════════ HERO (MOBILE OPTIMIZED) ══════════ */}
      <section className="relative min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden border-b border-[var(--os-border)] py-12 lg:py-0">
        <div className="section-frame w-full">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-20 items-center">
            
            <div className="order-2 lg:order-1">
              <motion.div {...inView(0)} className="mb-6 lg:mb-10">
                <span className="os-badge os-badge-active">
                  {isAr ? "نظام محمد الفراس الرقمي" : "Mohammad Alfarras Digital OS"}
                </span>
              </motion.div>

              <motion.h1 {...inView(0.1)} className="headline-display text-[clamp(2rem,9vw,5.5rem)] leading-[1.02] text-[var(--os-text-1)] lg:leading-[1.05]">
                {isAr ? (
                  <>
                    أحوّل <span className="gradient-text">الخبرة الواقعية</span>
                    <br />
                    إلى تجارب رقمية <span className="gradient-text">واضحة</span>.
                  </>
                ) : (
                  <>
                    I turn <span className="gradient-text">real-world operations</span>
                    <br />
                    into <span className="gradient-text">clear digital experiences</span>.
                  </>
                )}
              </motion.h1>

              <motion.p
                {...inView(0.2)}
                className="mt-8 max-w-2xl text-[17px] font-bold leading-snug text-[var(--os-text-2)] lg:mt-10 lg:text-[20px] lg:leading-tight"
              >
                {isAr
                  ? "أنا محمد الفراس — بين اللوجستيات، تطوير الويب، واجهات المستخدم، تطبيقات أندرويد، ومحتوى تقني عربي. أبني أنظمة رقمية تفهم العمل الحقيقي."
                  : "Mohammad Alfarras — web, UI/UX, Android TV (MoPlayer), and Arabic tech content — building systems shaped by real logistics and customer communication."}
              </motion.p>

              <motion.div {...inView(0.3)} className="mt-10 flex flex-col flex-wrap gap-3 sm:flex-row lg:mt-14 lg:gap-4">
                <Link href={`/${locale}/work`} className="btn-primary w-full sm:w-auto">
                  {isAr ? "الأعمال" : "View work"}
                </Link>
                <Link href={`/${locale}/apps/moplayer`} className="btn-secondary w-full sm:w-auto">
                  MoPlayer
                </Link>
                <Link href={`/${locale}/youtube`} className="btn-secondary w-full sm:w-auto">
                  YouTube
                </Link>
                <Link href={`/${locale}/contact`} className="btn-secondary w-full sm:w-auto">
                  {isAr ? "تواصل" : "Contact"}
                </Link>
              </motion.div>

              <motion.div {...inView(0.4)} className="mt-16 lg:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 border-t lg:border-none border-[var(--os-border)] pt-8 lg:pt-0">
                {proof.map((p) => (
                  <div key={p.label}>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--os-text-3)] font-black mb-1">{p.label}</p>
                    <p className="text-[16px] lg:text-[20px] text-[var(--os-text-1)] font-black">{p.val}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div 
              {...inView(0.2)}
              className="order-1 lg:order-2 relative aspect-[4/3] sm:aspect-square lg:h-[600px] bg-[var(--os-bg-secondary)] rounded-[2.5rem] lg:rounded-[4rem] overflow-hidden border border-[var(--os-border)] group"
            >
              <Image 
                src="/images/protofeilnew.jpeg"
                alt="Mohammad Alfarras"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--os-bg)] to-transparent opacity-40" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════ CHOOSE HOW YOU KNOW ME ══════════ */}
      <section className="border-b border-[var(--os-border)] py-20 lg:py-28">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12 lg:mb-16">
            <span className="os-badge os-badge-active mb-4 inline-flex">
              {isAr ? "من أنا لك؟" : "Choose how you know me"}
            </span>
            <h2 className="headline-display max-w-3xl text-[clamp(1.8rem,5vw,3rem)] text-[var(--os-text-1)]">
              {isAr ? "أربعة مداخل للعمل معي" : "Four lenses into what I do"}
            </h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {knowMeCards.map((card, i) => (
              <motion.div
                key={card.title}
                {...inView(0.05 * i)}
                className="glass-card flex flex-col p-8 lg:p-9"
              >
                <div className="mb-5 text-[var(--os-accent)]">{card.icon}</div>
                <h3 className="text-lg font-black uppercase tracking-tight text-[var(--os-text-1)]">{card.title}</h3>
                <p className="mt-3 text-[13px] font-semibold leading-relaxed text-[var(--os-text-3)]">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WHAT I BUILD ══════════ */}
      <section className="border-b border-[var(--os-border)] py-20 lg:py-28 bg-[var(--os-bg-secondary)]/40">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12 lg:mb-16">
            <span className="os-badge os-badge-active mb-4 inline-flex">
              {isAr ? "ماذا أبني" : "What I build"}
            </span>
            <h2 className="headline-display max-w-3xl text-[clamp(1.8rem,5vw,3rem)] text-[var(--os-text-1)]">
              {isAr ? "شبكة مخرجات مترابطة" : "A grid of shipped outcomes"}
            </h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whatIBuild.map((item, i) => (
              <motion.div key={item.title} {...inView(0.05 * i)}>
                <Link
                  href={item.href}
                  className="glass-card flex h-full flex-col p-8 lg:p-9 transition-colors hover:border-[var(--os-teal-border)]"
                >
                  <h3 className="text-lg font-black uppercase tracking-tight text-[var(--os-text-1)]">{item.title}</h3>
                  <p className="mt-3 flex-1 text-[13px] font-semibold leading-relaxed text-[var(--os-text-3)]">{item.body}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--os-accent)]">
                    {isAr ? "انتقل" : "Open"} <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STORY ARC ══════════ */}
      <section className="border-b border-[var(--os-border)] bg-[var(--os-bg-secondary)] py-16 lg:py-24">
        <div className="section-frame">
          <motion.p {...inView(0)} className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--os-text-3)]">
            {isAr ? "القوس المهني" : "Story arc"}
          </motion.p>
          <motion.h2 {...inView(0.05)} className="headline-display mb-8 max-w-4xl text-[clamp(1.5rem,4vw,2.25rem)] text-[var(--os-text-1)]">
            {isAr
              ? "سوريا → ألمانيا → لوجستيات وتشغيل → ويب وتطبيقات → يوتيوب → MoPlayer"
              : "Syria → Germany → logistics & coordination → web & apps → YouTube → MoPlayer"}
          </motion.h2>
          <motion.p {...inView(0.1)} className="max-w-3xl text-[15px] font-bold leading-relaxed text-[var(--os-text-2)]">
            {isAr
              ? "هذا الخليط هو ما يميّز المخرجات: واجهات وأنظمة مرتبطة بواقع العملاء والضغط التشغيلي، لا مجرد شاشات جميلة."
              : "That mix is the point: shipping interfaces and systems that respect real operations and real customers — not decoration-only pixels."}
          </motion.p>
        </div>
      </section>

      {/* ══════════ SERVICES ══════════ */}
      <section className="py-24 lg:py-40 border-b border-[var(--os-border)]">
        <div className="section-frame">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-1 bg-[var(--os-border)] border border-[var(--os-border)]">
            {services.map((s, i) => (
              <motion.div key={s.title} {...inView(i * 0.1)} className="bg-[var(--os-bg)] p-8 lg:p-10 hover:bg-[var(--os-bg-secondary)] transition-colors">
                <div className="text-[var(--os-accent)] mb-6 lg:mb-8">{s.icon}</div>
                <h3 className="text-[18px] lg:text-[20px] text-[var(--os-text-1)] font-black mb-4 uppercase tracking-tighter">{s.title}</h3>
                <p className="text-[13px] lg:text-[14px] text-[var(--os-text-3)] leading-relaxed font-bold">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ THE STACK ══════════ */}
      <section className="py-24 lg:py-40 bg-[var(--os-bg)]">
        <div className="section-frame">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
             <motion.div {...inView(0)} className="lg:w-1/3 lg:sticky lg:top-40">
                <span className="os-badge mb-6 lg:mb-8">{isAr ? "الترسانة التقنية" : "The Digital Stack"}</span>
                <h2 className="headline-display text-[3.5rem] lg:text-[4rem] text-[var(--os-text-1)] mb-6 lg:mb-10">
                   {isAr ? "أدوات التميز." : "Tools of Ops."}
                </h2>
                <p className="text-[var(--os-text-3)] text-[16px] lg:text-[18px] font-bold leading-tight">
                   {isAr 
                     ? "نستخدم أحدث التقنيات لبناء أنظمة لا تتعطل، وواجهات تترك أثراً."
                     : "Engineering systems that don't break, and interfaces that leave a mark."}
                </p>
             </motion.div>

             <div className="lg:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-1 bg-[var(--os-border)] border border-[var(--os-border)]">
                {[
                  "Next.js 15", "React", "TypeScript", 
                  "Node.js", "PostgreSQL", "Supabase",
                  "Kotlin", "Android SDK", "libVLC",
                  "Figma", "Tailwind CSS", "Framer Motion"
                ].map((tech, i) => (
                  <motion.div key={tech} {...inView(i * 0.05)} className="bg-[var(--os-bg)] p-6 lg:p-8 hover:bg-[var(--os-bg-secondary)] transition-colors text-center sm:text-left">
                     <p className="text-[11px] lg:text-[12px] font-black uppercase tracking-[0.2em] text-[var(--os-text-1)]">{tech}</p>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* ══════════ MOPLAYER ECOSYSTEM ══════════ */}
      <section className="py-24 lg:py-40 bg-[var(--os-bg-secondary)] border-y border-[var(--os-border)] overflow-hidden">
        <div className="section-frame">
           <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <motion.div {...inView(0)}>
                 <span className="os-badge mb-6 lg:mb-8">{isAr ? "المنتج الرائد" : "Flagship Product"}</span>
                 <h2 className="headline-display text-[clamp(2.5rem,8vw,6rem)] text-[var(--os-text-1)] mb-8 lg:mb-10">
                    MoPlayer OS
                 </h2>
                 <p className="text-[var(--os-text-2)] text-[18px] lg:text-[22px] font-bold leading-tight mb-10 lg:mb-12">
                    {isAr 
                      ? "إعادة تعريف تجربة المشاهدة على Android TV. نظام متكامل مبني على libVLC بأداء فائق وواجهة ذكية."
                      : "Redefining the Android TV experience. A full ecosystem built on libVLC with peak performance and smart UI."}
                 </p>
                 <Link href={`/${locale}/apps/moplayer`} className="btn-primary w-full sm:w-auto">
                    {isAr ? "استكشف النظام" : "Explore OS"}
                 </Link>
              </motion.div>
              <motion.div {...inView(0.2)} className="relative aspect-video rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-[var(--os-border)] shadow-[0_0_100px_rgba(0,245,255,0.1)]">
                 <Image src="/images/moplayer-hero.png" alt="MoPlayer" fill className="object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[var(--os-bg)]/80 to-transparent" />
              </motion.div>
           </div>
        </div>
      </section>

      {/* ══════════ PORTFOLIO ══════════ */}
      <section className="py-24 lg:py-40">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-16 lg:mb-24 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <h2 className="headline-display text-[clamp(2.2rem,6vw,5rem)] text-[var(--os-text-1)]">
               {isAr ? "مشاريع مميّزة" : "Featured work"}
            </h2>
            <Link href={`/${locale}/work`} className="text-[var(--os-text-1)] font-black uppercase tracking-[0.2em] text-[11px] lg:text-[12px] flex items-center gap-2 hover:gap-4 transition-all">
               {isAr ? "شاهد الكل" : "Full View"} <ArrowRight size={16} />
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {homeProjects.map((p, i) => (
              <motion.div key={p.id} {...inView(i * 0.1)} className="group">
                <div className="relative aspect-video rounded-[2rem] lg:rounded-[3rem] overflow-hidden border border-[var(--os-border)] mb-8 lg:mb-10 shadow-2xl">
                   <Image src={p.image} alt={p.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Link href={`/${locale}/work/${p.slug}`} className="btn-primary hidden lg:inline-flex">
                         {isAr ? "عرض التفاصيل" : "View Case"}
                      </Link>
                   </div>
                   {/* Mobile Tap Target */}
                   <Link href={`/${locale}/work/${p.slug}`} className="absolute inset-0 lg:hidden" />
                </div>
                <div className="flex justify-between items-start gap-4">
                   <div>
                      <span className="os-badge mb-3 lg:mb-4">{p.eyebrow}</span>
                      <h3 className="text-[24px] lg:text-[32px] text-[var(--os-text-1)] font-black uppercase tracking-tighter leading-tight">{p.title}</h3>
                   </div>
                   <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full border border-[var(--os-border)] flex items-center justify-center text-[var(--os-text-1)] group-hover:bg-[var(--os-text-1)] group-hover:text-[var(--os-bg)] transition-colors shrink-0">
                      <ArrowUpRight size={20} className="lg:w-6 lg:h-6" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STATS / PROOF ══════════ */}
      <section className="py-24 lg:py-40 bg-[var(--os-bg)] border-y border-[var(--os-border)]">
         <div className="section-frame">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-center">
               <motion.div {...inView(0)} className="text-center lg:text-left">
                  <h2 className="headline-display text-[3.5rem] lg:text-[4rem] text-[var(--os-text-1)] mb-4">
                     1.5M+
                  </h2>
                  <p className="text-[var(--os-text-3)] font-black uppercase tracking-[0.3em] text-[11px] lg:text-[12px]">
                     {isAr ? "مشاهدة على يوتيوب" : "Organic Views"}
                  </p>
               </motion.div>
               <motion.div {...inView(0.1)} className="glass-card p-10 lg:p-16">
                  <p className="text-[20px] lg:text-[32px] text-[var(--os-text-1)] font-bold leading-tight">
                     {isAr 
                       ? "أبني أدوات رقمية للشركات التي تدرك أن الانطباع الأول ليس مجرد صورة، بل هو محرك للثقة والعمل."
                       : "Building digital tools for businesses that understand first impressions aren't just visuals—they are engines for trust and action."}
                  </p>
                  <div className="mt-8 lg:mt-12 flex gap-4">
                     <Link href="https://youtube.com/@Moalfarras" target="_blank" className="btn-primary w-full sm:w-auto">
                        {isAr ? "قناتي" : "YouTube Channel"}
                     </Link>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-32 lg:py-60 text-center">
         <div className="section-frame">
            <motion.div {...inView(0)}>
               <h2 className="headline-display text-[clamp(2.5rem,12vw,10rem)] text-[var(--os-text-1)] mb-12 lg:mb-16">
                  {isAr ? "لنبني معاً." : "Let's Build."}
               </h2>
               <p className="mb-10 text-[15px] font-bold text-[var(--os-text-2)]">
                  {isAr ? "ماذا نبني معاً؟" : "What can we build together?"}
               </p>
               <div className="flex max-w-4xl flex-col flex-wrap justify-center gap-3 sm:flex-row sm:justify-center">
                  <Link href={`/${locale}/contact`} className="btn-primary w-full sm:w-auto">
                     {isAr ? "أحتاج موقعاً" : "I need a website"}
                  </Link>
                  <Link href={`/${locale}/contact`} className="btn-secondary w-full sm:w-auto">
                     {isAr ? "شركة نقل / منقولات" : "Transport / moving site"}
                  </Link>
                  <Link href={`/${locale}/contact`} className="btn-secondary w-full sm:w-auto">
                     {isAr ? "تطبيق أو TV" : "App / TV product"}
                  </Link>
                  <Link href={`/${locale}/contact`} className="btn-secondary w-full sm:w-auto">
                     {isAr ? "مراجعة أو تعاون" : "Review or collaboration"}
                  </Link>
               </div>
            </motion.div>
         </div>
      </section>

    </div>
  );
}
