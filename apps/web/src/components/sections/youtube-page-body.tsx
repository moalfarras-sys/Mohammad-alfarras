"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { PlayCircle, Sparkles, MonitorSmartphone, Wand2, PenTool, Bot, Box, Lightbulb } from "lucide-react";

import { ContactCtaSection } from "@/components/sections/contact-cta-section";
import type { SiteViewModel } from "@/components/site/site-view-model";

const copy = {
  en: {
    eyebrow: "YouTube Channel",
    title: "Arabic tech content that earns trust, not just attention.",
    body: "The channel is part of the professional identity. It proves that product explanation, consistency, and presentation quality can grow a real audience over time.",
    openChannel: "Open channel",
    subscribe: "Subscribe",
    statsTitle: "Channel reach",
    categoriesTitle: "Content Focus",
  },
  ar: {
    eyebrow: "قناة يوتيوب",
    title: "محتوى تقني عربي يصنع الثقة لا مجرد استهلاك الانتباه.",
    body: "القناة جزء من الهوية المهنية. تُثبت أن جودة الشرح والتقديم والثبات يمكن أن تبني جمهورًا حقيقيًا يتراكم مع الوقت.",
    openChannel: "افتح القناة",
    subscribe: "اشترك",
    statsTitle: "تأثير القناة",
    categoriesTitle: "محاور المحتوى",
  },
} as const;

export function YoutubePageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const isAr = model.locale === "ar";
  const reduced = useReducedMotion();

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
    { id: "tech", icon: <MonitorSmartphone className="h-6 w-6" />, titleEn: "Electronics", titleAr: "إلكترونيات" },
    { id: "apps", icon: <Box className="h-6 w-6" />, titleEn: "Apps", titleAr: "تطبيقات" },
    { id: "design", icon: <PenTool className="h-6 w-6" />, titleEn: "Design Tools", titleAr: "أدوات التصميم" },
    { id: "marketing", icon: <Wand2 className="h-6 w-6" />, titleEn: "Marketing Tools", titleAr: "أدوات التسويق" },
    { id: "tutorials", icon: <Lightbulb className="h-6 w-6" />, titleEn: "Tutorials", titleAr: "شروحات" },
  ];

  return (
    <div data-testid="youtube-page">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 10%, rgba(255,0,0,0.06) 0%, transparent 60%)" }} />
        
        <div className="section-frame relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.eyebrow}</p>
              <h1 className="mt-4 overflow-visible pb-2 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,4.5vw,3.8rem)" }}>
                {t.title}
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-2)] md:text-lg">{t.body}</p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-primary inline-flex items-center gap-2" style={{ background: "linear-gradient(135deg, #ff0000, #cc0000)" }}>
                  <PlayCircle className="h-4 w-4" />
                  {t.openChannel}
                </a>
                <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary inline-flex items-center gap-2">
                  {t.subscribe}
                </a>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.2 : 0.8 }}
              className="relative aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xl)]"
            >
              <div className="glass relative h-full w-full overflow-hidden" style={{ boxShadow: "var(--shadow-hero)" }}>
                <Image
                  src={model.brandMedia.youtubeHero || "/images/yt-channel-hero.png"}
                  alt="YouTube Channel"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-red-500" />
                    {isAr ? "شروحات موثوقة" : "Trusted Reviews"}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.statsTitle}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: isAr ? "إجمالي المشاهدات" : "Total Views", value: views },
              { label: isAr ? "مشترك" : "Subscribers", value: subs },
              { label: isAr ? "فيديو" : "Videos", value: vids },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-[var(--radius-xl)] p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="text-[clamp(2rem,5vw,3.5rem)] font-black text-[var(--text-1)]">{stat.value}</div>
                <div className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.categoriesTitle}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="glass rounded-[var(--radius-lg)] p-6 transition-transform hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  {cat.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-[var(--text-1)]">
                  {isAr ? cat.titleAr : cat.titleEn}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL VIDEOS (IF ANY) ── */}
      {model.latestVideos && model.latestVideos.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="section-frame">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
              {isAr ? "أحدث الفيديوهات" : "Latest Videos"}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {model.latestVideos.slice(0, 6).map((video) => (
                <a
                  key={video.id}
                  href={`https://youtube.com/watch?v=${video.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass block overflow-hidden rounded-[var(--radius-xl)]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={video.thumbnail}
                      alt={video.title_en || video.youtube_id}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/20 transition-colors group-hover:bg-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                        <PlayCircle className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-1)] leading-relaxed">
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
