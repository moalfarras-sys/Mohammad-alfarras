"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart,
  Camera,
  Eye,
  Heart,
  MessageSquare,
  Mic2,
  Monitor,
  Play,
  PlayCircle,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { formatNumber } from "@/lib/locale-format";
import type { LiveYoutubeComment } from "@/lib/youtube-live";
import type { Locale } from "@/types/cms";
import type { SiteViewModel } from "./site-view-client";

function t<T>(locale: Locale, ar: T, en: T): T {
  return locale === "ar" ? ar : en;
}

export function YoutubeProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  const ytData = model.live.youtube;
  const cms = model.t.youtube;

  const cmsHandle =
    typeof model.youtube.handle === "string"
      ? model.youtube.handle
      : "@Moalfarras";
  const channelUrl = `https://www.youtube.com/${cmsHandle.startsWith("@") ? cmsHandle : `@${cmsHandle}`}`;

  const subscribers =
    ytData?.subscribers ?? Number(model.youtube.subscribers || 0);
  const totalViews =
    ytData?.totalViews ?? Number(model.youtube.views || 0);
  const videoCount = ytData?.videoCount ?? 162;

  const featuredVid =
    ytData?.popularVideos?.[0] || ytData?.videos?.[0] || null;
  const recentVideos = (ytData?.videos || [])
    .filter((v) => v.id !== featuredVid?.id)
    .slice(0, 4);
  const popularVideos = (ytData?.popularVideos || [])
    .filter((v) => v.id !== featuredVid?.id)
    .slice(0, 4);
  const allGridVideos = [...recentVideos, ...popularVideos].slice(0, 6);

  const comments: LiveYoutubeComment[] = ytData?.comments ?? [];

  const fmtSub = formatNumber(locale, subscribers, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const fmtViews = formatNumber(locale, totalViews, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 80, damping: 15 },
    },
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden py-32"
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-testid="youtube-page"
    >
      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          {/* ─── HERO ─── */}
          <HeroSection
            locale={locale}
            cms={cms}
            channelUrl={channelUrl}
            fmtSub={fmtSub}
            fmtViews={fmtViews}
            videoCount={videoCount}
            channelTitle={ytData?.channelTitle}
            item={item}
          />

          {/* ─── FEATURED VIDEO ─── */}
          {featuredVid && (
            <FeaturedVideo
              locale={locale}
              cms={cms}
              video={featuredVid}
              item={item}
            />
          )}

          {/* ─── LATEST VIDEOS GRID ─── */}
          {allGridVideos.length > 0 && (
            <VideoGrid
              locale={locale}
              cms={cms}
              videos={allGridVideos}
              item={item}
            />
          )}

          {/* ─── CONTENT PILLARS ─── */}
          <ContentPillars locale={locale} item={item} />

          {/* ─── COMMUNITY / COMMENTS ─── */}
          {comments.length > 0 && (
            <CommunitySection
              locale={locale}
              comments={comments}
              item={item}
            />
          )}

          {/* ─── WHY BRANDS WORK WITH ME ─── */}
          <CollaborationSection
            locale={locale}
            cms={cms}
            item={item}
          />

          {/* ─── FINAL CTA ─── */}
          <ConversionCta
            locale={locale}
            channelUrl={channelUrl}
            item={item}
          />
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

function HeroSection({
  locale,
  cms,
  channelUrl,
  fmtSub,
  fmtViews,
  videoCount,
  channelTitle,
  item,
}: {
  locale: Locale;
  cms: { eyebrow: string; title: string; body: string };
  channelUrl: string;
  fmtSub: string;
  fmtViews: string;
  videoCount: number;
  channelTitle?: string;
  item: Variants;
}) {
  const statCards = [
    {
      icon: Eye,
      color: "#6366F1",
      value: fmtViews,
      label: t(locale, "إجمالي المشاهدات", "Total Views"),
    },
    {
      icon: Heart,
      color: "#ff4d4d",
      value: fmtSub,
      label: t(locale, "المشتركون", "Subscribers"),
    },
    {
      icon: Sparkles,
      color: "#00E5FF",
      value: String(videoCount).padStart(2, "0"),
      label: t(locale, "أحدث الإصدارات", "Recent Releases"),
    },
  ];

  return (
    <motion.section
      variants={item}
      whileHover={{ rotateX: -1, rotateY: 1 }}
      className="yt-hero-card relative overflow-hidden rounded-[3rem] border border-border/60 p-6 md:col-span-12 md:p-14 shadow-2xl backdrop-blur-2xl perspective-distant"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(circle_at_center,rgba(255,0,50,0.16),transparent_58%)] opacity-70" />
      <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-[rgba(217,70,239,0.16)] blur-[120px]" />

      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <div className="yt-badge mb-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff0000] shadow-[0_0_8px_#ff0000]" />
            {channelTitle || t(locale, "قناة محمد الفراس", "Mohammad Alfarras Official")}
          </div>

          <h1 className="headline-arabic text-5xl font-black leading-[1.05] md:text-7xl lg:text-8xl text-foreground">
            {t(locale, "سينما", "Tech")}{" "}
            <span className="bg-linear-to-r from-[#ff0033] to-[#6366F1] bg-clip-text text-transparent">
              {t(locale, "تقنية", "Cinema")}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-semibold leading-9 md:text-xl text-foreground-muted">
            {cms.body}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <motion.a
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.98 }}
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="yt-subscribe-btn group relative flex items-center gap-3 rounded-4xl px-10 py-5 font-black shadow-2xl transition-all"
            >
              <PlayCircle className="h-6 w-6 transition-transform group-hover:rotate-12" />
              {t(locale, "اشترك الآن", "Subscribe Now")}
            </motion.a>
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
                whileHover={{
                  scale: 1.02,
                  x: locale === "ar" ? -8 : 8,
                }}
                className="stats-glass-card group relative overflow-hidden rounded-[2.5rem] p-8 transition-all"
              >
                <div className="relative flex items-center gap-6">
                  <div
                    className="yt-stat-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:rotate-12"
                    style={{
                      color: stat.color,
                      border: `1px solid ${stat.color}33`,
                    }}
                  >
                    <StatIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-mono text-4xl font-black text-foreground">
                      {stat.value}
                    </p>
                    <p
                      className="stats-label font-bold uppercase tracking-[0.2em]"
                      style={{ fontSize: "0.65rem" }}
                    >
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
  );
}

function FeaturedVideo({
  locale,
  cms,
  video,
  item,
}: {
  locale: Locale;
  cms: { featuredLabel: string };
  video: { id: string; title: string };
  item: Variants;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.section
      variants={item}
      className="yt-featured-section relative overflow-hidden rounded-[4rem] border border-border/60 md:col-span-12 shadow-3xl group"
    >
      <div className="relative aspect-video w-full">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <Image
              src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
              alt={video.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center transition-opacity"
              aria-label={t(locale, "تشغيل الفيديو", "Play video")}
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-red-600/90 backdrop-blur-sm shadow-2xl md:h-28 md:w-28"
              >
                <Play
                  className="h-12 w-12 text-white md:h-14 md:w-14"
                  fill="white"
                  style={{ marginInlineStart: "4px" }}
                />
              </motion.div>
            </button>
          </>
        )}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-8 md:p-14">
          <span className="eyebrow text-[#ff0033] mb-4 block">
            {cms.featuredLabel}
          </span>
          <h2 className="headline-arabic text-3xl font-black text-white md:text-5xl lg:text-6xl line-clamp-2 max-w-5xl drop-shadow-lg">
            {video.title}
          </h2>
        </div>
      </div>
    </motion.section>
  );
}

function VideoGrid({
  locale,
  cms,
  videos,
  item,
}: {
  locale: Locale;
  cms: { latestLabel: string };
  videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    publishedAt: string;
  }>;
  item: Variants;
}) {
  return (
    <>
      <motion.div variants={item} className="md:col-span-12 mb-2 mt-8">
        <span className="eyebrow">{cms.latestLabel}</span>
        <h2 className="headline-arabic text-3xl font-black text-foreground md:text-4xl">
          {t(
            locale,
            "أحدث ما نشرت — من المعمل البصري",
            "Latest from the Visual Lab",
          )}
        </h2>
      </motion.div>

      <div className="md:col-span-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((vid, i) => (
          <motion.a
            key={`${vid.id}-${i}`}
            variants={item}
            href={`https://www.youtube.com/watch?v=${vid.id}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ rotateX: -2, rotateY: 2, scale: 1.02 }}
            className="yt-video-card group relative flex flex-col overflow-hidden rounded-[3rem] border border-border/40 backdrop-blur-xl transition-all shadow-lg"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={vid.thumbnail}
                alt={vid.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90 backdrop-blur-sm">
                  <Play className="h-8 w-8 text-white" fill="white" />
                </div>
              </div>
            </div>
            <div className="p-8">
              <h4 className="mb-4 line-clamp-2 text-xl font-black leading-tight text-foreground">
                {vid.title}
              </h4>
              <div className="flex items-center justify-between font-mono text-xs font-bold text-foreground-muted">
                <span className="flex items-center gap-2">
                  <BarChart className="h-3 w-3" />{" "}
                  {formatNumber(locale, vid.views, {
                    notation: "compact",
                  })}
                </span>
                <span>
                  {new Date(vid.publishedAt).getFullYear()}
                </span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </>
  );
}

function ContentPillars({
  locale,
  item,
}: {
  locale: Locale;
  item: Variants;
}) {
  const pillars = [
    {
      icon: Monitor,
      title: t(locale, "مراجعات المنتجات", "Product Reviews"),
      body: t(
        locale,
        "شرح صادق لمنتجات تقنية حقيقية — بدون رعايات مخفية.",
        "Honest breakdowns of real tech products — no hidden sponsorships.",
      ),
      color: "#6366F1",
    },
    {
      icon: Camera,
      title: t(locale, "تجارب عملية", "Hands-on Experiences"),
      body: t(
        locale,
        "استخدام فعلي للمنتجات في الحياة اليومية قبل أي حكم.",
        "Real daily use before any judgment — not just spec sheets.",
      ),
      color: "#D946EF",
    },
    {
      icon: Zap,
      title: t(locale, "أدوات رقمية", "Digital Tools"),
      body: t(
        locale,
        "تطبيقات، أدوات، وحلول تقنية تسهّل العمل والحياة.",
        "Apps, tools, and digital solutions that simplify work and life.",
      ),
      color: "#00E5FF",
    },
    {
      icon: Mic2,
      title: t(locale, "محتوى تقني عربي", "Arabic Tech Content"),
      body: t(
        locale,
        "محتوى بالعربي لجمهور يستحق شرحاً يحترم ذكاءه.",
        "Arabic content for an audience that deserves intelligent explanation.",
      ),
      color: "#ff4d4d",
    },
  ];

  return (
    <motion.section
      variants={item}
      className="yt-pillars-section relative overflow-hidden rounded-[3rem] border border-border/60 p-8 md:col-span-12 md:p-14 shadow-2xl backdrop-blur-2xl"
    >
      <div className="mb-10">
        <span className="eyebrow">
          {t(locale, "أركان المحتوى", "Content Pillars")}
        </span>
        <h2 className="headline-arabic text-3xl font-black text-foreground md:text-4xl max-w-3xl">
          {t(
            locale,
            "أربعة محاور تصنع قيمة حقيقية — لا ضجيج.",
            "Four pillars that create real value — not noise.",
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              whileHover={{ y: -8, scale: 1.02 }}
              className="yt-pillar-card group relative rounded-[2.5rem] border border-border/40 p-8 transition-all"
            >
              <div
                className="yt-pillar-icon mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:rotate-12 group-hover:scale-110"
                style={{
                  color: p.color,
                  border: `1px solid ${p.color}33`,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-black text-foreground">
                {p.title}
              </h3>
              <p className="text-sm font-medium leading-7 text-foreground-muted">
                {p.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function CommunitySection({
  locale,
  comments,
  item,
}: {
  locale: Locale;
  comments: LiveYoutubeComment[];
  item: Variants;
}) {
  return (
    <motion.section
      variants={item}
      className="yt-community-section relative overflow-hidden rounded-[3rem] border border-border/60 p-8 md:col-span-12 md:p-14 shadow-2xl backdrop-blur-2xl"
    >
      <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div>
          <h3 className="flex items-center gap-3 text-3xl font-black text-foreground">
            <MessageSquare className="h-8 w-8 text-[#D946EF]" />
            {t(locale, "نبض المجتمع", "Community Pulse")}
          </h3>
          <p className="mt-2 font-semibold text-foreground-muted">
            {t(
              locale,
              "تفاعلات حقيقية من أشخاص يثقون في الرحلة.",
              "Real interactions from people who trust the journey.",
            )}
          </p>
        </div>
        <div className="yt-audience-badge flex items-center gap-3 rounded-full p-2 pr-6 backdrop-blur-md">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {["A", "Y", "M"].map((token, i) => (
              <div
                key={token}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface text-[11px] font-black text-white shadow-sm"
                style={{
                  background:
                    i === 1
                      ? "linear-gradient(135deg, #D946EF, #6366f1)"
                      : "linear-gradient(135deg, #0f172a, #334155)",
                }}
              >
                {token}
              </div>
            ))}
          </div>
          <span className="text-sm font-black text-foreground">
            {t(locale, "جمهور نشط عالمياً", "Active Global Audience")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {comments.map((cm) => (
          <motion.a
            key={cm.id}
            href={`https://www.youtube.com/watch?v=${cm.videoId}&lc=${cm.id}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -8, scale: 1.02 }}
            className="yt-comment-card group relative flex flex-col justify-between rounded-[2.2rem] border border-border/40 p-8 shadow-xl backdrop-blur-md transition-all"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
              <MessageSquare className="h-12 w-12" />
            </div>
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-tr from-[#D946EF] to-[#00E5FF] font-black text-black">
                  {cm.author.substring(0, 1) || "U"}
                </div>
                <div>
                  <span className="block text-sm font-black text-foreground">
                    {cm.author.replace("@", "")}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-[#D946EF]">
                    {t(locale, "مشاهد موثوق", "Verified Viewer")}
                  </span>
                </div>
              </div>
              <p className="line-clamp-6 text-sm italic font-medium leading-relaxed text-foreground-muted group-hover:text-foreground transition-colors">
                &ldquo;{cm.text}&rdquo;
              </p>
            </div>
            {cm.likes > 0 && (
              <div className="mt-8 flex items-center gap-2 rounded-full bg-[#ff4d4d15] px-4 py-2 w-fit text-[10px] font-black text-[#ff4d4d] border border-[#ff4d4d22]">
                <Heart className="h-3 w-3" fill="currentColor" />{" "}
                {cm.likes} {t(locale, "إعجاب", "LOVES")}
              </div>
            )}
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}

function CollaborationSection({
  locale,
  cms,
  item,
}: {
  locale: Locale;
  cms: {
    collaborationTitle: string;
    collaborationBody: string;
    values: string[];
  };
  item: Variants;
}) {
  const reasons = [
    {
      icon: Star,
      title: t(locale, "مصداقية حقيقية", "Real Credibility"),
      body: t(
        locale,
        "مراجعات صادقة بنت ثقة أكثر من 1.5 مليون مشاهدة.",
        "Honest reviews that built trust across 1.5M+ views.",
      ),
    },
    {
      icon: Users,
      title: t(locale, "جمهور عربي مهتم", "Engaged Arabic Audience"),
      body: t(
        locale,
        "جمهور تقني عربي من ألمانيا يبحث عن تجارب حقيقية.",
        "Arabic tech audience from Germany seeking real experiences.",
      ),
    },
    {
      icon: TrendingUp,
      title: t(locale, "نمو مستمر", "Consistent Growth"),
      body: t(
        locale,
        "قناة تنمو بشكل عضوي بدون إعلانات مدفوعة.",
        "A channel growing organically without paid promotion.",
      ),
    },
    {
      icon: Video,
      title: t(locale, "جودة إنتاج عالية", "High Production Quality"),
      body: t(
        locale,
        "محتوى مصوّر ومُعدّ بمعايير احترافية واضحة.",
        "Content shot and edited with clear professional standards.",
      ),
    },
  ];

  return (
    <motion.section
      variants={item}
      className="yt-collab-section relative overflow-hidden rounded-[3rem] border border-border/60 p-8 md:col-span-12 md:p-14 shadow-2xl backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[40%] bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.12),transparent_58%)] opacity-70" />

      <div className="relative grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div>
          <span className="eyebrow">
            {t(locale, "لماذا تتعاون معي؟", "Why Work With Me?")}
          </span>
          <h2 className="headline-arabic text-3xl font-black text-foreground md:text-4xl max-w-xl">
            {cms.collaborationTitle}
          </h2>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-9 text-foreground-muted">
            {cms.collaborationBody}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {cms.values.map((val) => (
              <span
                key={val}
                className="yt-value-chip rounded-full px-5 py-2.5 text-xs font-black"
              >
                {val}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {reasons.map((r) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                whileHover={{ y: -6 }}
                className="yt-reason-card group rounded-4xl border border-border/40 p-7 transition-all"
              >
                <div className="yt-reason-icon mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-[#D946EF] transition-transform group-hover:rotate-12">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mb-2 text-base font-black text-foreground">
                  {r.title}
                </h4>
                <p className="text-sm font-medium leading-7 text-foreground-muted">
                  {r.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function ConversionCta({
  locale,
  channelUrl,
  item,
}: {
  locale: Locale;
  channelUrl: string;
  item: Variants;
}) {
  return (
    <motion.section
      variants={item}
      className="yt-cta-section relative overflow-hidden rounded-[3rem] border border-border/60 p-10 md:col-span-12 md:p-16 shadow-2xl backdrop-blur-2xl text-center"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,50,0.1),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl">
        <h2 className="headline-arabic text-4xl font-black text-foreground md:text-5xl lg:text-6xl">
          {t(
            locale,
            "المحتوى لا ينتظر. القناة مفتوحة.",
            "Content doesn't wait. The channel is open.",
          )}
        </h2>
        <p className="mt-6 text-lg font-semibold leading-9 text-foreground-muted">
          {t(
            locale,
            "سواء كنت تبحث عن مراجعة صادقة، أو تعاون تقني، أو محتوى يصنع فرقاً — ابدأ من هنا.",
            "Whether you want an honest review, a tech collaboration, or content that makes a difference — start here.",
          )}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <motion.a
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.98 }}
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="yt-subscribe-btn group flex items-center gap-3 rounded-4xl px-10 py-5 font-black shadow-2xl transition-all"
          >
            <PlayCircle className="h-6 w-6 transition-transform group-hover:rotate-12" />
            {t(locale, "ادخل إلى القناة", "Open the Channel")}
          </motion.a>

          <Link
            href={`/${locale}/contact`}
            className="flex items-center gap-3 rounded-4xl border border-border px-10 py-5 font-black text-foreground transition-all hover:border-[#D946EF]/50 hover:shadow-lg"
          >
            {t(locale, "تواصل للتعاون", "Discuss Collaboration")}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
