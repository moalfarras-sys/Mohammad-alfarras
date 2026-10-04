import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Gauge,
  Languages,
  LifeBuoy,
  Mail,
  MessageCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { HomePage } from "@/components/site/home-page";
import { SiteOffersSection } from "@/components/site/site-offers-section";
import { PageHero, RouteTrack, SectionIntro, StudioCta } from "@/components/studio/primitives";
import { cvPageCopy } from "@/content/cv";
import { routeSteps } from "@/content/route";
import { socialLinks } from "@/content/site";
import { languageLevels, youtubeChannel } from "@/content/site-data";
import { withLocale } from "@/lib/i18n";

import type { SiteViewModel } from "./site-view-model";

function compact(locale: SiteViewModel["locale"], value: string | number | undefined, fallback: number) {
  const n = Number(value);
  const v = Number.isFinite(n) && n > 0 ? n : fallback;
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

/* ─────────────────────────────────────────────────────────────────────────
   Services
   ───────────────────────────────────────────────────────────────────────── */

const servicesCopy = {
  en: {
    pill: "Services",
    title: "Websites and product pages that *earn* trust.",
    lead: "Positioning, UX, interface design, development and launch support — one person accountable from the first call to the live site.",
    outcomes: ["Clearer message", "Faster trust", "Better mobile experience", "A direct path to contact"],
    offerLabel: "What I offer",
    offerTitle: "Pick the *starting point* that fits.",
    offerBody: "Every engagement can be scoped small or grow into a full system — the structure stays the same.",
    processLabel: "How we work",
    processTitle: "A clear process *instead* of chaos.",
    processBody: "Every decision in copy, imagery, motion and buttons should help the visitor understand, trust and act.",
    steps: [
      ["01", "Understand the goal", "We define the audience, the offer and the core problem before drawing a single screen."],
      ["02", "Shape the structure", "Pages, messages, calls to action and contact paths are arranged around clarity."],
      ["03", "Design and build", "A modern interface, restrained motion, strong performance and responsive behaviour."],
      ["04", "Launch and refine", "Clean delivery, forms and statistics wired up, and iteration where the project needs it."],
    ],
    includedLabel: "In every project",
    includedTitle: "The *basics*, never optional.",
    included: [
      ["Arabic & English", "Right-to-left layouts treated as first-class, not as a translation afterthought."],
      ["Mobile first", "Designed for the phone your customer actually holds, then scaled up."],
      ["Fast by default", "Optimised images, lean code and measured page speed before launch."],
      ["Findable", "Clean metadata, structured data and a sitemap search engines understand."],
      ["Privacy-friendly", "No advertising trackers; only what the site needs to work."],
      ["Support after launch", "Changes, fixes and next steps when the business moves."],
    ],
    ctaLabel: "Ready to start?",
    ctaTitle: "Turn your project into a *clear* digital experience.",
    ctaBody: "Send the idea and I will help shape it visually, commercially and technically — without unnecessary complexity.",
    ctaPrimary: "Start your project",
    ctaSecondary: "See the work",
  },
  ar: {
    pill: "الخدمات",
    title: "مواقع وصفحات منتجات *تكسب* ثقة الزائر.",
    lead: "التموضع، تجربة الاستخدام، تصميم الواجهة، البرمجة ودعم الإطلاق — شخص واحد مسؤول من أول مكالمة حتى نشر الموقع.",
    outcomes: ["رسالة أوضح", "ثقة أسرع", "تجربة جوال أفضل", "طريق مباشر للتواصل"],
    offerLabel: "ماذا أقدّم",
    offerTitle: "اختر *نقطة البداية* المناسبة لك.",
    offerBody: "كل مشروع يمكن أن يبدأ صغيراً أو يكبر إلى نظام كامل — والهيكل يبقى نفسه.",
    processLabel: "طريقة العمل",
    processTitle: "عملية واضحة *بدل* الفوضى.",
    processBody: "كل قرار في النص والصورة والحركة والأزرار يجب أن يساعد الزائر على الفهم والثقة والتواصل.",
    steps: [
      ["01", "نفهم الهدف", "نحدد الجمهور والعرض والمشكلة الأساسية قبل رسم أي شاشة."],
      ["02", "نبني الهيكل", "نرتّب الصفحات والرسائل وأزرار التواصل حول الوضوح."],
      ["03", "نصمّم وننفّذ", "واجهة حديثة، حركة هادئة، أداء قوي، وتجربة مناسبة لكل الشاشات."],
      ["04", "نطلق ونحسّن", "تسليم نظيف، ربط النماذج والإحصاءات، وتطوير تدريجي حسب حاجة المشروع."],
    ],
    includedLabel: "في كل مشروع",
    includedTitle: "*الأساسيات* ليست اختيارية.",
    included: [
      ["عربي وإنجليزي", "تصميم من اليمين لليسار بعناية كاملة، لا كترجمة لاحقة."],
      ["الجوال أولاً", "مصمّم للهاتف الذي يحمله عميلك فعلاً، ثم للشاشات الأكبر."],
      ["سريع افتراضياً", "صور محسّنة، كود خفيف، وقياس سرعة الصفحة قبل الإطلاق."],
      ["قابل للظهور في البحث", "بيانات وصفية نظيفة، بيانات منظمة، وخريطة موقع تفهمها محركات البحث."],
      ["يحترم الخصوصية", "بدون أدوات تتبّع إعلانية؛ فقط ما يحتاجه الموقع ليعمل."],
      ["دعم بعد الإطلاق", "تعديلات وإصلاحات وخطوات تالية عندما يتطور عملك."],
    ],
    ctaLabel: "جاهز للبدء؟",
    ctaTitle: "حوّل مشروعك إلى تجربة رقمية *واضحة*.",
    ctaBody: "أرسل الفكرة، وسأساعدك في ترتيبها بصرياً وتسويقياً وتقنياً — بدون تعقيد غير ضروري.",
    ctaPrimary: "ابدأ مشروعك",
    ctaSecondary: "شاهد الأعمال",
  },
} as const;

const includedIcons = [Languages, Smartphone, Gauge, Search, ShieldCheck, LifeBuoy];

function ServicesPage({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const c = servicesCopy[locale];
  const href = (path: string) => withLocale(locale, path);

  return (
    <div className="st-page">
      <PageHero pill={c.pill} title={c.title} lead={c.lead}>
        <ul className="st-tags st-hero-tags">
          {c.outcomes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </PageHero>

      {model.services.length ? (
        <section className="st-section">
          <div className="st-container">
            <SectionIntro index="01" label={c.offerLabel} title={c.offerTitle} body={c.offerBody} />
            <ol className="st-index">
              {model.services.map((service, index) => (
                <li className="st-index-row st-reveal" key={service.id}>
                  <span className="st-index-num st-mono" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="st-index-text">
                    <h3>{service.title}</h3>
                    <p>{service.body}</p>
                  </div>
                  <ul className="st-tags">
                    {service.bullets.slice(0, 3).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <div className="st-index-thumb" aria-hidden="true">
                    {service.image ? <Image src={service.image} alt="" fill sizes="220px" quality={60} className="st-cover" /> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <SiteOffersSection model={model} placement="services" />

      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="02" label={c.processLabel} title={c.processTitle} body={c.processBody} />
          <RouteTrack steps={c.steps} columns={4} nowFrom={3} />
        </div>
      </section>

      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="03" label={c.includedLabel} title={c.includedTitle} />
          <ul className="st-feature-grid">
            {c.included.map(([title, body], index) => {
              const Icon = includedIcons[index] ?? ShieldCheck;
              return (
                <li className="st-feature st-reveal" key={title}>
                  <span className="st-feature-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <StudioCta label={c.ctaLabel} title={c.ctaTitle} body={c.ctaBody}>
        <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {c.ctaPrimary}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <Link href={href("work")} prefetch={false} className="st-btn st-btn--ghost">
          {c.ctaSecondary}
        </Link>
      </StudioCta>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   YouTube
   ───────────────────────────────────────────────────────────────────────── */

const youtubeCopy = {
  en: {
    pill: "Arabic tech channel",
    title: "Arabic tech, explained *without* the noise.",
    lead: "Product reviews, tutorials, Android TV experiments and practical technology stories — in Arabic, from Germany, with a clear and honest voice.",
    subscribe: "Subscribe on YouTube",
    stats: ["Subscribers", "Total views", "Videos"],
    featuredLabel: "Featured",
    watch: "Watch on YouTube",
    views: "views",
    latestLabel: "Latest uploads",
    latestTitle: "Recent reviews and *practical* videos.",
    latestBody: "The newest uploads with their real publication dates.",
    topicsLabel: "What the channel covers",
    topicsTitle: "Four *lanes*, one standard.",
    topics: [
      ["Product reviews", "Honest Arabic reviews of useful tech, apps and devices — no disguised advertising."],
      ["Android TV", "MoPlayer, media setups, activation flows and TV-first experiences."],
      ["Creator tools", "Software, workflows and production tools that make digital work sharper."],
      ["Practical tutorials", "Clear explanations for people who want to learn and apply quickly."],
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
    featuredLabel: "فيديو مميز",
    watch: "شاهد على يوتيوب",
    views: "مشاهدة",
    latestLabel: "أحدث الفيديوهات",
    latestTitle: "آخر المراجعات والفيديوهات *العملية*.",
    latestBody: "أحدث الفيديوهات مع تواريخ نشرها الحقيقية.",
    topicsLabel: "ماذا تقدّم القناة",
    topicsTitle: "أربعة *مسارات*، ومعيار واحد.",
    topics: [
      ["مراجعات المنتجات", "مراجعات عربية صادقة للتقنية والتطبيقات والأجهزة المفيدة — بدون إعلانات مقنّعة."],
      ["Android TV", "MoPlayer، أنظمة الميديا، التفعيل، وتجارب التلفاز."],
      ["أدوات صنّاع المحتوى", "برامج وسير عمل وأدوات تجعل العمل الرقمي أكثر احترافاً."],
      ["شروحات عملية", "شرح واضح لمن يريد أن يتعلّم ويطبّق بسرعة."],
    ],
    ctaLabel: "@Moalfarras",
    ctaTitle: "تقنية *تحترم* وقتك.",
    ctaBody: "اشترك لمتابعة محتوى تقني عربي يساعدك على فهم ما هو مفيد فعلاً — أو تواصل معي بخصوص تعاون.",
    ctaSecondary: "ابدأ تعاوناً",
  },
} as const;

function YoutubePage({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const isAr = locale === "ar";
  const y = youtubeCopy[locale];
  const live = model.live.youtube;

  const latest = (
    live?.videos?.length
      ? live.videos.map((video) => ({ id: video.id, title: video.title, thumbnail: video.thumbnail, views: video.views, publishedAt: video.publishedAt }))
      : model.latestVideos.map((video) => ({
          id: video.youtube_id,
          title: isAr ? video.title_ar : video.title_en,
          thumbnail: video.thumbnail,
          views: video.views,
          publishedAt: video.published_at,
        }))
  ).filter((video) => video.id);
  const popular = live?.popularVideos?.[0];
  const spotlight = popular
    ? { id: popular.id, title: popular.title, thumbnail: popular.thumbnail, views: popular.views, publishedAt: popular.publishedAt }
    : latest[0];
  const rest = latest.filter((video) => video.id !== spotlight?.id).slice(0, 6);
  // Keep the grid in complete rows of three.
  const grid = rest.length > 3 ? rest.slice(0, Math.floor(rest.length / 3) * 3) : rest;

  const stats = [
    compact(locale, live?.subscribers ?? model.youtube.subscribers, youtubeChannel.fallback.subscribers),
    compact(locale, live?.totalViews ?? model.youtube.views, youtubeChannel.fallback.views),
    compact(locale, live?.videoCount ?? model.youtube.videos, youtubeChannel.fallback.videos),
  ];
  const nf = new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" });
  const formatDate = (value?: string) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? dateFmt.format(date) : "";
  };
  const watchUrl = (id?: string) => (id ? `https://www.youtube.com/watch?v=${id}` : socialLinks.youtube);
  const handle = model.youtube.handle || live?.channelHandle || youtubeChannel.handle;

  return (
    <div className="st-page">
      <PageHero
        pill={y.pill}
        title={y.title}
        lead={y.lead}
        aside={
          <dl className="st-stats st-stats--stack">
            {stats.map((value, index) => (
              <div key={y.stats[index]}>
                <dt>{y.stats[index]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        }
      >
        <div className="st-actions">
          <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--primary">
            <PlayCircle size={18} aria-hidden />
            {y.subscribe}
          </a>
          <span className="st-handle">
            <span className="st-handle-avatar">
              <Image src="/images/logo.png" alt="" width={28} height={28} />
            </span>
            <bdi>{handle}</bdi>
          </span>
        </div>
      </PageHero>

      {spotlight?.thumbnail ? (
        <section className="st-section st-section--tight">
          <div className="st-container">
            <a className="st-spotlight st-reveal" href={watchUrl(spotlight.id)} target="_blank" rel="noopener noreferrer">
              <span className="st-spotlight-media">
                <Image src={spotlight.thumbnail} alt="" fill sizes="(max-width: 900px) 92vw, 760px" quality={70} className="st-cover" />
                <span className="st-video-play" aria-hidden="true">
                  <PlayCircle />
                </span>
              </span>
              <span className="st-spotlight-copy">
                <span className="st-meta st-mono">{y.featuredLabel}</span>
                <span className="st-spotlight-title">{spotlight.title}</span>
                <span className="st-video-meta">
                  {Number(spotlight.views) > 0 ? `${nf.format(Number(spotlight.views))} ${y.views}` : null}
                  {formatDate(spotlight.publishedAt) ? (
                    <>
                      <CalendarDays size={13} aria-hidden /> {formatDate(spotlight.publishedAt)}
                    </>
                  ) : null}
                </span>
                <span className="st-link">
                  {y.watch}
                  <ArrowUpRight size={15} aria-hidden />
                </span>
              </span>
            </a>
          </div>
        </section>
      ) : null}

      {grid.length ? (
        <section className="st-section">
          <div className="st-container">
            <SectionIntro
              index="01"
              label={y.latestLabel}
              title={y.latestTitle}
              body={y.latestBody}
              action={{ href: socialLinks.youtube, label: "YouTube", external: true }}
            />
            <ul className="st-video-grid">
              {grid.map((video) => (
                <li key={video.id} className="st-reveal">
                  <a href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer" className="st-video">
                    <span className="st-video-thumb">
                      {video.thumbnail ? <Image src={video.thumbnail} alt="" fill sizes="(max-width: 700px) 92vw, 380px" quality={65} className="st-cover" /> : null}
                      <span className="st-video-play" aria-hidden="true">
                        <PlayCircle />
                      </span>
                    </span>
                    <span className="st-video-title">{video.title}</span>
                    <span className="st-video-meta">
                      {Number(video.views) > 0 ? `${nf.format(Number(video.views))} ${y.views}` : null}
                      {Number(video.views) > 0 && formatDate(video.publishedAt) ? " · " : null}
                      {formatDate(video.publishedAt)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="02" label={y.topicsLabel} title={y.topicsTitle} />
          <ol className="st-index">
            {y.topics.map(([title, body], index) => (
              <li className="st-index-row st-index-row--compact st-reveal" key={title}>
                <span className="st-index-num st-mono" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="st-index-text">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <StudioCta label={y.ctaLabel} title={y.ctaTitle} body={y.ctaBody}>
        <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--primary st-btn--lg">
          <PlayCircle size={18} aria-hidden />
          {y.subscribe}
        </a>
        <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--ghost">
          {y.ctaSecondary}
        </Link>
      </StudioCta>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   About
   ───────────────────────────────────────────────────────────────────────── */

const aboutCopy = {
  en: {
    pill: "About",
    title: "A builder shaped by *real* operations.",
    lead: "I am Mohammad Alfarras — from Al-Hasakah, Syria, living in Germany since 2015. I design and build websites and digital products, ship my own apps, and explain technology in Arabic on YouTube.",
    story: [
      "My path started with a practical question: how can complicated work become clearer, faster and less chaotic? It followed me from production floors and logistics dispatch into interfaces and systems.",
      "Germany taught me that discipline, language and reliability are not side details — they are part of the product. So I treat a website or an app as a complete system, not a pretty screen.",
      "Today I combine logistics thinking, web development, Arabic tech content and my own products — MoPlayer and MoOS — to build digital experiences people understand and trust.",
    ],
    languagesLabel: "Languages",
    principlesLabel: "How I work",
    routeLabel: "The route",
    routeTitle: "Where the *discipline* comes from.",
    cv: "Read the full CV",
    contact: "Get in touch",
    ctaLabel: "Say hello",
    ctaTitle: "Let's talk about your *project*.",
    ctaBody: "Websites, landing pages, product pages or a second opinion — send a message in Arabic, German or English.",
  },
  ar: {
    pill: "نبذة عني",
    title: "مطوّر صقلته سنوات العمل *على أرض الواقع*.",
    lead: "أنا محمد الفراس — من الحسكة في سوريا، وأعيش في ألمانيا منذ 2015. أصمّم وأبني المواقع والمنتجات الرقمية، أطلق تطبيقاتي الخاصة، وأشرح التقنية بالعربية على يوتيوب.",
    story: [
      "بدأت رحلتي بسؤال عملي: كيف نجعل العمل المعقّد أوضح وأسرع وأقل فوضى؟ رافقني هذا السؤال من أرض الإنتاج ومكاتب الديسبوزيشن إلى بناء الواجهات والأنظمة.",
      "في ألمانيا تعلّمت أن الانضباط واللغة والموثوقية ليست تفاصيل جانبية، بل جزء من المنتج نفسه. لذلك أتعامل مع الموقع أو التطبيق كنظام كامل، لا كشاشة جميلة فقط.",
      "اليوم أجمع بين عقلية اللوجستيات، تطوير الويب، المحتوى التقني العربي، ومنتجاتي الخاصة — MoPlayer وMoOS — لأبني تجارب رقمية يفهمها الناس ويثقون بها.",
    ],
    languagesLabel: "اللغات",
    principlesLabel: "مبادئ العمل",
    routeLabel: "المسار",
    routeTitle: "من أين يأتي *الانضباط*.",
    cv: "اقرأ السيرة الكاملة",
    contact: "تواصل معي",
    ctaLabel: "لنتحدث",
    ctaTitle: "احكِ لي عن *مشروعك*.",
    ctaBody: "مواقع، صفحات هبوط، صفحات منتجات، أو رأي ثانٍ — راسلني بالعربية أو الألمانية أو الإنجليزية.",
  },
} as const;

function AboutPage({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const isAr = locale === "ar";
  const a = aboutCopy[locale];
  const href = (path: string) => withLocale(locale, path);
  const principles = cvPageCopy[locale].principles;

  return (
    <div className="st-page">
      <PageHero
        pill={a.pill}
        title={a.title}
        lead={a.lead}
        aside={
          <figure className="st-portrait st-portrait--small">
            <Image src="/images/portrait.jpg" alt={isAr ? "صورة محمد الفراس" : "Portrait of Mohammad Alfarras"} fill preload sizes="(max-width: 900px) 80vw, 360px" quality={70} className="st-portrait-img" />
          </figure>
        }
      >
        <div className="st-actions">
          <Link href={href("cv")} prefetch={false} className="st-btn st-btn--primary">
            {a.cv}
            <ArrowUpRight size={18} aria-hidden />
          </Link>
          <Link href={href("contact")} prefetch={false} className="st-btn st-btn--ghost">
            {a.contact}
          </Link>
        </div>
      </PageHero>

      <section className="st-section">
        <div className="st-container st-about">
          <div className="st-prose">
            {a.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <aside className="st-about-side">
            <div>
              <p className="st-meta st-mono">{a.languagesLabel}</p>
              <ul className="st-lang-list">
                {languageLevels[locale].map((language) => (
                  <li key={language.id}>
                    <strong>{language.label}</strong>
                    <span>{language.level}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="st-meta st-mono">{a.principlesLabel}</p>
              <ul className="st-check-list">
                {principles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="st-section">
        <div className="st-container">
          <SectionIntro index="01" label={a.routeLabel} title={a.routeTitle} />
          <RouteTrack steps={routeSteps[locale]} nowFrom={4} />
        </div>
      </section>

      <StudioCta label={a.ctaLabel} title={a.ctaTitle} body={a.ctaBody}>
        <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {a.contact}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--ghost">
          <MessageCircle size={17} aria-hidden />
          WhatsApp
        </a>
        <a href={`mailto:${socialLinks.email}`} className="st-btn st-btn--ghost">
          <Mail size={17} aria-hidden />
          {isAr ? "البريد" : "Email"}
        </a>
      </StudioCta>
    </div>
  );
}

export function DigitalOsPage({ model }: { model: SiteViewModel }) {
  switch (model.pageSlug) {
    case "services":
      return <ServicesPage model={model} />;
    case "youtube":
      return <YoutubePage model={model} />;
    case "about":
      return <AboutPage model={model} />;
    case "home":
    default:
      return <HomePage model={model} />;
  }
}
