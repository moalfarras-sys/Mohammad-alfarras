"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { BarChart, Eye, Heart, MessageSquare, Play, PlayCircle, Sparkles } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useThemeMode } from "@/components/layout/use-theme-mode";
import { formatNumber } from "@/lib/locale-format";
import type { LiveYoutubeComment } from "@/lib/youtube-live";

import type { SiteViewModel } from "./site-view-client";

export function YoutubeProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  const ytData = model.live.youtube;
  const { theme } = useThemeMode();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLight = mounted && theme === "light";

  const cmsHandle = typeof model.youtube.handle === "string" ? model.youtube.handle : "@Moalfarras";
  const channelUrl = `https://www.youtube.com/${cmsHandle.startsWith("@") ? cmsHandle : `@${cmsHandle}`}`;

  const subscribers = ytData?.subscribers ?? Number(model.youtube.subscribers || 0);
  const totalViews = ytData?.totalViews ?? Number(model.youtube.views || 0);

  const featuredVid = ytData?.popularVideos?.[0] || ytData?.videos?.[0] || null;
  const recentVideos = (ytData?.videos || []).filter(v => v.id !== featuredVid?.id).slice(0, 4);
  const popularVideos = (ytData?.popularVideos || []).filter(v => v.id !== featuredVid?.id).slice(0, 4);

  const comments: LiveYoutubeComment[] = ytData?.comments ?? [];

  const fmtSub = formatNumber(locale, subscribers, { notation: "compact", maximumFractionDigits: 1 });
  const fmtViews = formatNumber(locale, totalViews, { notation: "compact", maximumFractionDigits: 1 });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 80, damping: 15 } },
  };

  const statCards = [
    {
      icon: Eye,
      color: "#ff6b00",
      value: fmtViews,
      label: locale === "ar" ? "إجمالي المشاهدات" : "Total Views",
    },
    {
      icon: Heart,
      color: "#ff4d4d",
      value: fmtSub,
      label: locale === "ar" ? "المشتركون" : "Subscribers",
    },
    {
      icon: Sparkles,
      color: "#00ff87",
      value: `${ytData?.videoCount || 162}`.padStart(2, "0"),
      label: locale === "ar" ? "أحدث الإصدارات" : "Recent Releases",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden py-32" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="youtube-page">
      {/* Background is handled by Global Atmospheric Engine */}

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <motion.section
            variants={item}
            whileHover={{ rotateX: -1, rotateY: 1 }}
            className="relative overflow-hidden rounded-[3rem] border border-border/60 bg-surface/50 p-6 md:col-span-12 md:p-14 shadow-2xl backdrop-blur-2xl perspective-[1200px]"
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(circle_at_center,rgba(255,0,50,0.16),transparent_58%)] opacity-70" />
            <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-[rgba(168,85,247,0.16)] blur-[120px]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div
                  className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
                  style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4d4d" }}
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff0000] shadow-[0_0_8px_#ff0000]" />
                  {ytData?.channelTitle || (locale === "ar" ? "قناة محمد الفراس" : "Mohammad Alfarras Official")}
                </div>

                <h1 className="headline-arabic text-5xl font-black leading-[1.05] md:text-7xl lg:text-8xl text-foreground">
                  {locale === "ar" ? "سينما" : "Tech"} <span className="bg-gradient-to-r from-[#ff0033] to-[#ff6b00] bg-clip-text text-transparent">{locale === "ar" ? "تقنية" : "Cinema"}</span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg font-semibold leading-9 md:text-xl text-foreground-muted">
                  {locale === "ar"
                    ? "القناة هي المختبر البصري لكل ما أبني. هنا تتحول الأرقام والأكواد إلى قصص، مراجعات، وتجارب تقنية تُعرض بأعلى جودة سردية."
                    : "The channel is the visual lab for everything I build. Here, numbers and code transform into stories, reviews, and high-fidelity technical experiments."}
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <motion.a
                    whileHover={{ scale: 1.05, rotate: -1 }}
                    whileTap={{ scale: 0.98 }}
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 rounded-[2rem] bg-[#ff0000] px-10 py-5 font-black text-white shadow-2xl transition-all"
                  >
                    <PlayCircle className="h-6 w-6 transition-transform group-hover:rotate-12" />
                    {locale === "ar" ? "اشترك الآن" : "Subscribe"}
                  </motion.a>

                  <div className="flex -space-x-3 rtl:space-x-reverse">
                    {["M", "A", "F", "+"].map((token, i) => (
                      <div
                        key={token}
                        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-surface text-xs font-black text-white shadow-sm"
                        style={{
                          background: i === 3 ? "linear-gradient(135deg, #ff6b00, #ff0033)" : "linear-gradient(135deg, #111827, #374151)",
                        }}
                      >
                        {token}
                      </div>
                    ))}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-surface bg-[#111] font-mono text-xs font-bold text-white">
                      +{fmtSub}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {statCards.map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      whileHover={{ scale: 1.02, x: locale === "ar" ? -8 : 8 }}
                      className="stats-glass-card group relative overflow-hidden rounded-[2.5rem] p-8 transition-all"
                    >
                      <div className="relative flex items-center gap-6">
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:rotate-12"
                          style={{
                            color: stat.color,
                            border: `1px solid ${stat.color}33`,
                            background: isLight ? `${stat.color}14` : "rgba(255,255,255,0.05)",
                            boxShadow: isLight ? `0 12px 28px ${stat.color}16` : "none",
                          }}
                        >
                          <StatIcon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="font-mono text-4xl font-black text-foreground">
                            {stat.value}
                          </p>
                          <p className="stats-label font-bold uppercase tracking-[0.2em]" style={{ fontSize: "0.65rem" }}>
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {featuredVid && (
            <motion.section
              variants={item}
              className="relative overflow-hidden rounded-[4rem] border border-border/60 md:col-span-12 shadow-3xl group"
              style={{ background: isLight ? "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94))" : "#000000" }}
            >
              <div className="relative aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${featuredVid.id}?autoplay=0&rel=0&modestbranding=1`}
                  title={featuredVid.title}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
                  <span className="eyebrow text-[#ff0033] mb-4 block">{locale === "ar" ? "الفيديو الأكثر تميزاً" : "Featured Spotlight"}</span>
                  <h2 className="headline-arabic text-3xl font-black text-foreground md:text-5xl lg:text-6xl line-clamp-2 max-w-5xl">
                    {featuredVid.title}
                  </h2>
                </div>
              </div>
            </motion.section>
          )}

          <div className="md:col-span-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...recentVideos, ...popularVideos].slice(0, 6).map((vid, i) => (
              <motion.a
                key={`${vid.id}-${i}`}
                variants={item}
                href={`https://www.youtube.com/watch?v=${vid.id}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ rotateX: -2, rotateY: 2, scale: 1.02 }}
                className="group relative flex flex-col overflow-hidden rounded-[3rem] border border-border/40 bg-surface/40 backdrop-blur-xl transition-all shadow-lg"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image src={vid.thumbnail} alt={vid.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 backdrop-blur-sm">
                      <Play className="ml-1 h-8 w-8 text-foreground" fill="white" />
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="mb-4 line-clamp-2 text-xl font-black leading-tight text-foreground">{vid.title}</h4>
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground-muted">
                    <span className="flex items-center gap-2">
                       <BarChart className="h-3 w-3" /> {formatNumber(locale, vid.views, { notation: "compact" })}
                    </span>
                    <span>{new Date(vid.publishedAt).getFullYear()}</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {comments.length > 0 && (
            <motion.section
              variants={item}
              className="relative overflow-hidden rounded-[3rem] border border-border/60 bg-surface/50 p-8 md:col-span-12 md:p-14 shadow-2xl backdrop-blur-2xl"
            >
              <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                  <h3 className="flex items-center gap-3 text-3xl font-black text-foreground">
                    <MessageSquare className="h-8 w-8 text-[#a855f7]" />
                    {locale === "ar" ? "نبض المجتمع" : "Community Pulse"}
                  </h3>
                  <p className="mt-2 font-semibold text-foreground-muted">
                    {locale === "ar" ? "تفاعلات حقيقية من أشخاص يثقون في الرحلة." : "Real interactions from people who trust the journey."}
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-white/5 p-2 pr-6 border border-white/10 backdrop-blur-md">
                   <div className="flex -space-x-2">
                     {["A", "Y", "M"].map((token, i) => (
                        <div
                          key={token}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface text-[11px] font-black text-white shadow-sm"
                          style={{ background: i === 1 ? "linear-gradient(135deg, #a855f7, #6366f1)" : "linear-gradient(135deg, #0f172a, #334155)" }}
                        >
                          {token}
                        </div>
                     ))}
                   </div>
                   <span className="text-sm font-black text-foreground">Active Global Audience</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {comments.map((cm) => (
                  <motion.a
                    key={cm.id}
                    href={`https://www.youtube.com/watch?v=${cm.videoId}&lc=${cm.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.08)", scale: 1.02 }}
                    className="group relative flex flex-col justify-between rounded-[2.2rem] border border-border/40 bg-surface/60 p-8 shadow-xl backdrop-blur-md transition-all"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                       <MessageSquare className="h-12 w-12" />
                    </div>
                    <div className="relative">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#a855f7] to-[#00ff87] font-black text-black">
                          {cm.author.substring(0, 1) || "U"}
                        </div>
                        <div>
                           <span className="block text-sm font-black text-foreground">
                            {cm.author.replace("@", "")}
                           </span>
                           <span className="block text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">Verified Viewer</span>
                        </div>
                      </div>
                      <p className="line-clamp-6 text-sm italic font-medium leading-relaxed text-foreground-muted group-hover:text-foreground transition-colors">
                        &ldquo;{cm.text}&rdquo;
                      </p>
                    </div>
                    {cm.likes > 0 && (
                      <div className="mt-8 flex items-center gap-2 rounded-full bg-[#ff4d4d15] px-4 py-2 w-fit text-[10px] font-black text-[#ff4d4d] border border-[#ff4d4d22]">
                        <Heart className="h-3 w-3" fill="currentColor" /> {cm.likes} LOVES
                      </div>
                    )}
                  </motion.a>
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      </div>
    </div>
  );
}
