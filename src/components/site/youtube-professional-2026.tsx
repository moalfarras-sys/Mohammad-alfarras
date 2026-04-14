"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { BarChart, Heart, MessageSquare, Play, PlayCircle, Sparkles, Users } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useThemeMode } from "@/components/layout/use-theme-mode";
import { formatNumber } from "@/lib/locale-format";
import type { LiveYoutubeComment, LiveYoutubeVideo } from "@/lib/youtube-live";

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
  const videos: LiveYoutubeVideo[] =
    ytData?.videos ??
    model.latestVideos.slice(0, 4).map((video) => ({
      id: video.youtube_id,
      title: locale === "ar" ? video.title_ar || video.title_en || video.youtube_id : video.title_en || video.title_ar || video.youtube_id,
      publishedAt: video.published_at,
      thumbnail: video.thumbnail,
      views: Number(video.views || 0),
    }));
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
      icon: Users,
      color: "#ff4d4d",
      value: fmtSub,
      label: locale === "ar" ? "مشترك" : "Subscribers",
    },
    {
      icon: BarChart,
      color: "#a855f7",
      value: fmtViews,
      label: locale === "ar" ? "إجمالي المشاهدات" : "Total Views",
    },
    {
      icon: Sparkles,
      color: "#00ff87",
      value: `${videos.length}`.padStart(2, "0"),
      label: locale === "ar" ? "أحدث الإصدارات" : "Recent Releases",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden py-32" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="youtube-page">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: isLight ? "linear-gradient(180deg, #f8fafc 0%, #eef2f8 45%, #edf4f1 100%)" : "#04060A" }}
      />
      <motion.div
        animate={{ filter: ["blur(50px)", "blur(80px)", "blur(50px)"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 z-0 opacity-20 mix-blend-screen"
        style={{
          background: isLight
            ? "radial-gradient(circle at 20% 0%, rgba(255,70,90,0.12) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.12) 0%, transparent 55%)"
            : "radial-gradient(circle at 20% 0%, rgba(255,0,50,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.15) 0%, transparent 60%)",
        }}
      />

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <motion.section
            variants={item}
            className="relative overflow-hidden rounded-[2.8rem] border px-7 py-10 md:col-span-12 md:px-12 md:py-14"
            style={{
              background: isLight
                ? "linear-gradient(140deg, rgba(255,255,255,0.9), rgba(248,250,252,0.96))"
                : "linear-gradient(145deg, rgba(20,10,15,0.6), rgba(10,8,15,0.86))",
              borderColor: isLight ? "rgba(226,232,240,0.9)" : "rgba(255,0,50,0.1)",
              backdropFilter: "blur(24px)",
              boxShadow: isLight ? "0 24px 70px rgba(15,23,42,0.08)" : undefined,
            }}
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(circle_at_center,rgba(255,0,50,0.16),transparent_58%)] opacity-70" />
            <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-[rgba(168,85,247,0.16)] blur-[120px]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="text-center md:text-start">
                <div
                  className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
                  style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4d4d" }}
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff0000] shadow-[0_0_8px_#ff0000]" />
                  {locale === "ar" ? "قناة يوتيوب الرسمية" : "Official YouTube Channel"}
                </div>

                <h1 className="headline-arabic text-5xl font-black leading-[1.05] md:text-6xl lg:text-7xl" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                  {locale === "ar" ? "منصة محتوى تقني" : "Technical Video"} <span className="shimmer-text">{locale === "ar" ? "حية ومؤثرة" : "Ecosystem"}</span>
                </h1>

                <p className="mt-4 font-mono text-sm font-bold uppercase tracking-[0.28em] text-[#a855f7]">
                  LOGISTICS • FRONTEND • REVIEWS
                </p>

                <p className="mx-auto mt-6 max-w-2xl text-base leading-8 md:mx-0 md:text-lg" style={{ color: isLight ? "#475569" : "var(--color-foreground-muted)" }}>
                  {locale === "ar"
                    ? "القناة هنا ليست مجرد فيديوهات منفصلة. هي امتداد مباشر للبراند: مراجعات، شرح، وتجارب تقنية تُعرض بلغة واضحة وسرد بصري حاد."
                    : "This channel is not a disconnected feed. It is the video layer of the brand: reviews, breakdowns, and technical storytelling with clear positioning."}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                  <motion.a
                    whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(255,0,0,0.22)" }}
                    whileTap={{ scale: 0.98 }}
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #ff0033, #cc0000)" }}
                  >
                    <PlayCircle className="h-5 w-5 fill-white text-red-700" />
                    {locale === "ar" ? "زيارة القناة" : "Open Channel"}
                  </motion.a>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-5 py-4 text-sm font-semibold"
                    style={{
                      background: isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.05)",
                      border: isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid rgba(255,255,255,0.08)",
                      color: isLight ? "#334155" : "rgba(255,255,255,0.76)",
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                    {locale === "ar" ? "ربط حي مع الإحصاءات والفيديوهات" : "Live-linked to stats and videos"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-[1.9rem] border p-6 text-center lg:text-start"
                      style={{
                        background: isLight ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.46)",
                        borderColor: isLight ? "rgba(226,232,240,0.9)" : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <Icon className="mx-auto mb-3 h-6 w-6 lg:mx-0" style={{ color: stat.color }} />
                      <p className="font-mono text-3xl font-black md:text-4xl" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: isLight ? "#64748b" : "var(--color-foreground-soft)" }}>
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {videos.length > 0 && (
            <motion.section
              variants={item}
              className="relative overflow-hidden rounded-[2.5rem] border p-8 md:col-span-12 md:p-12"
              style={{
                background: isLight ? "rgba(255,255,255,0.82)" : "rgba(10,15,25,0.4)",
                borderColor: isLight ? "rgba(226,232,240,0.9)" : "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-black" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                <Play className="h-6 w-6 text-[#ff0033]" fill="#ff0033" />
                {locale === "ar" ? "أحدث الفيديوهات" : "Latest Releases"}
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {videos.map((vid) => (
                  <motion.a
                    key={vid.id}
                    href={`https://www.youtube.com/watch?v=${vid.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group relative overflow-hidden rounded-[2rem] border bg-black"
                    style={{ borderColor: isLight ? "rgba(226,232,240,0.9)" : "rgba(255,255,255,0.05)" }}
                  >
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image src={vid.thumbnail} alt={vid.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 backdrop-blur-sm">
                          <Play className="ml-1 h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-6 pt-12">
                        <h4 className="mb-3 line-clamp-2 text-lg font-bold leading-tight text-white md:text-xl">{vid.title}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold font-mono text-foreground-soft">
                          <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-md">
                            {formatNumber(locale, vid.views, { notation: "compact", maximumFractionDigits: 1 })} {locale === "ar" ? "مشاهدة" : "Views"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.section>
          )}

          {comments.length > 0 && (
            <motion.section
              variants={item}
              className="relative overflow-hidden rounded-[2.5rem] border p-8 md:col-span-12 md:p-12"
              style={{
                background: isLight ? "rgba(255,255,255,0.82)" : "rgba(10,15,25,0.4)",
                borderColor: isLight ? "rgba(226,232,240,0.9)" : "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-black" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                <MessageSquare className="h-6 w-6 text-[#a855f7]" />
                {locale === "ar" ? "تفاعل الجمهور" : "Audience Pulse"}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {comments.map((cm) => (
                  <motion.a
                    key={cm.id}
                    href={`https://www.youtube.com/watch?v=${cm.videoId}&lc=${cm.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="flex flex-col justify-between rounded-2xl p-6 transition-colors"
                    style={{
                      background: isLight ? "rgba(248,250,252,0.9)" : "rgba(255,255,255,0.02)",
                      border: isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#a855f7] to-[#00ff87] text-xs font-bold uppercase text-black">
                          {cm.author.substring(0, 1) || "U"}
                        </div>
                        <span className="text-sm font-bold" style={{ color: isLight ? "#334155" : "rgba(255,255,255,0.8)" }}>
                          {cm.author.replace("@", "")}
                        </span>
                      </div>
                      <p className="line-clamp-4 text-sm italic leading-relaxed" style={{ color: isLight ? "#475569" : "var(--color-foreground-muted)" }}>
                        &ldquo;{cm.text}&rdquo;
                      </p>
                    </div>
                    {cm.likes > 0 && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#ff4d4d]">
                        <Heart className="h-3.5 w-3.5" fill="currentColor" /> {cm.likes}
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
