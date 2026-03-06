"use client";

import { useEffect } from "react";
import Image from "next/image";

const videos = [
    { id: "QwG-5J9XQCg", ar: "Ø§ÙƒØªØ´Ù Ø§ÙØ¶Ù„ Ø³ØªØ§Ù†Ø¯ Ù„Ù„Ø³ÙŠØ§Ø±Ø© Ù…Ù† volport", en: "Best Car Stand from Volport â€“ Review", views: "283", duration: "3:26", cat: "review" },
    { id: "SmaOMAsn4zY", ar: "Smart DEVIL Fan | Ù…Ø±Ø§ÙˆØ­ Ù…Ù…ÙŠØ²Ø© ÙˆÙ…ÙÙŠØ¯Ø©", en: "Smart DEVIL Fan â€“ Useful & Unique Fans", views: "133", duration: "3:01", cat: "review" },
    { id: "H0nwbSawHF0", ar: "BYINTEK U4 | Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ø±ÙˆØ¬ÙƒØªØ± Ø¨ÙŠÙˆÙ†ØªÙŠÙƒ ÙŠÙˆ 4", en: "BYINTEK U4 Projector â€“ Full Review", views: "2,780", duration: "8:39", cat: "review" },
    { id: "CwFUXgMK01s", ar: "syncwire | Ø«Ø¨Ù‘Øª Ù‡Ø§ØªÙÙƒ Ø¨Ø£Ù…Ø§Ù† Ù…Ø¹ Ø³Ù†ÙƒÙˆÙŠØ±", en: "Syncwire â€“ Secure Phone Holder", views: "91", duration: "3:29", cat: "unboxing" },
    { id: "dvZviJfHxu8", ar: "syncwire | Ø£ÙØ¶Ù„ Ù…Ù„Ø­Ù‚Ø§Øª Ù„Ù„Ø³ÙŠØ§Ø±Ø© Ø¨Ù„ÙˆØªÙˆØ« 5.3", en: "Syncwire â€“ Best Car Accessories Bluetooth 5.3", views: "1,392", duration: "3:56", cat: "unboxing" },
    { id: "NuwnE1-cb6Q", ar: "Oule GmbH TÃ¼rklingel | Ø¬Ø±Ø³ Ù…Ù†Ø²Ù„ÙŠ Ù…Ù…ÙŠØ²", en: "Oule Smart Home Doorbell â€“ Review", views: "182", duration: "3:57", cat: "smarthome" },
    { id: "2jDmck7Sllo", ar: "Nilox J3 | ØªØ±ÙƒÙŠØ¨ Ø¯Ø±Ø§Ø¬Ø© ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ©", en: "Nilox J3 â€“ Electric Bike Assembly", views: "1,854", duration: "6:00", cat: "unboxing" },
    { id: "wXnHC9JlBj8", ar: "Bissell crosswaveÂ® hf3 | ØªÙ†Ø¸ÙŠÙ Ø¬Ø§Ù ÙˆØ±Ø·Ø¨", en: "Bissell Crosswave HF3 â€“ Wet & Dry Cleaning", views: "20,019", duration: "9:19", cat: "review" },
    { id: "LTI1cnmuom8", ar: "IFA Berlin 2023 | Ù…Ø¹Ø±Ø¶ Ø¨Ø±Ù„ÙŠÙ† Ù„Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§", en: "IFA Berlin 2023 â€“ Tech Exhibition", views: "944", duration: "10:11", cat: "event" },
    { id: "QcF_eKcPQAM", ar: "Tranya Nova | Ø³Ù…Ø§Ø¹Ø§Øª Ù…Ø±ÙŠØ­Ø© Ù…Ø¹ Ø¹Ø²Ù„ Ø¶ÙˆØ¶Ø§Ø¡", en: "Tranya Nova â€“ Comfortable Noise Cancelling Earbuds", views: "644", duration: "13:01", cat: "review" },
    { id: "McHuaqgwdG4", ar: "Amazon Alexa Echo Dot 4th Generation | ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬ Ù…Ø¹Ø±ÙØªØ©", en: "Amazon Alexa Echo Dot 4th Gen â€“ Full Guide", views: "77,904", duration: "12:00", cat: "review" },
    { id: "ZRPDkXiXEpw", ar: "ÙØªØ­ ØµÙ†Ø¯ÙˆÙ‚ ÙˆØªØ¬Ø±Ø¨Ø© Ø£ÙˆÙ„ÙŠØ©", en: "Unboxing & First Look", views: "18,900", duration: "7:40", cat: "unboxing" },
];

const cats = {
    ar: { all: "Ø§Ù„ÙƒÙ„", review: "Ù…Ø±Ø§Ø¬Ø¹Ø§Øª", unboxing: "ÙØªØ­ ØµÙ†Ø§Ø¯ÙŠÙ‚", smarthome: "Ù…Ù†Ø²Ù„ Ø°ÙƒÙŠ", event: "Ù…Ø¹Ø§Ø±Ø¶" },
    en: { all: "All", review: "Reviews", unboxing: "Unboxings", smarthome: "Smart Home", event: "Events" },
};

const t = {
    ar: {
        kicker: "Ù‚Ù†Ø§Ø© ÙŠÙˆØªÙŠÙˆØ¨",
        title: "Ù…Ø­ØªÙˆÙ‰ ØªÙ‚Ù†ÙŠ ØµØ§Ø¯Ù‚",
        span: "Ù…Ù† Ø§Ù„ØµÙ†Ø¯ÙˆÙ‚ Ø¥Ù„Ù‰ Ø´Ø§Ø´ØªÙƒ",
        sub: "162 ÙÙŠØ¯ÙŠÙˆ Â· 6,060 Ù…Ø´ØªØ±Ùƒ Â· Ù…Ø±Ø§Ø¬Ø¹Ø§Øª Ø¨Ø¯ÙˆÙ† ÙÙ„ØªØ±",
        statsVids: "162 ÙÙŠØ¯ÙŠÙˆ",
        statsSubs: "6,060 Ù…Ø´ØªØ±Ùƒ",
        statsViews: "+100 Ø£Ù„Ù Ù…Ø´Ø§Ù‡Ø¯Ø©",
        subscribeBtn: "Ø§Ø´ØªØ±Ùƒ Ø§Ù„Ø¢Ù†",
        watchAll: "Ø´Ø§Ù‡Ø¯ ÙƒÙ„ Ø§Ù„ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª",
        featuredTitle: "Ø§Ù„ÙÙŠØ¯ÙŠÙˆ Ø§Ù„Ù…Ù…ÙŠØ²",
        recentTitle: "Ø£Ø­Ø¯Ø« Ø§Ù„ÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª",
        filterLabel: "Ø§Ù„ØªØµÙ†ÙŠÙ",
        watchVideo: "Ø´Ø§Ù‡Ø¯",
        channelDesc: '"Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ Ø£Ù†Ø§ Ù…Ø­Ù…Ø¯. ÙƒÙ„ Ù…Ø§ ØªØ±ÙŠØ¯ Ù…Ø¹Ø±ÙØªÙ‡ Ø¹Ù† Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ© â€” ØªØ¬Ø±Ø¨Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ©ØŒ Ù…Ø±Ø§Ø¬Ø¹Ø© ØµØ§Ø¯Ù‚Ø©ØŒ Ø¨Ø¯ÙˆÙ† Ù…Ø¨Ø§Ù„ØºØ©."',
        channelLink: "Ø²ÙŠØ§Ø±Ø© Ø§Ù„Ù‚Ù†Ø§Ø©",
    },
    en: {
        kicker: "YouTube Channel",
        title: "Honest Tech Content",
        span: "From the box to your screen",
        sub: "162 videos Â· 6,060 subscribers Â· No-filter reviews",
        statsVids: "162 Videos",
        statsSubs: "6,060 Subs",
        statsViews: "+100K Views",
        subscribeBtn: "Subscribe",
        watchAll: "Watch all videos",
        featuredTitle: "Featured Video",
        recentTitle: "Latest Videos",
        filterLabel: "Filter",
        watchVideo: "Watch",
        channelDesc: '"Welcome, I\'m Mohammad. Everything you want to know about tech products â€” real experience, honest review, zero exaggeration."',
        channelLink: "Visit channel",
    },
};

export function YouTubePage({ locale }: { locale: "ar" | "en" }) {
    const tx = t[locale];
    const catLabels = cats[locale];
    const dir = locale === "ar" ? "rtl" : "ltr";

    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("revealed")),
            { threshold: 0.1 }
        );
        document.querySelectorAll(".reveal-item").forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    return (
        <div className="yt-page-full" dir={dir}>

            {/* â”€â”€â”€ HERO â”€â”€â”€ */}
            <section className="yt-hero">
                <div className="container">
                    <div className="yt-hero-inner glass reveal-item">
                        <div className="yt-hero-text">
                            <span className="section-kicker">ðŸ“º {tx.kicker}</span>
                            <h1 className="yt-hero-title">
                                {tx.title}<br />
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
                                <a
                                    href="https://www.youtube.com/@Moalfarras?sub_confirmation=1"
                                    target="_blank" rel="noreferrer noopener"
                                    className="btn primary yt-subscribe-btn"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
                            <a href="https://www.youtube.com/@Moalfarras" target="_blank" rel="noreferrer noopener" className="btn secondary yt-channel-link">{tx.channelLink} â†’</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ FEATURED VIDEO â”€â”€â”€ */}
            <section className="yt-featured-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-kicker">â­ {tx.featuredTitle}</span>
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
                            <h2>{locale === "ar" ? "Amazon Alexa Echo Dot 4th Generation | ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬ Ù…Ø¹Ø±ÙØªØ©" : "Amazon Alexa Echo Dot 4th Gen â€“ Full Guide"}</h2>
                            <div className="yt-video-meta">
                                <span>ðŸ‘ 77,904</span>
                                <span>â± 12:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ VIDEO GRID â”€â”€â”€ */}
            <section className="yt-grid-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-kicker">ðŸŽ¬ {tx.recentTitle}</span>
                    </div>

                    {/* Category Filter */}
                    <div className="yt-filter-row">
                        {Object.entries(catLabels).map(([key, label]) => (
                            <button
                                key={key}
                                className="yt-filter-btn"
                                onClick={(e) => {
                                    document.querySelectorAll(".yt-filter-btn").forEach((b) => b.classList.remove("active"));
                                    (e.target as HTMLElement).classList.add("active");
                                    document.querySelectorAll<HTMLElement>(".yt-video-item").forEach((v) => {
                                        if (key === "all" || v.dataset.cat === key) {
                                            v.style.display = "";
                                        } else {
                                            v.style.display = "none";
                                        }
                                    });
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="yt-videos-grid">
                        {videos.map((video, i) => (
                            <article
                                key={video.id}
                                className="yt-video-item glass reveal-item"
                                data-cat={video.cat}
                                data-delay={String(Math.min(i % 4, 4))}
                            >
                                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener" className="yt-thumb-wrap">
                                    <Image
                                        src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                                        alt={locale === "ar" ? video.ar : video.en}
                                        width={320}
                                        height={180}
                                        className="yt-thumb"
                                        loading="lazy"
                                    />
                                    <div className="yt-play-overlay">
                                        <div className="yt-play-btn">â–¶</div>
                                    </div>
                                    <span className="yt-duration">{video.duration}</span>
                                </a>
                                <div className="yt-video-body">
                                    <h3 className="yt-video-title">{locale === "ar" ? video.ar : video.en}</h3>
                                    <div className="yt-video-meta">
                                        <span>ðŸ‘ {video.views}</span>
                                        <span className={`yt-cat-badge cat-${video.cat}`}>
                                            {catLabels[video.cat as keyof typeof catLabels]}
                                        </span>
                                    </div>
                                    <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer noopener" className="btn secondary yt-watch-btn">
                                        {tx.watchVideo} â†’
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

