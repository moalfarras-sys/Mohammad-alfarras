import Image from "next/image";

import type { Locale, YoutubeVideo } from "@/types/cms";

function fmtViews(locale: Locale, value: number) {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function fmtDate(locale: Locale, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }).format(date);
}

export function YoutubeGrid({ locale, videos }: { locale: Locale; videos: YoutubeVideo[] }) {
  const sorted = videos.slice().sort((a, b) => a.sort_order - b.sort_order);
  const featured = sorted.find((item) => item.is_featured) ?? sorted[0];
  const rest = featured ? sorted.filter((item) => item.id !== featured.id) : sorted;

  return (
    <section className="page-section">
      <div className="container section-stack">
        <div className="section-heading">
          <h2>{locale === "ar" ? "أحدث فيديوهات يوتيوب" : "Latest YouTube videos"}</h2>
          <p>
            {locale === "ar"
              ? "آخر الفيديوهات من القناة مع تحديث مستمر من الأدمن أو المزامنة التلقائية."
              : "Latest channel uploads with continuous updates from admin or automatic sync."}
          </p>
        </div>

        {featured ? (
          <article className="video-featured glass-card">
            <div className="video-thumb-wrap">
              <Image
                src={featured.thumbnail}
                alt={locale === "ar" ? featured.title_ar : featured.title_en}
                width={800}
                height={450}
                priority={false}
              />
            </div>
            <div className="video-body">
              <span className="video-badge">{locale === "ar" ? "فيديو مميز" : "Featured"}</span>
              <h3>{locale === "ar" ? featured.title_ar : featured.title_en}</h3>
              <p>{locale === "ar" ? featured.description_ar : featured.description_en}</p>
              <div className="video-meta">
                <span>{featured.duration}</span>
                <span>{fmtViews(locale, featured.views)} {locale === "ar" ? "مشاهدة" : "views"}</span>
                <span>{fmtDate(locale, featured.published_at)}</span>
              </div>
              <a className="btn primary" href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noreferrer">
                {locale === "ar" ? "شاهد على يوتيوب" : "Watch on YouTube"}
              </a>
            </div>
          </article>
        ) : null}

        <div className="video-grid">
          {rest.map((video, index) => (
            <article key={video.id} className="card video-card glass-card" style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}>
              <div className="video-thumb-wrap">
                <Image src={video.thumbnail} alt={locale === "ar" ? video.title_ar : video.title_en} width={480} height={270} loading="lazy" />
              </div>
              <h3>{locale === "ar" ? video.title_ar : video.title_en}</h3>
              <p>{locale === "ar" ? video.description_ar : video.description_en}</p>
              <div className="video-meta">
                <span>{video.duration}</span>
                <span>{fmtViews(locale, video.views)}</span>
              </div>
              <a className="btn secondary" href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer">
                {locale === "ar" ? "شاهد" : "Watch"}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
