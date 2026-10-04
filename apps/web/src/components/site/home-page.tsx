import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MessageCircle, PlayCircle, QrCode } from "lucide-react";

import { SiteOffersSection } from "@/components/site/site-offers-section";
import { Accented, BrowserFrame, RouteTrack, SectionIntro, StudioCta } from "@/components/studio/primitives";
import { routeSteps } from "@/content/route";
import { socialLinks } from "@/content/site";
import { youtubeChannel } from "@/content/site-data";
import { rebuildContent } from "@/data/rebuild-content";
import { unoptimizedImage } from "@/lib/asset-url";
import { withLocale } from "@/lib/i18n";

import type { SiteViewModel } from "./site-view-model";

function compact(locale: SiteViewModel["locale"], value: string | number | undefined, fallback: number) {
  const n = Number(value);
  const v = Number.isFinite(n) && n > 0 ? n : fallback;
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

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
    proof: { views: "YouTube views", subs: "Subscribers", sites: "Client sites live" },
    label: {
      route: "Route",
      from: "From",
      to: "To",
      now: "Now",
      fromValue: "Al-Hasakah, Syria",
      toValue: "Germany · since 2015",
      nowValue: "Web · Apps · Content",
      status: "MoOS in development",
    },
    work: {
      label: "Selected work",
      title: "Real businesses, *live* on the web.",
      body: "Every project below is online today. Open any of them to see the problem, what I built, and the result.",
      all: "All projects",
      case: "Read the case",
      visit: "Visit site",
    },
    services: {
      label: "What I build",
      title: "Four things, done *properly*.",
      body: "From the first sketch to launch: structure, copy, interface, code and the details that make visitors act.",
      all: "Services & process",
    },
    products: {
      label: "Products",
      title: "I ship my *own* products, too.",
      body: "Building products end to end — app, website, releases, activation and support — is the best proof of the work I do for clients.",
      moplayerTag: "Android · Android TV · Windows",
      moplayerBody:
        "A media player family for your own legal M3U and Xtream sources: Classic for lighter devices, Pro for the newest TVs, and a Windows edition.",
      moplayerCta: "Open the MoPlayer hub",
      moosTag: "Desktop OS · in development",
      moosBody: "An Arabic-first desktop operating system built on Fedora Atomic and KDE Plasma 6.",
      moosCta: "Explore MoOS",
      activateTag: "Web ↔ TV",
      activateTitle: "QR activation",
      activateBody: "Send a source from your phone to the TV in one scan — nothing stored permanently.",
      activateCta: "Try activation",
    },
    channel: {
      label: "YouTube",
      title: "A channel built on *honest* reviews.",
      body: "Honest reviews, tutorials and Android TV experiments for an Arabic audience — the same clarity I bring to client work.",
      subscribe: "Subscribe on YouTube",
      more: "Channel page",
      stats: ["Subscribers", "Views", "Videos"],
      views: "views",
    },
    route: {
      label: "The route so far",
      title: "From the warehouse floor to the *front end*.",
      body: "Logistics taught me sequence, timing and how real customers decide. That is what I build into every page.",
      cv: "Full CV",
    },
    cta: {
      label: "Next step",
      title: "Have a project that deserves to look this *clear*?",
      body: "Send it as it is — even unfinished. I reply with a clear structure, a direction and the first practical step.",
      primary: "Start the conversation",
      whatsapp: "WhatsApp",
      email: "Email",
    },
  },
  ar: {
    eyebrow: "محمد الفراس · تصميم وتطوير المواقع والمنتجات",
    title: "أصمّم وأبني مواقع ومنتجات رقمية *يثق بها* الناس من أول نظرة.",
    body: "مواقع، صفحات هبوط، تطبيقات Android TV ومحتوى تقني عربي — أصنعها من ألمانيا بانضباط من عمل في اللوجستيات وعين مصمّم.",
    primary: "ابدأ مشروعك",
    secondary: "شاهد الأعمال",
    proof: { views: "مشاهدة على يوتيوب", subs: "مشترك", sites: "مواقع عملاء تعمل الآن" },
    label: {
      route: "المسار",
      from: "من",
      to: "إلى",
      now: "الآن",
      fromValue: "الحسكة، سوريا",
      toValue: "ألمانيا · منذ 2015",
      nowValue: "ويب · تطبيقات · محتوى",
      status: "نظام MoOS قيد التطوير",
    },
    work: {
      label: "أعمال مختارة",
      title: "مشاريع حقيقية، *تعمل الآن* على الإنترنت.",
      body: "كل مشروع هنا منشور ويعمل اليوم. افتح أيّاً منها لترى المشكلة، وما بنيته، والنتيجة.",
      all: "كل المشاريع",
      case: "اقرأ دراسة الحالة",
      visit: "زيارة الموقع",
    },
    services: {
      label: "ماذا أبني",
      title: "أربعة أشياء، *بإتقان*.",
      body: "من أول فكرة حتى الإطلاق: الهيكل، النص، الواجهة، البرمجة، والتفاصيل التي تجعل الزائر يتخذ الخطوة.",
      all: "الخدمات وطريقة العمل",
    },
    products: {
      label: "منتجاتي",
      title: "وأبني منتجاتي *الخاصة* أيضاً.",
      body: "بناء منتج كامل — التطبيق، الموقع، الإصدارات، التفعيل والدعم — هو أفضل دليل على العمل الذي أقدّمه للعملاء.",
      moplayerTag: "Android · Android TV · Windows",
      moplayerBody: "عائلة مشغلات وسائط لمصادر M3U وXtream القانونية الخاصة بك: Classic للأجهزة الأخف، Pro لأحدث الشاشات، ونسخة Windows.",
      moplayerCta: "افتح بوابة MoPlayer",
      moosTag: "نظام تشغيل · قيد التطوير",
      moosBody: "نظام تشغيل عربي أولاً للكمبيوتر، مبني على Fedora Atomic وKDE Plasma 6.",
      moosCta: "استكشف MoOS",
      activateTag: "الويب ↔ التلفاز",
      activateTitle: "التفعيل عبر QR",
      activateBody: "أرسل المصدر من جوالك إلى التلفاز بمسحة واحدة — بدون تخزين دائم.",
      activateCta: "جرّب التفعيل",
    },
    channel: {
      label: "يوتيوب",
      title: "قناة مبنية على مراجعات *صادقة*.",
      body: "مراجعات صادقة، شروحات، وتجارب Android TV لجمهور عربي — بنفس الوضوح الذي أقدّمه في أعمال العملاء.",
      subscribe: "اشترك على يوتيوب",
      more: "صفحة القناة",
      stats: ["مشترك", "مشاهدة", "فيديو"],
      views: "مشاهدة",
    },
    route: {
      label: "المسار حتى الآن",
      title: "من أرض المستودع إلى *واجهات الويب*.",
      body: "اللوجستيات علّمتني التسلسل والتوقيت وكيف يقرّر العميل الحقيقي. وهذا ما أبنيه في كل صفحة.",
      cv: "السيرة الكاملة",
    },
    cta: {
      label: "الخطوة التالية",
      title: "عندك مشروع يستحق أن يظهر *بهذا الوضوح*؟",
      body: "أرسله كما هو — حتى لو لم يكتمل. أردّ عليك بهيكل واضح، اتجاه بصري، وأول خطوة عملية.",
      primary: "ابدأ المحادثة",
      whatsapp: "واتساب",
      email: "البريد",
    },
  },
} as const;

const serviceCopy = {
  en: [
    {
      title: "Business websites",
      body: "A site that explains who you are, what you offer and why visitors should trust you — on every screen size.",
      tags: ["Brand", "Copy", "Bilingual"],
      image: "/images/projects/intelligent-umzuege-home.webp",
    },
    {
      title: "Landing pages",
      body: "One focused page that moves visitors toward a request, a signup or a download — without clutter.",
      tags: ["Campaign", "Conversion", "Speed"],
      image: "/images/projects/mbkservice-home.webp",
    },
    {
      title: "Web apps & interfaces",
      body: "Structured interfaces for portals, dashboards and directories that stay easy to use as they grow.",
      tags: ["UI/UX", "Data", "Search"],
      image: "/images/projects/alhasakah-home.webp",
    },
    {
      title: "Product launch surfaces",
      body: "Product pages, downloads, activation and support flows that ordinary users can follow — proven on MoPlayer.",
      tags: ["Android TV", "Releases", "Support"],
      image: "/images/moplayer-pro-home.webp",
    },
  ],
  ar: [
    {
      title: "مواقع الشركات",
      body: "موقع يشرح من أنت وماذا تقدّم ولماذا يثق بك الزائر — على كل أحجام الشاشات.",
      tags: ["هوية", "نصوص", "لغتان"],
      image: "/images/projects/intelligent-umzuege-home.webp",
    },
    {
      title: "صفحات الهبوط",
      body: "صفحة واحدة مركّزة تقود الزائر إلى طلب أو تسجيل أو تحميل — بدون تشتيت.",
      tags: ["حملة", "تحويل", "سرعة"],
      image: "/images/projects/mbkservice-home.webp",
    },
    {
      title: "تطبيقات وواجهات ويب",
      body: "واجهات منظمة للبوابات ولوحات التحكم والأدلة، تبقى سهلة الاستخدام مع نموّها.",
      tags: ["UI/UX", "بيانات", "بحث"],
      image: "/images/projects/alhasakah-home.webp",
    },
    {
      title: "صفحات إطلاق المنتجات",
      body: "صفحات منتج، تحميل، تفعيل ودعم يفهمها المستخدم العادي — مجرّبة على MoPlayer.",
      tags: ["Android TV", "إصدارات", "دعم"],
      image: "/images/moplayer-pro-home.webp",
    },
  ],
} as const;

export function HomePage({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const isAr = locale === "ar";
  const c = copy[locale];
  const href = (path: string) => withLocale(locale, path);

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

  // The real studio photograph; an admin-chosen portrait still overrides it.
  const portrait = model.siteImages?.home_portrait || "/images/portrait.jpg";

  const yt = model.live.youtube;
  const views = compact(locale, yt?.totalViews ?? model.youtube.views, youtubeChannel.fallback.views);
  const subscribers = compact(locale, yt?.subscribers ?? model.youtube.subscribers, youtubeChannel.fallback.subscribers);
  const videoCount = compact(locale, yt?.videoCount ?? model.youtube.videos, youtubeChannel.fallback.videos);

  const clientProjects = model.projects
    .filter((project) => !/moplayer/i.test(project.slug) && project.status !== "in-development")
    .sort((a, b) => a.featuredRank - b.featuredRank);
  const liveClientSites = clientProjects.filter((project) => /^https?:\/\//.test(project.href ?? "")).length;
  const featured = clientProjects.slice(0, 4);

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
  const nf = new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });

  return (
    <div className="st-page st-home">
      {/* Hero */}
      <section className="st-hero" aria-labelledby="home-title">
        <div className="st-hero-grid" aria-hidden="true" />
        <div className="st-container st-hero-inner">
          <div className="st-hero-copy">
            <p className="st-pill st-anim" style={{ "--d": "40ms" } as React.CSSProperties}>
              <span className="st-pill-dot" aria-hidden="true" />
              {hero.eyebrow}
            </p>
            <h1 id="home-title" className="st-display">
              <Accented text={hero.title} />
            </h1>
            <p className="st-lead">{hero.body}</p>
            <div className="st-actions st-anim" style={{ "--d": "160ms" } as React.CSSProperties}>
              <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary">
                {hero.primary}
                <ArrowUpRight size={18} aria-hidden />
              </Link>
              <Link href={href("work")} prefetch={false} className="st-btn st-btn--ghost">
                {hero.secondary}
              </Link>
            </div>
            <dl className="st-proof st-anim" style={{ "--d": "240ms" } as React.CSSProperties}>
              <div>
                <dt>{c.proof.views}</dt>
                <dd>{views}</dd>
              </div>
              <div>
                <dt>{c.proof.subs}</dt>
                <dd>{subscribers}</dd>
              </div>
              {liveClientSites > 0 ? (
                <div>
                  <dt>{c.proof.sites}</dt>
                  <dd>{new Intl.NumberFormat(isAr ? "ar" : "en").format(liveClientSites)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="st-hero-visual st-anim" style={{ "--d": "120ms" } as React.CSSProperties}>
            <figure className="st-portrait">
              <Image
                src={portrait}
                alt={isAr ? "صورة محمد الفراس" : "Portrait of Mohammad Alfarras"}
                fill
                preload
                sizes="(max-width: 900px) 88vw, 440px"
                quality={70}
                className="st-portrait-img"
                unoptimized={unoptimizedImage(portrait)}
              />
              <figcaption className="st-portrait-status">
                <span className="st-pill-dot" aria-hidden="true" />
                {c.label.status}
              </figcaption>
            </figure>
            <div className="st-ticket">
              <div className="st-ticket-head">
                <span>{c.label.route}</span>
                <span className="st-mono">AR · DE · EN</span>
              </div>
              <dl>
                <div>
                  <dt>{c.label.from}</dt>
                  <dd>{c.label.fromValue}</dd>
                </div>
                <div>
                  <dt>{c.label.to}</dt>
                  <dd>{c.label.toValue}</dd>
                </div>
                <div>
                  <dt>{c.label.now}</dt>
                  <dd>{c.label.nowValue}</dd>
                </div>
              </dl>
              <span className="st-ticket-route" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 01 Selected work */}
      {featured.length ? (
        <section className="st-section">
          <div className="st-container">
            <SectionIntro
              index="01"
              label={c.work.label}
              title={<Accented text={c.work.title} />}
              body={c.work.body}
              action={{ href: href("work"), label: c.work.all }}
            />
            <div className="st-work">
              {featured.map((project, index) => (
                <article className={index === 0 ? "st-work-card st-work-card--lead st-reveal" : "st-work-card st-reveal"} key={project.slug}>
                  <Link href={href(`work/${project.slug}`)} prefetch={false} className="st-work-media" tabIndex={-1} aria-hidden="true">
                    <BrowserFrame label={hostOf(project.href)}>
                      <Image
                        src={project.image}
                        alt=""
                        fill
                        sizes={index === 0 ? "(max-width: 900px) 92vw, 720px" : "(max-width: 900px) 92vw, 420px"}
                        quality={70}
                        className="st-cover"
                      />
                    </BrowserFrame>
                  </Link>
                  <div className="st-work-body">
                    <p className="st-meta">
                      <span className="st-mono">{String(index + 1).padStart(2, "0")}</span>
                      {project.eyebrow || project.tags[0]}
                    </p>
                    <h3>
                      <Link href={href(`work/${project.slug}`)} prefetch={false}>
                        {project.title}
                      </Link>
                    </h3>
                    <p>{project.summary}</p>
                    <div className="st-work-links">
                      <Link href={href(`work/${project.slug}`)} prefetch={false} className="st-link">
                        {c.work.case}
                        <ArrowUpRight size={15} aria-hidden />
                        <span className="sr-only"> — {project.title}</span>
                      </Link>
                      {project.href && /^https?:\/\//.test(project.href) ? (
                        <a href={project.href} target="_blank" rel="noopener noreferrer" className="st-link st-link--quiet">
                          {c.work.visit}
                          <span className="sr-only"> — {project.title}</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 02 Services */}
      <section className="st-section">
        <div className="st-container">
          <SectionIntro
            index="02"
            label={c.services.label}
            title={<Accented text={c.services.title} />}
            body={c.services.body}
            action={{ href: href("services"), label: c.services.all }}
          />
          <ol className="st-index">
            {serviceCopy[locale].map((service, index) => (
              <li className="st-index-row st-reveal" key={service.title}>
                <span className="st-index-num st-mono" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="st-index-text">
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </div>
                <ul className="st-tags" aria-label={isAr ? "يشمل" : "Includes"}>
                  {service.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <div className="st-index-thumb" aria-hidden="true">
                  <Image src={service.image} alt="" fill sizes="220px" quality={60} className="st-cover" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 03 Products */}
      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="03" label={c.products.label} title={<Accented text={c.products.title} />} body={c.products.body} />
          <div className="st-bento">
            <Link href={href("apps/moplayer")} prefetch={false} className="st-tile st-tile--moplayer st-reveal">
              <div className="st-tile-copy">
                <p className="st-meta">{c.products.moplayerTag}</p>
                <h3>MoPlayer</h3>
                <p>{c.products.moplayerBody}</p>
                <span className="st-link">
                  {c.products.moplayerCta}
                  <ArrowUpRight size={15} aria-hidden />
                </span>
              </div>
              <div className="st-tile-media">
                <Image
                  src="/images/moplayer-pro-hero.webp"
                  alt={isAr ? "واجهة MoPlayer Pro على التلفاز" : "MoPlayer Pro interface on a TV"}
                  fill
                  sizes="(max-width: 900px) 92vw, 640px"
                  quality={70}
                  className="st-cover"
                />
              </div>
            </Link>
            <Link href={href("moos")} prefetch={false} className="st-tile st-tile--moos st-reveal">
              <div className="st-tile-copy">
                <p className="st-meta">{c.products.moosTag}</p>
                <h3>MoOS</h3>
                <p>{c.products.moosBody}</p>
                <span className="st-link">
                  {c.products.moosCta}
                  <ArrowUpRight size={15} aria-hidden />
                </span>
              </div>
              <div className="st-tile-media">
                <Image
                  src="/images/moos/desktop-dark.webp"
                  alt={isAr ? "سطح مكتب MoOS" : "The MoOS desktop"}
                  fill
                  sizes="(max-width: 900px) 92vw, 420px"
                  quality={70}
                  className="st-cover"
                />
              </div>
            </Link>
            <Link href={href("activate?product=moplayer2")} prefetch={false} className="st-tile st-tile--activate st-reveal">
              <div className="st-tile-copy">
                <p className="st-meta">{c.products.activateTag}</p>
                <h3>{c.products.activateTitle}</h3>
                <p>{c.products.activateBody}</p>
                <span className="st-link">
                  {c.products.activateCta}
                  <ArrowUpRight size={15} aria-hidden />
                </span>
              </div>
              <div className="st-qr" aria-hidden="true">
                <QrCode strokeWidth={1.1} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Admin-managed promotional offers (none by default). */}
      <SiteOffersSection model={model} placement="home" />

      {/* 04 Channel */}
      <section className="st-section">
        <div className="st-container st-channel">
          <div className="st-channel-copy">
            <SectionIntro index="04" label={c.channel.label} title={<Accented text={c.channel.title} />} body={c.channel.body} />
            <dl className="st-stats">
              <div>
                <dt>{c.channel.stats[0]}</dt>
                <dd>{subscribers}</dd>
              </div>
              <div>
                <dt>{c.channel.stats[1]}</dt>
                <dd>{views}</dd>
              </div>
              <div>
                <dt>{c.channel.stats[2]}</dt>
                <dd>{videoCount}</dd>
              </div>
            </dl>
            <div className="st-actions">
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
            <ul className="st-videos">
              {videos.map((video, index) => (
                <li key={video.id} className={index === 0 ? "st-video-item st-video-item--lead st-reveal" : "st-video-item st-reveal"}>
                  <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="st-video">
                    <span className="st-video-thumb">
                      <Image
                        src={video.thumbnail}
                        alt=""
                        fill
                        sizes={index === 0 ? "(max-width: 900px) 92vw, 560px" : "(max-width: 900px) 45vw, 270px"}
                        quality={65}
                        className="st-cover"
                      />
                      <span className="st-video-play" aria-hidden="true">
                        <PlayCircle />
                      </span>
                    </span>
                    <span className="st-video-title">{video.title}</span>
                    {Number(video.views) > 0 ? (
                      <span className="st-video-meta">
                        {nf.format(Number(video.views))} {c.channel.views}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* 05 Route */}
      <section className="st-section">
        <div className="st-container">
          <SectionIntro
            index="05"
            label={c.route.label}
            title={<Accented text={c.route.title} />}
            body={c.route.body}
            action={{ href: href("cv"), label: c.route.cv }}
          />
          <RouteTrack steps={routeSteps[locale]} nowFrom={4} />
        </div>
      </section>

      <StudioCta label={c.cta.label} title={c.cta.title} body={c.cta.body}>
        <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {c.cta.primary}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--ghost">
          <MessageCircle size={17} aria-hidden />
          {c.cta.whatsapp}
        </a>
        <a href={`mailto:${socialLinks.email}`} className="st-btn st-btn--ghost">
          <Mail size={17} aria-hidden />
          {c.cta.email}
        </a>
      </StudioCta>
    </div>
  );
}
