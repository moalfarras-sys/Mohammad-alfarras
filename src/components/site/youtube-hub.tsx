"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import type { Locale, YoutubeVideo } from "@/types/cms";

type Cat = "all" | "tech" | "logistics" | "smart-home" | "apps";

const PAGE_SIZE = 8;

function normalize(v: string) {
  return v.toLowerCase();
}

function getCategory(video: YoutubeVideo): Exclude<Cat, "all"> {
  const text = normalize(`${video.title_en} ${video.title_ar} ${video.description_en} ${video.description_ar}`);
  if (/(logistics|dispatch|delivery|driver|route|لوجست|توصيل|سائق|رحلات)/.test(text)) return "logistics";
  if (/(smart|home|alexa|echo|iot|منزل ذكي|اليكسا)/.test(text)) return "smart-home";
  if (/(app|software|tool|application|تطبيق|برنامج|أداة)/.test(text)) return "apps";
  return "tech";
}

function fmtViews(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(value);
}

function fmtDate(locale: Locale, iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }).format(d);
}

export function YouTubeHub({ locale, videos }: { locale: Locale; videos: YoutubeVideo[] }) {
  const [activeCat, setActiveCat] = useState<Cat>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const labels = locale === "ar"
    ? {
      title: "قناة يوتيوب",
      sub: "فيديوهات حقيقية من الشغل والحياة: تقنية، لوجستيات، منزل ذكي، وتطبيقات.",
      featured: "فيديو مميز",
      search: "ابحث عن فيديو",
      cat: { all: "الكل", tech: "Tech", logistics: "Logistics", "smart-home": "Smart Home", apps: "Apps" },
      load: "تحميل المزيد",
      watch: "شاهد",
      subscribe: "اشترك بالقناة",
      statsV: "فيديو",
      statsViews: "إجمالي المشاهدات",
      statsYears: "سنوات نشاط",
      empty: "لا توجد نتائج مطابقة",
    }
    : {
      title: "YouTube Channel",
      sub: "Real videos from work and life: tech, logistics, smart home, and apps.",
      featured: "Featured video",
      search: "Search videos",
      cat: { all: "All", tech: "Tech", logistics: "Logistics", "smart-home": "Smart Home", apps: "Apps" },
      load: "Load more",
      watch: "Watch",
      subscribe: "Subscribe",
      statsV: "videos",
      statsViews: "total views",
      statsYears: "years active",
      empty: "No matching videos",
    };

  const mapped = useMemo(() => videos.map((video) => ({ ...video, cat: getCategory(video) })), [videos]);

  const featured = useMemo(() => mapped.find((v) => v.is_featured) ?? mapped[0], [mapped]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return mapped.filter((video) => {
      if (activeCat !== "all" && video.cat !== activeCat) return false;
      if (!q) return true;
      return normalize(`${video.title_ar} ${video.title_en} ${video.description_ar} ${video.description_en}`).includes(q);
    });
  }, [mapped, activeCat, query]);

  const totalViews = useMemo(() => mapped.reduce((sum, v) => sum + Math.max(0, Number(v.views || 0)), 0), [mapped]);
  const oldestDate = useMemo(() => {
    const timestamps = mapped.map((v) => new Date(v.published_at).getTime()).filter((n) => Number.isFinite(n));
    if (!timestamps.length) return 0;
    return Math.min(...timestamps);
  }, [mapped]);
  const yearsActive = oldestDate ? Math.max(1, new Date().getFullYear() - new Date(oldestDate).getFullYear() + 1) : 1;

  const shown = filtered.slice(0, limit);
  const hasMore = shown.length < filtered.length;

  return (
    <div className="yt-page-full" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="yt-hero">
        <div className="container">
          <div className="yt-hero-inner glass reveal-item">
            <div className="yt-hero-text">
              <span className="section-kicker">📺 {labels.title}</span>
              <h1 className="yt-hero-title">{labels.title}</h1>
              <p className="yt-hero-sub">{labels.sub}</p>

              <div className="yt-stats-row">
                <div className="yt-stat"><span className="yt-stat-num gradient-text">{mapped.length} {labels.statsV}</span></div>
                <div className="yt-stat-divider" />
                <div className="yt-stat"><span className="yt-stat-num gradient-text">{fmtViews(locale, totalViews)} {labels.statsViews}</span></div>
                <div className="yt-stat-divider" />
                <div className="yt-stat"><span className="yt-stat-num gradient-text">{yearsActive} {labels.statsYears}</span></div>
              </div>

              <div className="yt-hero-btns">
                <a href="https://www.youtube.com/@Moalfarras?sub_confirmation=1" target="_blank" rel="noreferrer noopener" className="btn primary yt-subscribe-btn">
                  {labels.subscribe}
                </a>
              </div>
            </div>

            <div className="yt-hero-channel-card">
              <Image src="/images/portrait.jpg" alt="Mohammad Alfarras" width={100} height={100} className="yt-avatar" />
              <h3>Mohammad Alfarras</h3>
              <p className="yt-channel-handle">@Moalfarras</p>
            </div>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="yt-featured-section">
          <div className="container">
            <div className="section-header">
              <span className="section-kicker">⭐ {labels.featured}</span>
            </div>
            <article className="yt-featured-card glass reveal-item">
              <a href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noreferrer noopener" className="yt-thumb-wrap">
                <Image src={featured.thumbnail} alt={locale === "ar" ? featured.title_ar : featured.title_en} width={960} height={540} className="yt-thumb" priority={false} />
              </a>
              <div className="yt-featured-info">
                <h2>{locale === "ar" ? featured.title_ar : featured.title_en}</h2>
                <div className="yt-video-meta">
                  <span>👁 {fmtViews(locale, featured.views)}</span>
                  <span>⏱ {featured.duration}</span>
                  <span>{fmtDate(locale, featured.published_at)}</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="yt-grid-section">
        <div className="container">
          <div className="yt-filter-row">
            {(Object.keys(labels.cat) as Cat[]).map((key) => (
              <button key={key} className={`yt-filter-btn ${activeCat === key ? "active" : ""}`} onClick={() => { setActiveCat(key); setLimit(PAGE_SIZE); }}>
                {labels.cat[key]}
              </button>
            ))}
            <input
              className="yt-search-input"
              type="search"
              placeholder={labels.search}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE); }}
            />
          </div>

          {shown.length ? (
            <div className="yt-videos-grid">
              {shown.map((video) => (
                <article key={video.id} className="yt-video-item glass">
                  <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer noopener" className="yt-thumb-wrap">
                    <Image src={video.thumbnail} alt={locale === "ar" ? video.title_ar : video.title_en} width={480} height={270} className="yt-thumb" loading="lazy" />
                    <span className="yt-duration">{video.duration}</span>
                  </a>
                  <div className="yt-video-body">
                    <h3 className="yt-video-title">{locale === "ar" ? video.title_ar : video.title_en}</h3>
                    <div className="yt-video-meta">
                      <span>👁 {fmtViews(locale, video.views)}</span>
                      <span>{fmtDate(locale, video.published_at)}</span>
                    </div>
                    <a className="btn secondary yt-watch-btn" href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer noopener">
                      {labels.watch}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card"><p>{labels.empty}</p></div>
          )}

          {hasMore ? (
            <div className="actions-row" style={{ marginTop: "1rem" }}>
              <button className="btn primary" onClick={() => setLimit((v) => v + PAGE_SIZE)}>{labels.load}</button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
