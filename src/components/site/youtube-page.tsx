"use client";

import { useEffect } from "react";
import Image from "next/image";

const videos = [
  { id: "QwG-5J9XQCg", ar: "اكتشف أفضل ستاند للسيارة من Volport", en: "Best Car Stand from Volport – Review", views: "283", duration: "3:26", cat: "review" },
  { id: "SmaOMAsn4zY", ar: "Smart DEVIL Fan | مراوح مميزة ومفيدة", en: "Smart DEVIL Fan – Useful & Unique Fans", views: "133", duration: "3:01", cat: "review" },
  { id: "H0nwbSawHF0", ar: "BYINTEK U4 | مراجعة بروجيكتور BYINTEK U4", en: "BYINTEK U4 Projector – Full Review", views: "2,780", duration: "8:39", cat: "review" },
  { id: "CwFUXgMK01s", ar: "Syncwire | ثبّت هاتفك بأمان", en: "Syncwire – Secure Phone Holder", views: "91", duration: "3:29", cat: "unboxing" },
  { id: "dvZviJfHxu8", ar: "Syncwire | أفضل ملحقات للسيارة Bluetooth 5.3", en: "Syncwire – Best Car Accessories Bluetooth 5.3", views: "1,392", duration: "3:56", cat: "unboxing" },
  { id: "NuwnE1-cb6Q", ar: "Oule Smart Doorbell | جرس منزلي مميز", en: "Oule Smart Home Doorbell – Review", views: "182", duration: "3:57", cat: "smarthome" },
  { id: "2jDmck7Sllo", ar: "Nilox J3 | تركيب دراجة كهربائية", en: "Nilox J3 – Electric Bike Assembly", views: "1,854", duration: "6:00", cat: "unboxing" },
  { id: "wXnHC9JlBj8", ar: "Bissell Crosswave HF3 | تنظيف جاف ورطب", en: "Bissell Crosswave HF3 – Wet & Dry Cleaning", views: "20,019", duration: "9:19", cat: "review" },
  { id: "LTI1cnmuom8", ar: "IFA Berlin 2023 | معرض برلين للتكنولوجيا", en: "IFA Berlin 2023 – Tech Exhibition", views: "944", duration: "10:11", cat: "event" },
  { id: "QcF_eKcPQAM", ar: "Tranya Nova | سماعات مريحة مع عزل ضوضاء", en: "Tranya Nova – Comfortable Noise Cancelling Earbuds", views: "644", duration: "13:01", cat: "review" },
  { id: "McHuaqgwdG4", ar: "Amazon Alexa Echo Dot 4th Gen | كل ما تحتاج معرفته", en: "Amazon Alexa Echo Dot 4th Gen – Full Guide", views: "77,904", duration: "12:00", cat: "review" },
  { id: "ZRPDkXiXEpw", ar: "فتح صندوق وتجربة أولية", en: "Unboxing & First Look", views: "18,900", duration: "7:40", cat: "unboxing" },
] as const;

const cats = {
  ar: { all: "الكل", review: "مراجعات", unboxing: "فتح صناديق", smarthome: "منزل ذكي", event: "معارض" },
  en: { all: "All", review: "Reviews", unboxing: "Unboxings", smarthome: "Smart Home", event: "Events" },
};

const t = {
  ar: {
    kicker: "قناة يوتيوب",
    title: "محتوى تقني صادق",
    span: "من الصندوق إلى شاشتك",
    sub: "162 فيديو · 6,060 مشترك · مراجعات بدون فلتر",
    statsVids: "162 فيديو",
    statsSubs: "6,060 مشترك",
    statsViews: "+100 ألف مشاهدة",
    subscribeBtn: "اشترك الآن",
    watchAll: "شاهد كل الفيديوهات",
    featuredTitle: "الفيديو المميز",
    recentTitle: "أحدث الفيديوهات",
    watchVideo: "شاهد",
    channelDesc: "مرحباً، أنا محمد. كل ما تريد معرفته عن المنتجات التقنية بتجربة حقيقية ومراجعة صادقة بدون مبالغة.",
    channelLink: "زيارة القناة",
  },
  en: {
    kicker: "YouTube Channel",
    title: "Honest Tech Content",
    span: "From the box to your screen",
    sub: "162 videos · 6,060 subscribers · No-filter reviews",
    statsVids: "162 Videos",
    statsSubs: "6,060 Subs",
    statsViews: "+100K Views",
    subscribeBtn: "Subscribe",
    watchAll: "Watch all videos",
    featuredTitle: "Featured Video",
    recentTitle: "Latest Videos",
    watchVideo: "Watch",
    channelDesc: "Welcome, I'm Mohammad. Everything you want to know about tech products with real experience and honest reviews.",
    channelLink: "Visit channel",
  },
};

export function YouTubePage({ locale }: { locale: "ar" | "en" }) {
  const tx = t[locale];
  const catLabels = cats[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("revealed")),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal-item").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="yt-page-full" dir={dir}>
      <section className="yt-hero">
        <div className="container">
          <div className="yt-hero-inner glass reveal-item">
            <div className="yt-hero-text">
              <span className="section-kicker">📺 {tx.kicker}</span>
              <h1 className="yt-hero-title">
                {tx.title}
                <br />
                <span className="gradient-text">{tx.span}</span>
              </h1>
              <p className="yt-hero-sub">{tx.sub}</p>
              <div className="yt-stats-row">
                <div className="yt-stat"><span className="yt-stat-num gradient-text">{tx.statsVids}</span></div>
                <div className="yt-stat-divider" />
                <div className="yt-stat"><span className="yt-stat-num gradient-text">{tx.statsSubs}</span></div>
                <div className="yt-stat-divider" />
                <div className="yt-stat"><span className="yt-stat-num gradient-text">{tx.statsViews}</span></div>
              </div>
              <div className="yt-hero-btns">
                <a href="https://www.youtube.com/@Moalfarras?sub_confirmation=1" target="_blank" rel="noreferrer noopener" className="btn primary yt-subscribe-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  {tx.subscribeBtn}
                </a>
                <a href="https://www.youtube.com/@Moalfarras/videos" target="_blank" rel="noreferrer noopener" className="btn secondary">
                  {tx.watchAll}
                </a>
              </div>
            </div>
            <div className="yt-hero-channel-card">
              <Image src="/images/portrait.jpg" alt="Mohammad Alfarras" width={100} height={100} className="yt-avatar" />
              <h3>Mohammad Alfarras</h3>
              <p className="yt-channel-handle">@Moalfarras</p>
              <p className="yt-channel-desc">{tx.channelDesc}</p>
              <a href="https://www.youtube.com/@Moalfarras" target="_blank" rel="noreferrer noopener" className="btn secondary yt-channel-link">
                {tx.channelLink} →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="yt-featured-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">⭐ {tx.featuredTitle}</span>
          </div>
          <div className="yt-featured-card glass reveal-item">
            <div className="yt-featured-embed">
              <iframe
                src="https://www.youtube.com/embed/McHuaqgwdG4"
                title="Amazon Alexa Echo Dot"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="yt-featured-info">
              <h2>{locale === "ar" ? "Amazon Alexa Echo Dot 4th Gen | كل ما تحتاج معرفته" : "Amazon Alexa Echo Dot 4th Gen – Full Guide"}</h2>
              <div className="yt-video-meta">
                <span>👁 77,904</span>
                <span>⏱ 12:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="yt-grid-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kicker">🎬 {tx.recentTitle}</span>
          </div>

          <div className="yt-filter-row">
            {Object.entries(catLabels).map(([key, label]) => (
              <button
                key={key}
                className="yt-filter-btn"
                onClick={(e) => {
                  document.querySelectorAll(".yt-filter-btn").forEach((btn) => btn.classList.remove("active"));
                  (e.target as HTMLElement).classList.add("active");
                  document.querySelectorAll<HTMLElement>(".yt-video-item").forEach((card) => {
                    card.style.display = key === "all" || card.dataset.cat === key ? "" : "none";
                  });
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="yt-videos-grid">
            {videos.map((video, i) => (
              <article key={video.id} className="yt-video-item glass reveal-item" data-cat={video.cat} data-delay={String(Math.min(i % 4, 4))}>
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener" className="yt-thumb-wrap">
                  <Image
                    src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                    alt={locale === "ar" ? video.ar : video.en}
                    width={320}
                    height={180}
                    className="yt-thumb"
                    loading="lazy"
                  />
                  <div className="yt-play-overlay"><div className="yt-play-btn">▶</div></div>
                  <span className="yt-duration">{video.duration}</span>
                </a>
                <div className="yt-video-body">
                  <h3 className="yt-video-title">{locale === "ar" ? video.ar : video.en}</h3>
                  <div className="yt-video-meta">
                    <span>👁 {video.views}</span>
                    <span className={`yt-cat-badge cat-${video.cat}`}>{catLabels[video.cat]}</span>
                  </div>
                  <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener" className="btn secondary yt-watch-btn">
                    {tx.watchVideo} →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
