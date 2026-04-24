"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import type { SiteViewModel } from "@/components/site/site-view-model";

type StatsPayload = {
  subscribers?: string | null;
  totalViews?: string | null;
  videoCount?: string | null;
  latestVideoId?: string | null;
  error?: boolean;
};

function formatNum(raw: string | null | undefined): string | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (Number.isNaN(n) || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}K+`;
  return String(n);
}

function StatCard({
  icon,
  value,
  label,
  loading,
}: {
  icon: string;
  value: string | null;
  label: string;
  loading: boolean;
}) {
  const showSkeleton = loading;
  const showValue = !loading && value !== null;
  return (
    <div className="glass rounded-[var(--radius-lg)] p-5">
      <div className="text-xl" aria-hidden>
        {icon}
      </div>
      {showSkeleton ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-white/10" aria-hidden />
      ) : showValue ? (
        <div className="mt-3 text-2xl font-bold tabular-nums text-[var(--accent-glow)]">{value}</div>
      ) : (
        <div className="mt-3 text-2xl font-semibold text-[var(--text-3)]">—</div>
      )}
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--text-3)]">{label}</div>
    </div>
  );
}

export function YoutubeStatsSection({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const reduced = useReducedMotion();
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const featuredVideo = model.featuredVideo ?? model.latestVideos[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/youtube-stats");
        const json = (await res.json()) as StatsPayload;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData({ error: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vids = formatNum(data?.videoCount ?? undefined);
  const views = formatNum(data?.totalViews ?? undefined);
  const subs = formatNum(data?.subscribers ?? undefined);

  const channelUrl = `https://www.youtube.com/${model.youtube.handle ?? "@Moalfarras"}`;

  return (
    <section className="py-[var(--section-py)]" id="youtube">
      <div className="section-frame">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
          {isAr ? "يوتيوب" : "YouTube"}
        </p>
        <h2 className="font-display mt-3 max-w-[24ch] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-[var(--text-1)]">
          {isAr ? "أرقام القناة" : "Channel snapshot"}
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="🎬" value={vids} label={isAr ? "فيديوهات" : "Videos"} loading={loading} />
          <StatCard icon="👁" value={views} label={isAr ? "مشاهدات" : "Views"} loading={loading} />
          <StatCard icon="👥" value={subs} label={isAr ? "مشتركون" : "Subscribers"} loading={loading} />
          <div className="glass rounded-[var(--radius-lg)] p-5">
            <div className="text-xl" aria-hidden>
              ⭐
            </div>
            {featuredVideo ? (
              <>
                <p className="mt-3 text-sm font-semibold leading-snug text-[var(--text-1)] line-clamp-2">
                  {isAr ? featuredVideo.title_ar || featuredVideo.title_en : featuredVideo.title_en || featuredVideo.title_ar}
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${featuredVideo.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-liquid-secondary mt-4 w-full justify-center text-sm"
                >
                  {isAr ? "أحدث فيديو" : "Latest upload"}
                </a>
              </>
            ) : loading ? (
              <div className="mt-3 h-16 w-full animate-pulse rounded-md bg-white/10" aria-hidden />
            ) : (
              <p className="mt-3 text-sm text-[var(--text-2)]">{isAr ? "تعذر تحميل أحدث فيديو" : "Latest video unavailable"}</p>
            )}
          </div>
        </div>

        {featuredVideo ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0.15 : 0.5 }}
            className="mt-10"
          >
            <a
              href={`https://www.youtube.com/watch?v=${featuredVideo.youtube_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group glass relative block overflow-hidden rounded-[var(--radius-xl)]"
            >
              <div className="relative aspect-video w-full">
                <Image
                  src={featuredVideo.thumbnail}
                  alt={featuredVideo.title_en || featuredVideo.title_ar || "YouTube video"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, min(1280px, 100vw)"
                  loading="lazy"
                />
              </div>
            </a>
          </motion.div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="button-liquid-primary">
            {isAr ? "القناة على يوتيوب" : "YouTube channel"}
          </a>
        </div>
      </div>
    </section>
  );
}
