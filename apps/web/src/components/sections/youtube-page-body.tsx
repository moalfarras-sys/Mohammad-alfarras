"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PlayCircle, Sparkles, MonitorSmartphone, Wand2, PenTool, Bot, Box, Lightbulb } from "lucide-react";

import { ContactCtaSection } from "@/components/sections/contact-cta-section";
import type { SiteViewModel } from "@/components/site/site-view-model";
import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

const copy = {
  en: {
    eyebrow: "YouTube Channel",
    title: "Creator Media Kit & Channel Stats",
    body: "A business card for sponsors and partners. Engaging Arabic tech content with 1.5M+ Views focused on Tech & Design.",
    openChannel: "Open channel",
    subscribe: "Subscribe",
    statsTitle: "Channel reach",
    categoriesTitle: "Content Focus",
  },
  ar: {
    eyebrow: "قناة يوتيوب",
    title: "الملف الإعلامي وإحصائيات القناة",
    body: "واجهة للشركاء والرعاة. محتوى تقني عربي يركز على التكنولوجيا والتصميم مع أكثر من مليون ونصف مشاهدة.",
    openChannel: "افتح القناة",
    subscribe: "اشترك",
    statsTitle: "تأثير القناة",
    categoriesTitle: "محاور المحتوى",
  },
} as const;

export function YoutubePageBody({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(copy[model.locale]);
  const isAr = model.locale === "ar";

  const channelUrl = `https://www.youtube.com/${model.youtube.handle ?? "@Moalfarras"}`;
  const subscribeUrl = `${channelUrl}?sub_confirmation=1`;

  const views = typeof model.youtube.views === "number" && model.youtube.views > 1000000 
    ? `${(model.youtube.views / 1000000).toFixed(1)}M+` 
    : "1.5M+";
  const subs = typeof model.youtube.subscribers === "number" && model.youtube.subscribers > 1000 
    ? `${(model.youtube.subscribers / 1000).toFixed(1)}K+` 
    : "6.1K+";
  const vids = (typeof model.youtube.videos === "number" && model.youtube.videos > 0) ? String(model.youtube.videos) : "162";

  const categories = [
    { id: "ai", icon: <Bot className="h-6 w-6" />, titleEn: "AI & SaaS Tools", titleAr: "أدوات الذكاء الاصطناعي و SaaS" },
    { id: "apps", icon: <Box className="h-6 w-6" />, titleEn: "Apps", titleAr: "تطبيقات" },
    { id: "tech", icon: <MonitorSmartphone className="h-6 w-6" />, titleEn: "Electronics", titleAr: "إلكترونيات" },
    { id: "design", icon: <PenTool className="h-6 w-6" />, titleEn: "Design Tools", titleAr: "أدوات التصميم" },
    { id: "marketing", icon: <Wand2 className="h-6 w-6" />, titleEn: "Marketing Tools", titleAr: "أدوات التسويق" },
    { id: "tutorials", icon: <Lightbulb className="h-6 w-6" />, titleEn: "Tutorials", titleAr: "شروحات" },
  ];

  return (
    <div className="relative pb-32" data-testid="youtube-page">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-red-600/10 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--text-3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        
        <div className="section-frame relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={cn("flex items-center gap-3 mb-8", isAr ? "flex-row-reverse" : "")}>
                <span className="h-[1px] w-8 bg-red-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">{t.eyebrow}</p>
              </div>
              <h1 className="headline-display text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight text-[var(--text-1)]">
                {t.title}
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-[var(--text-2)] md:text-xl max-w-2xl">
                {t.body}
              </p>
              
              <div className={cn("mt-12 flex flex-wrap gap-4", isAr ? "flex-row-reverse" : "")}>
                <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-primary px-10 h-16 text-lg" style={{ background: "linear-gradient(135deg, #ff0000, #cc0000)", border: "none" }}>
                  <PlayCircle className="h-5 w-5" />
                  {t.openChannel}
                </a>
                <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary px-8 h-16">
                  {t.subscribe}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
               <div className="absolute -inset-4 bg-gradient-to-br from-red-600/20 to-transparent blur-3xl opacity-30" />
               <div className="relative glass rounded-[3rem] border border-[var(--glass-border)] p-4 overflow-hidden shadow-2xl">
                  <div className="relative aspect-video w-full overflow-hidden rounded-[2.2rem]">
                    <Image
                      src={model.brandMedia.youtubeHero || "/images/yt-channel-hero.png"}
                      alt="YouTube Channel Preview"
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full border-2 border-white/20 bg-red-600 flex items-center justify-center">
                          <PlayCircle className="h-5 w-5 text-white" />
                       </div>
                       <span className="text-sm font-black uppercase tracking-widest text-white">{isAr ? "شروحات تقنية" : "Tech Reviews"}</span>
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS DASHBOARD ── */}
      <section className="py-12 md:py-20">
        <div className="section-frame">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: isAr ? "إجمالي المشاهدات" : "Total Reach", value: views, sub: "Organic Views" },
              { label: isAr ? "مشترك" : "Community", value: subs, sub: "Loyal Subscribers" },
              { label: isAr ? "فيديو" : "Content Assets", value: vids, sub: "Production Count" },
            ].map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-3xl p-10 text-center border-white/5"
              >
                <div className="text-5xl font-black text-[var(--text-1)] mb-2 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-1">{stat.label}</div>
                <div className="text-[11px] font-bold text-[var(--text-3)] opacity-60">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENT PILLARS ── */}
      <section className="py-24 md:py-32 bg-white/[0.01]">
        <div className="section-frame">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 mb-4">{t.categoriesTitle}</p>
            <h2 className="headline-display text-4xl md:text-6xl font-black text-[var(--text-1)]">Content Pillars</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass group rounded-[2.5rem] p-8 border-white/5 hover:border-red-500/20 transition-all"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-black text-[var(--text-1)]">
                  {isAr ? cat.titleAr : cat.titleEn}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUDIENCE DEMOGRAPHICS ── */}
      <section className="py-24 md:py-32">
        <div className="section-frame">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Value Prop */}
            <div className="glass rounded-[3rem] p-12 border-white/5">
              <h2 className="text-3xl font-black text-[var(--text-1)] mb-10">{isAr ? "لماذا ترعى القناة؟" : "Partnership Value"}</h2>
              <div className="grid gap-8 sm:grid-cols-2">
                 <div className="space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Sparkles className="h-5 w-5" /></div>
                    <h3 className="font-black text-[var(--text-1)] text-lg">{isAr ? "إنتاج سينمائي" : "Cinematic Quality"}</h3>
                    <p className="text-sm text-[var(--text-2)] leading-relaxed">{isAr ? "محتوى عالي الجودة يرفع من قيمة علامتك التجارية." : "High-fidelity production that elevates your brand perception."}</p>
                 </div>
                 <div className="space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Bot className="h-5 w-5" /></div>
                    <h3 className="font-black text-[var(--text-1)] text-lg">{isAr ? "جمهور نوعي" : "Niche Tech Audience"}</h3>
                    <p className="text-sm text-[var(--text-2)] leading-relaxed">{isAr ? "الوصول المباشر للمهتمين بالتقنية والإنتاجية." : "Direct access to decision-makers in tech and productivity."}</p>
                 </div>
              </div>
              <div className="mt-12">
                 <a href={`/${model.locale}/contact?subject=Collaboration`} className="button-liquid-primary px-10 h-14 bg-white text-black border-none hover:bg-white/90">
                    {isAr ? "تواصل للتعاون" : "Let's Collaborate"}
                 </a>
              </div>
            </div>
            
            {/* Stats */}
            <div className="glass rounded-[3rem] p-12 border-red-500/20 bg-red-500/[0.02]">
              <h2 className="text-2xl font-black text-[var(--text-1)] mb-10">{isAr ? "ديموغرافيا الجمهور" : "Audience Profile"}</h2>
              <div className="space-y-8">
                 {[
                   { label: "MENA Region", val: "80%", color: "bg-red-500" },
                   { label: "Male Audience", val: "90%", color: "bg-red-500" },
                   { label: "Age Group (18-34)", val: "75%", color: "bg-red-500" },
                   { label: "Tech Enthusiasts", val: "100%", color: "bg-red-500" },
                 ].map(stat => (
                   <div key={stat.label}>
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-3)]">{stat.label}</span>
                         <span className="text-sm font-black text-[var(--text-1)]">{stat.val}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: stat.val }}
                           viewport={{ once: true }}
                           className={cn("h-full", stat.color)} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST CONTENT GRID ── */}
      {model.latestVideos && model.latestVideos.length > 0 && (
        <section className="py-24 bg-white/[0.01]">
          <div className="section-frame">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
               <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">{isAr ? "أحدث الفيديوهات" : "Latest Assets"}</p>
                  <h2 className="headline-display text-4xl font-black text-[var(--text-1)]">Visual Proof</h2>
               </div>
               <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-black uppercase tracking-widest text-[var(--text-3)] hover:text-red-500 transition-colors">
                  View Full Channel
               </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {model.latestVideos.slice(0, 3).map((video) => (
                <a
                  key={video.id}
                  href={`https://youtube.com/watch?v=${video.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative glass block overflow-hidden rounded-[2.5rem] border-white/5"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={video.thumbnail}
                      alt={video.title_en || video.youtube_id}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                          <PlayCircle className="h-6 w-6 text-white" />
                       </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="line-clamp-2 text-base font-black text-[var(--text-1)] leading-tight group-hover:text-red-500 transition-colors">
                      {isAr ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactCtaSection locale={model.locale} />
    </div>
  );
}
