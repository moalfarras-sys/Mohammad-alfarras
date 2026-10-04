import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Eye, PlayCircle } from "lucide-react";

import type { SiteViewModel } from "@/components/site/site-view-model";
import { ParallaxImage, Reveal, SplitHeadline, Stagger, TiltCard } from "@/components/v3/motion-kit";
import { socialLinks } from "@/content/site";
import { youtubeChannel } from "@/content/site-data";
import { withLocale } from "@/lib/i18n";

import { CtaBand, Eyebrow, SectionHead } from "./v3-page-parts";
import { StatCount } from "./v3-page-motion";

const copy = {
  en: {
    pill: "Arabic tech channel",
    title: "Arabic tech, explained *without* the noise.",
    lead: "Product reviews, tutorials, Android TV experiments and practical technology stories — in Arabic, from Germany, with a clear and honest voice.",
    subscribe: "Subscribe on YouTube",
    stats: ["Subscribers", "Total views", "Videos"],
    bannerAlt: "Mohammad Alfarras — Unboxing Review channel banner",
    featuredLabel: "Latest upload",
    watch: "Watch on YouTube",
    views: "views",
    latestLabel: "Latest uploads",
    latestTitle: "Recent reviews and *practical* videos.",
    latestBody: "The newest uploads with their real publication dates.",
    allVideos: "All videos on YouTube",
    topicsLabel: "What the channel covers",
    topicsTitle: "Four *topics*, one standard.",
    topicTag: "Topic",
    topics: [
      ["Product reviews", "Honest Arabic reviews of useful tech, apps and devices — no disguised advertising.", "/images/hero_tech.png"],
      ["Android TV", "MoPlayer, media setups, activation flows and TV-first experiences.", "/images/moplayer-tv-hero.png"],
      ["Creator tools", "Software, workflows and production tools that make digital work sharper.", "/images/service_tech.png"],
      ["Practical tutorials", "Clear explanations for people who want to learn and apply quickly.", "/images/service_web.png"],
    ],
    ctaLabel: "@Moalfarras",
    ctaTitle: "Technology that *respects* your time.",
    ctaBody: "Subscribe for Arabic tech content that helps you understand what is actually useful — or get in touch about a collaboration.",
    ctaSecondary: "Start a collaboration",
  },
  ar: {
    pill: "قناة تقنية عربية",
    title: "تقنية بالعربي، *بدون* ضجيج.",
    lead: "مراجعات منتجات، شروحات، تجارب Android TV وقصص تقنية عملية — بالعربية، من ألمانيا، بصوت واضح وصادق.",
    subscribe: "اشترك على يوتيوب",
    stats: ["المشتركون", "إجمالي المشاهدات", "الفيديوهات"],
    bannerAlt: "غلاف قناة محمد الفراس — Unboxing Review",
    featuredLabel: "أحدث فيديو",
    watch: "شاهد على يوتيوب",
    views: "مشاهدة",
    latestLabel: "أحدث الفيديوهات",
    latestTitle: "آخر المراجعات والفيديوهات *العملية*.",
    latestBody: "أحدث الفيديوهات مع تواريخ نشرها الحقيقية.",
    allVideos: "كل الفيديوهات على يوتيوب",
    topicsLabel: "ماذا تقدّم القناة",
    topicsTitle: "أربعة *مواضيع*، ومعيار واحد.",
    topicTag: "موضوع",
    topics: [
      ["مراجعات المنتجات", "مراجعات عربية صادقة للتقنية والتطبيقات والأجهزة المفيدة — بدون إعلانات مقنّعة.", "/images/hero_tech.png"],
      ["Android TV", "MoPlayer، أنظمة الميديا، التفعيل، وتجارب التلفاز.", "/images/moplayer-tv-hero.png"],
      ["أدوات صنّاع المحتوى", "برامج وسير عمل وأدوات تجعل العمل الرقمي أكثر احترافاً.", "/images/service_tech.png"],
      ["شروحات عملية", "شرح واضح لمن يريد أن يتعلّم ويطبّق بسرعة.", "/images/service_web.png"],
    ],
    ctaLabel: "@Moalfarras",
    ctaTitle: "تقنية *تحترم* وقتك.",
    ctaBody: "اشترك لمتابعة محتوى تقني عربي يساعدك على فهم ما هو مفيد فعلاً — أو تواصل معي بخصوص تعاون.",
    ctaSecondary: "ابدأ تعاوناً",
  },
} as const;

function positive(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function YoutubeV3({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const isAr = locale === "ar";
  const y = copy[locale];
  const live = model.live.youtube;

  // Live API videos (already curated in the site model), otherwise the CMS / static list.
  const latest = (
    live?.videos?.length
      ? live.videos.map((video) => ({ id: video.id, title: video.title, thumbnail: video.thumbnail, views: video.views, publishedAt: video.publishedAt }))
      : model.latestVideos.map((video) => ({
          id: video.youtube_id,
          title: (isAr ? video.title_ar : video.title_en) || video.title_en || video.title_ar,
          thumbnail: video.thumbnail,
          views: video.views,
          publishedAt: video.published_at,
        }))
  ).filter((video) => video.id && video.thumbnail);
  const featured = latest[0];
  const rest = latest.slice(1, 7);
  const grid = rest.length > 3 ? rest.slice(0, Math.floor(rest.length / 3) * 3) : rest;

  const stats = [
    positive(live?.subscribers ?? model.youtube.subscribers, youtubeChannel.fallback.subscribers),
    positive(live?.totalViews ?? model.youtube.views, youtubeChannel.fallback.views),
    positive(live?.videoCount ?? model.youtube.videos, youtubeChannel.fallback.videos),
  ];
  const nf = new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" });
  const formatDate = (value?: string) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? dateFmt.format(date) : "";
  };
  const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
  const handle = model.youtube.handle || live?.channelHandle || youtubeChannel.handle;

  return (
    <div className="st-page v3p v3p-youtube">
      <section className="v3p-hero v3y-hero">
        <div className="st-container">
          <div className="v3y-hero-copy">
            <div className="v3p-load" style={{ "--v3p-seq-delay": "0.05s" } as CSSProperties}>
              <Eyebrow>{y.pill}</Eyebrow>
            </div>
            <SplitHeadline as="h1" immediate text={y.title} className="v3p-h1" />
            <div className="v3p-load v3y-hero-row" style={{ "--v3p-seq-delay": "0.3s" } as CSSProperties}>
              <p className="v3p-lead">{y.lead}</p>
              <div className="v3p-actions">
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--primary st-btn--lg v3y-subscribe">
                  <PlayCircle size={19} aria-hidden />
                  {y.subscribe}
                </a>
                <span className="v3y-handle">
                  <span className="v3y-handle-avatar">
                    <Image src="/images/logo.png" alt="" width={28} height={28} />
                  </span>
                  <bdi>{handle}</bdi>
                </span>
              </div>
            </div>
          </div>

          <div className="v3y-banner-wrap">
            <ParallaxImage
              src="/images/yt-channel-hero.png"
              alt={y.bannerAlt}
              priority
              strength={22}
              className="v3y-banner"
              sizes="(max-width: 1240px) 100vw, 1240px"
            />
            <dl className="v3y-stats">
              {stats.map((value, index) => (
                <Reveal key={y.stats[index]} delay={0.35 + index * 0.1} y={20} className="v3y-stat">
                  <dt>{y.stats[index]}</dt>
                  <dd>
                    <StatCount value={value} locale={locale} />
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="v3p-section v3y-featured-section">
          <div className="st-container">
            <Reveal y={36} amount={0.2}>
              <a className="v3y-featured" href={watchUrl(featured.id)} target="_blank" rel="noopener noreferrer">
                <TiltCard className="v3y-featured-media" max={4}>
                  <Image src={featured.thumbnail} alt="" fill sizes="(max-width: 900px) 92vw, 760px" quality={75} className="v3-cover v3y-thumb" />
                  <span className="v3y-play" aria-hidden="true">
                    <PlayCircle />
                  </span>
                </TiltCard>
                <span className="v3y-featured-copy">
                  <span className="v3y-featured-label">
                    <span className="v3y-rec" aria-hidden="true" />
                    {y.featuredLabel}
                  </span>
                  <span className="v3y-featured-title">{featured.title}</span>
                  <span className="v3y-meta">
                    {Number(featured.views) > 0 ? (
                      <span>
                        <Eye size={14} aria-hidden /> {nf.format(Number(featured.views))} {y.views}
                      </span>
                    ) : null}
                    {formatDate(featured.publishedAt) ? (
                      <span>
                        <CalendarDays size={14} aria-hidden /> {formatDate(featured.publishedAt)}
                      </span>
                    ) : null}
                  </span>
                  <span className="v3y-watch">
                    {y.watch}
                    <ArrowUpRight size={16} aria-hidden />
                  </span>
                </span>
              </a>
            </Reveal>
          </div>
        </section>
      ) : null}

      {grid.length ? (
        <section className="v3p-section">
          <div className="st-container">
            <SectionHead eyebrow={y.latestLabel} title={y.latestTitle} body={y.latestBody} />
            <Stagger className="v3y-grid" gap={0.08}>
              {grid.map((video) => (
                <a key={video.id} href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer" className="v3y-video">
                  <span className="v3y-video-thumb">
                    <Image src={video.thumbnail} alt="" fill sizes="(max-width: 700px) 92vw, 400px" quality={65} className="v3-cover v3y-thumb" />
                    <span className="v3y-play v3y-play--sm" aria-hidden="true">
                      <PlayCircle />
                    </span>
                  </span>
                  <span className="v3y-video-title">{video.title}</span>
                  <span className="v3y-meta">
                    {Number(video.views) > 0 ? (
                      <span>
                        {nf.format(Number(video.views))} {y.views}
                      </span>
                    ) : null}
                    {formatDate(video.publishedAt) ? <span>{formatDate(video.publishedAt)}</span> : null}
                  </span>
                </a>
              ))}
            </Stagger>
            <Reveal y={12} className="v3y-more">
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="v3-link">
                {y.allVideos}
              </a>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="v3p-section">
        <div className="st-container">
          <SectionHead eyebrow={y.topicsLabel} title={y.topicsTitle} />
          <Stagger className="v3y-topics" gap={0.08}>
            {y.topics.map(([title, body, image], index) => (
              <article key={title} className="v3y-topic">
                <span className="v3y-topic-media">
                  <Image src={image} alt="" fill sizes="(max-width: 700px) 92vw, 300px" quality={65} className="v3-cover v3y-topic-img" />
                </span>
                <span className="v3y-topic-tag">
                  {y.topicTag} {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </Stagger>
        </div>
      </section>

      <CtaBand eyebrow={y.ctaLabel} title={y.ctaTitle} body={y.ctaBody} image="/images/service_tech.png">
        <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--primary st-btn--lg">
          <PlayCircle size={18} aria-hidden />
          {y.subscribe}
        </a>
        <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--ghost">
          {y.ctaSecondary}
        </Link>
      </CtaBand>
    </div>
  );
}
