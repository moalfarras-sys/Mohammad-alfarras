import Image from "next/image";

import type { Locale, YoutubeVideo } from "@/types/cms";

export function YoutubeGrid({ locale, videos }: { locale: Locale; videos: YoutubeVideo[] }) {
  return (
    <section className="page-section">
      <div className="container section-stack">
        <h2>{locale === "ar" ? "أحدث الفيديوهات" : "Latest videos"}</h2>
        <div className="video-grid">
          {videos.map((video) => (
            <article key={video.id} className="card video-card">
              <Image
                src={video.thumbnail}
                alt={locale === "ar" ? video.title_ar : video.title_en}
                width={480}
                height={270}
                loading="lazy"
              />
              <h3>{locale === "ar" ? video.title_ar : video.title_en}</h3>
              <p>{locale === "ar" ? video.description_ar : video.description_en}</p>
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
