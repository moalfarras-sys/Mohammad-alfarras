import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, PlayCircle, Tv } from "lucide-react";

import { appTvInstall, currentAppReleases } from "@moalfarras/shared/app-releases";

import { SiteOffersSection } from "@/components/site/site-offers-section";
import {
  HoloPortrait,
  Marquee,
  ParallaxImage,
  Reveal,
  Showreel,
  SplitHeadline,
  Stagger,
  TiltCard,
  type HoloChip,
  type ShowreelItem,
} from "@/components/v3/motion-kit";
import { socialLinks } from "@/content/site";
import { youtubeChannel } from "@/content/site-data";
import { rebuildContent } from "@/data/rebuild-content";
import { withLocale } from "@/lib/i18n";
import { unoptimizedImage } from "@/lib/asset-url";

import type { SiteViewModel } from "./site-view-model";

import "@/styles/v3-home.css";

function hostOf(href?: string) {
  if (!href) return "";
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const copy = {
  en: {
    eyebrow: "Mohammad Alfarras · Web & product design",
    title: "I design and build websites and products people *trust* at first sight.",
    body: "Websites, landing pages, Android TV apps and Arabic tech content — made in Germany with a logistics operator's discipline and a designer's eye.",
    primary: "Start a project",
    secondary: "See the work",
    portraitAlt: "Mohammad Alfarras holding glowing design-tool icons above his open hand",
    chips: {
      youtube: "YouTube",
      subscribers: "subscribers",
      moplayer: "MoPlayer · latest",
      sites: "Live client sites",
      langs: "Works in",
    },
    marquee: "Live right now",
    work: {
      kicker: "Selected work",
      title: "Real businesses, *live* on the web.",
      body: "Every project here is online today. Scroll through them — then open the case to see the problem, what I built and the result.",
      all: "All projects",
      case: "Read the case",
      visit: "Visit site",
    },
    services: {
      kicker: "What I build",
      title: "From first sketch to *launch*.",
      body: "Structure, copy, interface, code and the details that make visitors act.",
      all: "Services & process",
      more: "Details",
    },
    products: {
      kicker: "My own products",
      title: "I ship my *own* products, too.",
      body: "App, website, releases, activation and support — built end to end. The best proof of the work I do for clients.",
      moplayerTag: "Android · Android TV · Windows",
      moplayerBody: "A media player family for your own legal M3U and Xtream sources — Classic for lighter devices, Pro for the newest TVs.",
      moplayerCta: "Open MoPlayer",
      downloader: "On a TV? Downloader code",
      moosTag: "Desktop OS · in development",
      moosBody: "An Arabic-first desktop operating system built on Fedora Atomic and KDE Plasma 6.",
      moosCta: "Explore MoOS",
    },
    channel: {
      kicker: "YouTube",
      title: "A channel built on *honest* reviews.",
      body: "Reviews, tutorials and Android TV experiments for an Arabic audience — the same clarity I bring to client work.",
      subscribe: "Subscribe",
      more: "Channel page",
      views: "views",
    },
    cta: {
      kicker: "Next step",
      title: "Have a project that deserves to look this *clear*?",
      body: "Send it as it is — even unfinished. I reply with a clear structure, a direction and the first practical step.",
      primary: "Start the conversation",
      whatsapp: "WhatsApp",
    },
  },
  ar: {
    eyebrow: "محمد الفراس · تصميم وتطوير المواقع والمنتجات",
    title: "أصمّم وأبني مواقع ومنتجات رقمية *يثق* بها الناس من أول نظرة.",
    body: "مواقع، صفحات هبوط، تطبيقات Android TV ومحتوى تقني عربي — أصنعها من ألمانيا بانضباط من عمل في اللوجستيات وعين مصمّم.",
    primary: "ابدأ مشروعك",
    secondary: "شاهد الأعمال",
    portraitAlt: "محمد الفراس يحمل أيقونات أدوات التصميم المضيئة فوق كفّه",
    chips: {
      youtube: "يوتيوب",
      subscribers: "مشترك",
      moplayer: "MoPlayer · آخر إصدار",
      sites: "مواقع عملاء تعمل الآن",
      langs: "أعمل بـ",
    },
    marquee: "تعمل الآن",
    work: {
      kicker: "أعمال مختارة",
      title: "مشاريع حقيقية، *تعمل* الآن على الإنترنت.",
      body: "كل مشروع هنا منشور ويعمل اليوم. مرّر بينها — ثم افتح دراسة الحالة لترى المشكلة وما بنيته والنتيجة.",
      all: "كل المشاريع",
      case: "اقرأ دراسة الحالة",
      visit: "زيارة الموقع",
    },
    services: {
      kicker: "ماذا أبني",
      title: "من أول فكرة حتى *الإطلاق*.",
      body: "الهيكل، النص، الواجهة، البرمجة، والتفاصيل التي تجعل الزائر يتخذ الخطوة.",
      all: "الخدمات وطريقة العمل",
      more: "التفاصيل",
    },
    products: {
      kicker: "منتجاتي",
      title: "وأبني منتجاتي *الخاصة* أيضاً.",
      body: "التطبيق، الموقع، الإصدارات، التفعيل والدعم — مبنية بالكامل. أفضل دليل على العمل الذي أقدّمه للعملاء.",
      moplayerTag: "Android · Android TV · Windows",
      moplayerBody: "عائلة مشغلات وسائط لمصادر M3U وXtream القانونية الخاصة بك — Classic للأجهزة الأخف، وPro لأحدث الشاشات.",
      moplayerCta: "افتح MoPlayer",
      downloader: "على التلفاز؟ كود Downloader",
      moosTag: "نظام تشغيل · قيد التطوير",
      moosBody: "نظام تشغيل عربي أولاً للكمبيوتر، مبني على Fedora Atomic وKDE Plasma 6.",
      moosCta: "استكشف MoOS",
    },
    channel: {
      kicker: "يوتيوب",
      title: "قناة مبنية على مراجعات *صادقة*.",
      body: "مراجعات، شروحات، وتجارب Android TV لجمهور عربي — بنفس الوضوح الذي أقدّمه في أعمال العملاء.",
      subscribe: "اشترك",
      more: "صفحة القناة",
      views: "مشاهدة",
    },
    cta: {
      kicker: "الخطوة التالية",
      title: "عندك مشروع يستحق أن يظهر *بهذا* الوضوح؟",
      body: "أرسله كما هو — حتى لو لم يكتمل. أردّ عليك بهيكل واضح، اتجاه بصري، وأول خطوة عملية.",
      primary: "ابدأ المحادثة",
      whatsapp: "واتساب",
    },
  },
} as const;

export function HomePage({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const isAr = locale === "ar";
  const c = copy[locale];
  const href = (path: string) => withLocale(locale, path);
  const nf = new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });
  const nfPlain = new Intl.NumberFormat(isAr ? "ar" : "en");

  // Hero copy stays editable from the admin: a CMS value that differs from the
  // bundled default means the owner changed it, so it wins over the curated copy.
  const cmsHero = model.t.hero;
  const defaultHero = rebuildContent[locale].hero;
  const fromCms = (cmsValue: string | undefined, curated: string, bundled: string) =>
    cmsValue && cmsValue.trim() && cmsValue !== bundled ? cmsValue : curated;
  const hero = {
    eyebrow: fromCms(cmsHero.eyebrow, c.eyebrow, defaultHero.eyebrow),
    title: fromCms(cmsHero.title, c.title, defaultHero.title),
    body: fromCms(cmsHero.body, c.body, defaultHero.body),
    primary: fromCms(cmsHero.primary, c.primary, defaultHero.primary),
    secondary: fromCms(cmsHero.secondary, c.secondary, defaultHero.secondary),
  };

  // The signature hologram portrait; an admin-chosen portrait still overrides it.
  const portrait = model.siteImages?.home_portrait || "/images/protofeilnew.jpeg";

  const yt = model.live.youtube;
  const subscribersRaw = Number(yt?.subscribers ?? model.youtube.subscribers) || youtubeChannel.fallback.subscribers;

  const clientProjects = model.projects
    .filter((project) => !/moplayer/i.test(project.slug) && project.status !== "in-development")
    .sort((a, b) => a.featuredRank - b.featuredRank);
  const liveClients = clientProjects.filter((project) => /^https?:\/\//.test(project.href ?? ""));
  const domains = [...new Set(liveClients.map((project) => hostOf(project.href)).filter(Boolean))];
  const featured = clientProjects.slice(0, 4);

  const classic = currentAppReleases.moplayer;
  const pro = currentAppReleases.moplayer2;

  const chips: HoloChip[] = [
    {
      label: c.chips.youtube,
      value: `${nf.format(subscribersRaw)} ${c.chips.subscribers}`,
      image: "/images/yt-channel-hero.png",
      x: 27,
      y: 9,
      depth: 0.7,
      href: href("youtube"),
    },
    {
      label: c.chips.moplayer,
      value: `Classic ${classic.versionName} · Pro ${pro.versionName}`,
      image: "/images/moplayer-icon-512.png",
      x: 74,
      y: 52,
      depth: 1,
      href: href("apps/moplayer"),
    },
    ...(liveClients.length
      ? [
          {
            label: c.chips.sites,
            value: nfPlain.format(liveClients.length),
            image: liveClients[0].image,
            x: 27,
            y: 84,
            depth: 0.85,
            href: href("work"),
          },
        ]
      : []),
    { label: c.chips.langs, value: "العربية · Deutsch · English", x: 70, y: 93, depth: 0.4 },
  ];

  const reel: ShowreelItem[] = featured.map((project) => ({
    id: project.slug,
    title: project.title,
    kicker: project.eyebrow || project.tags[0] || "",
    body: project.summary,
    desktop: project.image,
    mobile: project.gallery.find((src) => /-mobile\./.test(src)),
    domain: hostOf(project.href),
    href: href(`work/${project.slug}`),
    external: project.href && /^https?:\/\//.test(project.href) ? project.href : undefined,
  }));

  const services = model.services.slice(0, 3);

  const videos = (
    yt?.videos?.length
      ? yt.videos.map((video) => ({ id: video.id, title: video.title, thumbnail: video.thumbnail, views: video.views }))
      : model.latestVideos.map((video) => ({
          id: video.youtube_id,
          title: isAr ? video.title_ar : video.title_en,
          thumbnail: video.thumbnail,
          views: video.views,
        }))
  )
    .filter((video) => video.id && video.thumbnail)
    .slice(0, 3);

  return (
    <div className="st-page v3h">
      {/* ── Hero: the hologram portrait ── */}
      <section className="v3h-hero">
        <div className="v3h-hero-bg" aria-hidden="true" />
        <div className="st-container v3h-hero-inner">
          <div className="v3h-hero-copy">
            <Reveal y={14}>
              <p className="v3h-pill">
                <span className="v3h-pill-dot" aria-hidden="true" />
                {hero.eyebrow}
              </p>
            </Reveal>
            <SplitHeadline as="h1" text={hero.title} className="v3h-title" immediate delay={0.1} />
            <Reveal delay={0.35} y={18}>
              <p className="v3h-lede">{hero.body}</p>
            </Reveal>
            <Reveal delay={0.5} y={18} className="v3h-actions">
              <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
                {hero.primary}
                <ArrowUpRight size={18} aria-hidden />
              </Link>
              <Link href={href("work")} prefetch={false} className="st-btn st-btn--ghost st-btn--lg">
                {hero.secondary}
              </Link>
            </Reveal>
          </div>
          <div className="v3h-hero-visual">
            <HoloPortrait src={portrait} alt={c.portraitAlt} chips={chips} origin={{ x: 22, y: 62 }} />
          </div>
        </div>

        {domains.length ? (
          <div className="v3h-marquee" aria-label={c.marquee}>
            <span className="v3h-marquee-label">
              <span className="v3h-pill-dot" aria-hidden="true" />
              {c.marquee}
            </span>
            <Marquee speed={42}>
              {domains.map((domain) => (
                <span className="v3h-domain" key={domain}>
                  {domain}
                  <i aria-hidden="true">✦</i>
                </span>
              ))}
            </Marquee>
          </div>
        ) : null}
      </section>

      {/* ── Work showreel ── */}
      {reel.length ? (
        <section className="v3h-section">
          <div className="st-container">
            <header className="v3h-head">
              <div>
                <p className="v3h-kicker">{c.work.kicker}</p>
                <SplitHeadline as="h2" text={c.work.title} className="v3h-h2" />
              </div>
              <div className="v3h-head-side">
                <p>{c.work.body}</p>
                <Link href={href("work")} prefetch={false} className="v3-link">
                  {c.work.all}
                </Link>
              </div>
            </header>
            <Showreel items={reel} labels={{ caseStudy: c.work.case, visit: c.work.visit }} />
          </div>
        </section>
      ) : null}

      {/* ── Services: three big image cards ── */}
      {services.length ? (
        <section className="v3h-section v3h-section--tight">
          <div className="st-container">
            <header className="v3h-head">
              <div>
                <p className="v3h-kicker">{c.services.kicker}</p>
                <SplitHeadline as="h2" text={c.services.title} className="v3h-h2" />
              </div>
              <div className="v3h-head-side">
                <p>{c.services.body}</p>
                <Link href={href("services")} prefetch={false} className="v3-link">
                  {c.services.all}
                </Link>
              </div>
            </header>
            <Stagger className="v3h-services" gap={0.12}>
              {services.map((service) => (
                <TiltCard className="v3h-service" key={service.id} max={6}>
                  <Link href={href("services")} prefetch={false} className="v3h-service-link">
                    <span className="v3h-service-media">
                      <Image src={service.image} alt="" fill sizes="(max-width: 900px) 92vw, 420px" quality={70} className="v3-cover" />
                    </span>
                    <span className="v3h-service-body">
                      <span className="v3h-service-title">{service.title}</span>
                      <span className="v3h-service-text">{service.body}</span>
                      <span className="v3h-service-tags">
                        {service.bullets.slice(0, 3).map((bullet) => (
                          <span key={bullet}>{bullet}</span>
                        ))}
                      </span>
                      <span className="v3h-service-more">
                        {c.services.more}
                        <ArrowUpRight size={15} aria-hidden />
                      </span>
                    </span>
                  </Link>
                </TiltCard>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      {/* ── Products ── */}
      <section className="v3h-section">
        <div className="st-container">
          <header className="v3h-head">
            <div>
              <p className="v3h-kicker">{c.products.kicker}</p>
              <SplitHeadline as="h2" text={c.products.title} className="v3h-h2" />
            </div>
            <div className="v3h-head-side">
              <p>{c.products.body}</p>
            </div>
          </header>

          <div className="v3h-products">
            <Reveal className="v3h-product v3h-product--moplayer">
              <div className="v3h-product-stage" aria-hidden="true">
                <div className="v3h-tv">
                  <div className="v3h-tv-screen">
                    <Image
                      src="/images/moplayer/classic-2-5/classic-2-5-home-live-row.webp"
                      alt=""
                      fill
                      sizes="(max-width: 900px) 88vw, 620px"
                      quality={72}
                      className="v3-cover"
                    />
                  </div>
                  <span className="v3h-tv-stand" />
                </div>
                <div className="v3h-tv-float">
                  <Image src="/images/moplayer-pro-home.webp" alt="" fill sizes="280px" quality={70} className="v3-cover" />
                </div>
              </div>
              <div className="v3h-product-copy">
                <p className="v3h-product-tag">{c.products.moplayerTag}</p>
                <h3>MoPlayer</h3>
                <p>{c.products.moplayerBody}</p>
                <ul className="v3h-versions">
                  <li>
                    <span>Classic</span>
                    <strong>{classic.versionName}</strong>
                  </li>
                  <li>
                    <span>Pro</span>
                    <strong>{pro.versionName}</strong>
                  </li>
                </ul>
                <div className="v3h-product-actions">
                  <Link href={href("apps/moplayer")} prefetch={false} className="st-btn st-btn--primary">
                    {c.products.moplayerCta}
                    <ArrowUpRight size={16} aria-hidden />
                  </Link>
                  <Link href="/tv" prefetch={false} className="v3h-code">
                    <Tv size={16} aria-hidden />
                    <span>{c.products.downloader}</span>
                    <strong dir="ltr">{appTvInstall.moplayer.downloaderCode}</strong>
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal className="v3h-product v3h-product--moos" delay={0.1}>
              <Link href={href("moos")} prefetch={false} className="v3h-moos-link">
                <span className="v3h-moos-media">
                  <Image src="/images/moos/desktop-dark.webp" alt={isAr ? "سطح مكتب MoOS" : "The MoOS desktop"} fill sizes="(max-width: 900px) 92vw, 460px" quality={70} className="v3-cover" />
                </span>
                <span className="v3h-product-copy">
                  <span className="v3h-product-tag">{c.products.moosTag}</span>
                  <span className="v3h-moos-title">MoOS</span>
                  <span className="v3h-moos-text">{c.products.moosBody}</span>
                  <span className="v3-link">{c.products.moosCta}</span>
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Admin-managed promotional offers (none by default). */}
      <SiteOffersSection model={model} placement="home" />

      {/* ── YouTube band ── */}
      <section className="v3h-yt">
        <ParallaxImage src="/images/yt-channel-hero.png" alt="" className="v3h-yt-bg" strength={70} sizes="100vw" />
        <div className="v3h-yt-shade" aria-hidden="true" />
        <div className="st-container v3h-yt-inner">
          <div className="v3h-yt-copy">
            <p className="v3h-kicker">{c.channel.kicker}</p>
            <SplitHeadline as="h2" text={c.channel.title} className="v3h-h2" />
            <p className="v3h-yt-text">{c.channel.body}</p>
            <div className="v3h-actions">
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--primary">
                <PlayCircle size={18} aria-hidden />
                {c.channel.subscribe}
              </a>
              <Link href={href("youtube")} prefetch={false} className="st-btn st-btn--ghost">
                {c.channel.more}
              </Link>
            </div>
          </div>
          {videos.length ? (
            <Stagger className="v3h-videos" gap={0.1}>
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="v3h-video"
                >
                  <span className="v3h-video-thumb">
                    <Image src={video.thumbnail} alt="" fill sizes="(max-width: 900px) 80vw, 300px" quality={65} className="v3-cover" unoptimized={unoptimizedImage(video.thumbnail)} />
                    <span className="v3h-video-play" aria-hidden="true">
                      <PlayCircle />
                    </span>
                  </span>
                  <span className="v3h-video-title">{video.title}</span>
                  {Number(video.views) > 0 ? (
                    <span className="v3h-video-meta">
                      {nf.format(Number(video.views))} {c.channel.views}
                    </span>
                  ) : null}
                </a>
              ))}
            </Stagger>
          ) : null}
        </div>
      </section>

      {/* ── One CTA ── */}
      <section className="v3h-section v3h-section--cta">
        <div className="st-container">
          <Reveal className="v3h-cta">
            <div className="v3h-cta-art" aria-hidden="true">
              <Image src="/images/hero-profile-bg.png" alt="" fill sizes="100vw" quality={55} className="v3-cover" />
            </div>
            <div className="v3h-cta-avatar">
              <Image src="/images/portrait.jpg" alt="" fill sizes="96px" quality={70} className="v3-cover" />
            </div>
            <p className="v3h-kicker">{c.cta.kicker}</p>
            <SplitHeadline as="h2" text={c.cta.title} className="v3h-h2 v3h-cta-title" />
            <p className="v3h-cta-text">{c.cta.body}</p>
            <div className="v3h-actions v3h-actions--center">
              <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
                {c.cta.primary}
                <ArrowUpRight size={18} aria-hidden />
              </Link>
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--ghost st-btn--lg">
                <MessageCircle size={17} aria-hidden />
                {c.cta.whatsapp}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
