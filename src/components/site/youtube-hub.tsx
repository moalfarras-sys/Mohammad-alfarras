"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import type { Locale, YoutubeVideo } from "@/types/cms";

type Cat = "all" | "tech" | "logistics" | "smart-home" | "apps";

const PAGE_SIZE = 12;

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

  const labels =
    locale === "ar"
      ? {
          title: "قناة يوتيوب",
          sub: "هنا تجد أرشيف القناة الحقيقي: منتجات، تطبيقات، منزل ذكي، ومشاهد من الحياة والعمل في ألمانيا. الصفحة لم تعد عينة من 10 فيديوهات فقط، بل تعرض أكبر قدر ممكن من الكتالوج العام للقناة.",
          featured: "الفيديو المميز",
          search: "ابحث عن فيديو أو منتج",
          cat: { all: "الكل", tech: "تقنية", logistics: "لوجستيات", "smart-home": "منزل ذكي", apps: "تطبيقات" },
          load: "تحميل المزيد",
          watch: "شاهد الفيديو",
          subscribe: "اشترك بالقناة",
          statsV: "فيديو",
          statsViews: "إجمالي المشاهدات",
          statsYears: "سنوات نشاط",
          empty: "لا توجد نتائج مطابقة",
          cards: [
            {
              title: "تجربة صريحة",
              body: "الهدف أن ترى المنتج أو الأداة كما هي فعلاً، لا كما تحاول الإعلانات أن تبيعها لك.",
            },
            {
              title: "تنوع حقيقي",
              body: "من التطبيقات والملحقات الصغيرة إلى الأجهزة وتجارب المنزل الذكي وأدوات الحياة اليومية.",
            },
            {
              title: "قناة تبني ثقة",
              body: "كل فيديو مفترض أن يساعدك على الاختيار بثقة أو على الأقل يوفر عليك وقت البحث والتجربة.",
            },
          ],
        }
      : {
          title: "YouTube Channel",
          sub: "This page surfaces the real public channel catalog: products, apps, smart-home videos, and snapshots from life and work in Germany. It is no longer limited to a short 10-video sample.",
          featured: "Featured video",
          search: "Search for a video or product",
          cat: { all: "All", tech: "Tech", logistics: "Logistics", "smart-home": "Smart Home", apps: "Apps" },
          load: "Load more",
          watch: "Watch video",
          subscribe: "Subscribe",
          statsV: "videos",
          statsViews: "total views",
          statsYears: "years active",
          empty: "No matching videos",
          cards: [
            {
              title: "Honest testing",
              body: "The point is to show the product or tool as it actually behaves, not how advertising wants it to look.",
            },
            {
              title: "A real mix",
              body: "From apps and small accessories to smart-home gear and useful everyday products.",
            },
            {
              title: "Built for trust",
              body: "Every upload should help you choose faster, more clearly, and with fewer bad surprises.",
            },
          ],
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
                <div className="yt-stat">
                  <span className="yt-stat-num gradient-text">
                    {mapped.length} {labels.statsV}
                  </span>
                </div>
                <div className="yt-stat-divider" />
                <div className="yt-stat">
                  <span className="yt-stat-num gradient-text">
                    {fmtViews(locale, totalViews)} {labels.statsViews}
                  </span>
                </div>
                <div className="yt-stat-divider" />
                <div className="yt-stat">
                  <span className="yt-stat-num gradient-text">
                    {yearsActive} {labels.statsYears}
                  </span>
                </div>
              </div>

              <div className="yt-hero-btns">
                <a
                  href="https://www.youtube.com/@Moalfarras?sub_confirmation=1"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn primary yt-subscribe-btn"
                >
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

      <section className="page-section">
        <div className="container section-stack">
          <div className="feature-card-grid">
            {labels.cards.map((card) => (
              <article key={card.title} className="glass-card service-rich-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
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
                <Image
                  src={featured.thumbnail}
                  alt={locale === "ar" ? featured.title_ar : featured.title_en}
                  width={960}
                  height={540}
                  className="yt-thumb"
                  priority={false}
                />
              </a>
              <div className="yt-featured-info">
                <h2>{locale === "ar" ? featured.title_ar : featured.title_en}</h2>
                <p>{locale === "ar" ? featured.description_ar : featured.description_en}</p>
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
              <button
                key={key}
                className={`yt-filter-btn ${activeCat === key ? "active" : ""}`}
                onClick={() => {
                  setActiveCat(key);
                  setLimit(PAGE_SIZE);
                }}
              >
                {labels.cat[key]}
              </button>
            ))}
            <input
              className="yt-search-input"
              type="search"
              placeholder={labels.search}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
            />
          </div>

          {shown.length ? (
            <div className="yt-videos-grid">
              {shown.map((video) => (
                <article key={video.id} className="yt-video-item glass">
                  <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer noopener" className="yt-thumb-wrap">
                    <Image
                      src={video.thumbnail}
                      alt={locale === "ar" ? video.title_ar : video.title_en}
                      width={480}
                      height={270}
                      className="yt-thumb"
                      loading="lazy"
                    />
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
            <div className="card">
              <p>{labels.empty}</p>
            </div>
          )}

          {hasMore ? (
            <div className="actions-row" style={{ marginTop: "1rem" }}>
              <button className="btn primary" onClick={() => setLimit((v) => v + PAGE_SIZE)}>
                {labels.load}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
