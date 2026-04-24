"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { PlayCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { PageHero } from "@/components/sections/page-hero";
import { ContactCtaSection } from "@/components/sections/contact-cta-section";
import { YoutubeStatsSection } from "@/components/sections/youtube-stats-section";
import type { SiteViewModel } from "@/components/site/site-view-model";

const PINNED: ReadonlyArray<string> = [
  "u5h4lBzIwUw",
  "ZRPDkXiXEpw",
  "kNf8kd62OT4",
  "LTI1cnmuom8",
  "N6ZhjrmUNLU",
  "kLOeaQJPvcM",
  "WpA8SwfA8h8",
];

const copy = {
  en: {
    eyebrow: "YouTube Channel",
    title: "Arabic tech content that earns trust, not just attention.",
    body:
      "The channel is part of the professional identity. It proves that product explanation, consistency, and presentation quality can grow a real audience over time.",
    openChannel: "Open channel",
    subscribe: "Subscribe",
    playerTitle: "Channel player",
    pinned: "Pinned videos",
    latest: "Latest videos",
  },
  ar: {
    eyebrow: "قناة يوتيوب",
    title: "محتوى تقني عربي يصنع الثقة لا مجرد استهلاك الانتباه.",
    body:
      "القناة جزء من الهوية المهنية. تُثبت أن جودة الشرح والتقديم والثبات يمكن أن تبني جمهورًا حقيقيًا يتراكم مع الوقت.",
    openChannel: "افتح القناة",
    subscribe: "اشترك",
    playerTitle: "مشغل القناة",
    pinned: "فيديوهات مثبّتة",
    latest: "أحدث الفيديوهات",
  },
} as const;

type VideoLike = SiteViewModel["latestVideos"][number];

export function YoutubePageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const isAr = model.locale === "ar";
  const reduced = useReducedMotion();

  const videosById = new Map<string, VideoLike>(model.latestVideos.map((v) => [v.youtube_id, v]));
  const pinnedVideos: VideoLike[] = PINNED.map((youtubeId, index) => {
    const existing = videosById.get(youtubeId);
    if (existing) return existing;
    return {
      id: `pinned-${youtubeId}`,
      youtube_id: youtubeId,
      title_ar: isAr ? `فيديو مميز ${index + 1}` : `Featured video ${index + 1}`,
      title_en: `Featured video ${index + 1}`,
      description_ar: "",
      description_en: "",
      thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      duration: "",
      views: 0,
      published_at: "",
      is_active: true,
      is_featured: index === 0,
      sort_order: index + 1,
    } as VideoLike;
  });

  const automaticLatest = model.latestVideos.filter((video) => !PINNED.includes(video.youtube_id));
  const initial = pinnedVideos[0] ?? automaticLatest[0] ?? model.featuredVideo ?? model.latestVideos[0] ?? null;
  const [activeId, setActiveId] = useState<string | null>(initial?.youtube_id ?? null);
  const allVideos = [...pinnedVideos, ...automaticLatest, ...(model.featuredVideo ? [model.featuredVideo] : [])];
  const activeVideo = allVideos.find((v) => v.youtube_id === activeId) ?? initial;

  const channelUrl = `https://www.youtube.com/${model.youtube.handle ?? "@Moalfarras"}`;
  const subscribeUrl = `${channelUrl}?sub_confirmation=1`;

  return (
    <div data-testid="youtube-page">
      <PageHero
        locale={model.locale}
        eyebrow={t.eyebrow}
        title={t.title}
        body={t.body}
        actions={
          <>
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-primary">
              <PlayCircle className="h-4 w-4" />
              {t.openChannel}
            </a>
            <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary">
              {t.subscribe}
            </a>
          </>
        }
        side={
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[28px]"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-br from-[#ff4757]/25 via-[#8b5cf6]/20 to-[#6366f1]/25 blur-3xl" aria-hidden />
            <div className="glass relative h-full w-full overflow-hidden rounded-[28px]">
              <Image
                src={model.brandMedia.youtubeHero || "/images/yt-channel-hero.png"}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-transparent to-transparent" aria-hidden />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  {isAr ? "المحتوى العربي المتخصّص" : "Arabic tech content"}
                </div>
              </div>
            </div>
          </motion.div>
        }
      />

      {activeVideo ? (
        <section className="py-10 md:py-14">
          <div className="section-frame">
            <div className="glass overflow-hidden rounded-[var(--radius-xl)]">
              <div className="aspect-video w-full">
                <iframe
                  key={activeVideo.youtube_id}
                  src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?rel=0&modestbranding=1`}
                  title={isAr ? activeVideo.title_ar || activeVideo.title_en || activeVideo.youtube_id : activeVideo.title_en || activeVideo.title_ar || activeVideo.youtube_id}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="border-t border-white/10 p-6 md:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
                  {t.playerTitle}
                </p>
                <h2 className="font-display mt-3 text-xl font-bold text-[var(--text-1)] md:text-2xl">
                  {isAr ? activeVideo.title_ar || activeVideo.title_en : activeVideo.title_en || activeVideo.title_ar}
                </h2>
                {(activeVideo.description_ar || activeVideo.description_en) ? (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-2)]">
                    {isAr
                      ? activeVideo.description_ar || activeVideo.description_en
                      : activeVideo.description_en || activeVideo.description_ar}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <YoutubeStatsSection model={model} />

      <section className="py-10 md:py-14">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.pinned}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pinnedVideos.map((video, idx) => {
              const active = video.youtube_id === activeId;
              const title = isAr ? video.title_ar || video.title_en : video.title_en || video.title_ar;
              return (
                <motion.button
                  key={video.youtube_id}
                  type="button"
                  onClick={() => setActiveId(video.youtube_id)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduced ? 0.15 : 0.35, delay: reduced ? 0 : idx * 0.03 }}
                  className={`group glass block overflow-hidden rounded-[var(--radius-xl)] text-start transition ${active ? "ring-2 ring-[var(--accent-glow)]" : ""}`}
                >
                  <div className="relative aspect-video w-full bg-black">
                    <Image
                      src={video.thumbnail}
                      alt={title || video.youtube_id}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      <PlayCircle className="h-3.5 w-3.5" />
                      {isAr ? "تشغيل" : "Play"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-1)]">{title || video.youtube_id}</h3>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {automaticLatest.length ? (
        <section className="py-10 md:py-14">
          <div className="section-frame">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.latest}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {automaticLatest.slice(0, 6).map((video, idx) => (
                <motion.button
                  key={video.id}
                  type="button"
                  onClick={() => setActiveId(video.youtube_id)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduced ? 0.15 : 0.35, delay: reduced ? 0 : idx * 0.03 }}
                  className="group glass block overflow-hidden rounded-[var(--radius-xl)] text-start"
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={video.thumbnail}
                      alt={video.title_en || video.youtube_id}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                    />
                    {video.duration ? (
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
                        {video.duration}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-1)]">
                      {isAr ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                    </h3>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactCtaSection locale={model.locale} />
    </div>
  );
}
