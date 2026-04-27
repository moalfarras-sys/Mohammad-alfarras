"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PlayCircle, Bot, Box, MonitorSmartphone, PenTool, Wand2, Lightbulb, ArrowUpRight } from "lucide-react";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const copy = {
  en: {
    eyebrow: "YouTube Channel",
    title: "Arabic Tech Media · Built on Honesty",
    body: "Explaining SaaS tools, AI, apps, and electronics in clear Arabic — no hype, just real product clarity.",
    openChannel: "Open channel",
    subscribe: "Subscribe now",
    statsTitle: "Channel reach",
    categoriesTitle: "Content pillars",
    collabTitle: "Partner with the channel",
    collabBody: "Niche Arabic tech audience. 80%+ MENA. Decision-makers in tech and productivity.",
    collabCta: "Get in touch",
    audienceTitle: "Audience profile",
  },
  ar: {
    eyebrow: "قناة يوتيوب",
    title: "محتوى تقني عربي · يبني على الصدق",
    body: "شرح أدوات SaaS والذكاء الاصطناعي والتطبيقات والإلكترونيات بعربية واضحة — بلا مبالغة، فقط وضوح حقيقي للمنتج.",
    openChannel: "افتح القناة",
    subscribe: "اشترك الآن",
    statsTitle: "وصول القناة",
    categoriesTitle: "محاور المحتوى",
    collabTitle: "تعاون مع القناة",
    collabBody: "جمهور تقني عربي متخصص. أكثر من 80% من منطقة الشرق الأوسط وشمال أفريقيا.",
    collabCta: "تواصل معي",
    audienceTitle: "ملف الجمهور",
  },
} as const;

export function YoutubePageBody({ model }: { model: SiteViewModel }) {
  const t = repairMojibakeDeep(copy[model.locale]);
  const isAr = model.locale === "ar";

  const channelUrl = `https://www.youtube.com/${model.youtube.handle ?? "@Moalfarras"}`;
  const subscribeUrl = `${channelUrl}?sub_confirmation=1`;

  const views = typeof model.youtube.views === "number" && model.youtube.views > 1000000
    ? `${(model.youtube.views / 1000000).toFixed(1)}M+` : "1.5M+";
  const subs = typeof model.youtube.subscribers === "number" && model.youtube.subscribers > 1000
    ? `${(model.youtube.subscribers / 1000).toFixed(1)}K+` : "6.1K+";
  const vids = (typeof model.youtube.videos === "number" && model.youtube.videos > 0) ? String(model.youtube.videos) : "162";

  const stats = [
    { label: isAr ? "إجمالي المشاهدات" : "Total Views", value: views, color: "text-red-400" },
    { label: isAr ? "المشتركون" : "Subscribers", value: subs, color: "text-[var(--os-teal)]" },
    { label: isAr ? "الفيديوهات" : "Videos", value: vids, color: "text-[var(--os-violet)]" },
  ];

  const categories = [
    { icon: <Bot className="h-5 w-5" />, en: "AI & SaaS Tools", ar: "أدوات الذكاء الاصطناعي" },
    { icon: <Box className="h-5 w-5" />, en: "Apps", ar: "تطبيقات" },
    { icon: <MonitorSmartphone className="h-5 w-5" />, en: "Electronics", ar: "إلكترونيات" },
    { icon: <PenTool className="h-5 w-5" />, en: "Design Tools", ar: "أدوات التصميم" },
    { icon: <Wand2 className="h-5 w-5" />, en: "Marketing Tools", ar: "أدوات التسويق" },
    { icon: <Lightbulb className="h-5 w-5" />, en: "Tutorials", ar: "شروحات" },
  ];

  const audience = [
    { label: "MENA Region", val: 80 },
    { label: "Age 18–34", val: 75 },
    { label: "Male Audience", val: 90 },
    { label: "Tech Interest", val: 100 },
  ];

  return (
    <div className="relative pb-32 pt-28" dir={isAr ? "rtl" : "ltr"} data-testid="youtube-page">
      {/* Hero */}
      <section className="section-frame mb-20">
        <div className="grid gap-14 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <motion.span {...inView(0)} className="eyebrow mb-5 inline-flex">{t.eyebrow}</motion.span>
            <motion.h1 {...inView(0.06)} className="headline-display text-[clamp(2rem,5vw,4rem)] font-bold text-[var(--os-text-1)]">
              {t.title}
            </motion.h1>
            <motion.p {...inView(0.12)} className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--os-text-2)]">
              {t.body}
            </motion.p>
            <motion.div {...inView(0.18)} className="mt-8 flex flex-wrap gap-4">
              <a href={channelUrl} target="_blank" rel="noopener noreferrer"
                className="btn-primary bg-red-600 border-red-700 shadow-[0_8px_28px_rgba(239,68,68,0.3)]"
                style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
              >
                <PlayCircle className="h-5 w-5" /> {t.openChannel}
              </a>
              <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                {t.subscribe}
              </a>
            </motion.div>
          </div>

          {/* Channel hero image */}
          <motion.div {...inView(0.1)} className="relative">
            <div className="absolute -inset-6 rounded-full bg-red-600 opacity-[0.05] blur-[80px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--os-border)] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
              <div className="relative aspect-video w-full">
                <Image
                  src={model.brandMedia.youtubeHero || "/images/yt-channel-hero.png"}
                  alt="YouTube Channel"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                    <PlayCircle className="h-4 w-4 text-[var(--os-text-1)]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--os-text-1)]">
                    {isAr ? "شروحات تقنية عربية" : "Arabic Tech Reviews"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-frame mb-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} {...inView(i * 0.08)} className="glass-card p-10 text-center">
              <p className={`text-[3.5rem] font-bold tracking-tight ${s.color}`}>{s.value}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--os-text-3)]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Content pillars */}
      <section className="py-20 bg-[var(--os-surface)]/30">
        <div className="section-frame">
          <motion.div {...inView(0)} className="mb-12 text-center">
            <span className="eyebrow mx-auto mb-4">{t.categoriesTitle}</span>
            <h2 className="headline-display text-[2rem] font-bold text-[var(--os-text-1)] mt-4">Content Pillars</h2>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <motion.div key={c.en} {...inView(i * 0.06)} className="glass-card p-8 flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  {c.icon}
                </div>
                <h3 className="text-[15px] font-bold text-[var(--os-text-1)]">{isAr ? c.ar : c.en}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Collab + Audience */}
      <section className="py-20">
        <div className="section-frame grid gap-8 lg:grid-cols-2">
          <motion.div {...inView(0)} className="glass-card p-10">
            <h2 className="text-[1.4rem] font-bold text-[var(--os-text-1)] mb-4">{t.collabTitle}</h2>
            <p className="text-[14px] leading-relaxed text-[var(--os-text-2)] mb-8">{t.collabBody}</p>
            <a href={`/${model.locale}/contact?subject=Collaboration`} className="btn-primary">
              {t.collabCta} <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div {...inView(0.08)} className="glass-card p-10">
            <h2 className="text-[1.4rem] font-bold text-[var(--os-text-1)] mb-8">{t.audienceTitle}</h2>
            <div className="space-y-6">
              {audience.map((a) => (
                <div key={a.label}>
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--os-text-3)]">{a.label}</span>
                    <span className="text-[13px] font-bold text-[var(--os-text-1)]">{a.val}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${a.val}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--os-teal)] to-[var(--os-violet)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest videos */}
      {model.latestVideos?.length > 0 && (
        <section className="py-20 bg-[var(--os-surface)]/30">
          <div className="section-frame">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow mb-3 inline-flex">{isAr ? "أحدث الفيديوهات" : "Latest videos"}</span>
                <h2 className="headline-display text-[1.8rem] font-bold text-[var(--os-text-1)] mt-3">Visual Proof</h2>
              </div>
              <a href={channelUrl} target="_blank" rel="noopener noreferrer"
                className="text-[12px] font-semibold text-[var(--os-text-3)] hover:text-[var(--os-teal)] transition-colors flex items-center gap-1"
              >
                {isAr ? "جميع الفيديوهات" : "View all"} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {model.latestVideos.slice(0, 3).map((video, i) => (
                <motion.a
                  key={video.id}
                  {...inView(i * 0.07)}
                  href={`https://youtube.com/watch?v=${video.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card group block overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={video.thumbnail}
                      alt={video.title_en || video.youtube_id}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-2xl">
                        <PlayCircle className="h-7 w-7 text-[var(--os-text-1)]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-[14px] font-semibold text-[var(--os-text-1)] leading-snug group-hover:text-[var(--os-teal)] transition-colors">
                      {isAr ? (video.title_ar || video.title_en) : (video.title_en || video.title_ar)}
                    </h3>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
