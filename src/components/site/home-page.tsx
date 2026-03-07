import Image from "next/image";
import Link from "next/link";

import type { CmsSnapshot, Locale, PageView, YoutubeVideo } from "@/types/cms";

import { findBlock, getChannels, getGallery, getPortrait, getProjects, getServices, getVideoStats } from "./cms-views";

function compact(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function HomePage({
  locale,
  page,
  snapshot,
  videos,
}: {
  locale: Locale;
  page: PageView;
  snapshot: CmsSnapshot;
  videos: YoutubeVideo[];
}) {
  const hero = findBlock(page, "hero");
  const features = findBlock(page, "feature-grid");
  const galleryBlock = findBlock(page, "media-gallery");
  const contactCta = findBlock(page, "cta");
  const projects = getProjects(snapshot, locale).slice(0, 3);
  const services = getServices(snapshot, locale);
  const channels = getChannels(snapshot, locale).slice(0, 6);
  const gallery = getGallery(snapshot, galleryBlock).slice(0, 8);
  const portrait = getPortrait(snapshot, locale);
  const latestVideos = videos.filter((video) => video.is_active).slice(0, 4);
  const stats = getVideoStats(videos);

  const heroTitle = String(hero?.content.title ?? (locale === "ar" ? "محمد الفراس" : "Mohammad Alfarras"));
  const heroBody = String(
    hero?.content.body ??
      (locale === "ar"
        ? "من الحسكة إلى ألمانيا ثم إلى الشاشة. هنا تجد محتوى تقني صادق، خبرة لوجستية عملية، ومواقع واضحة الهوية."
        : "From Al-Hasakah to Germany and onto the screen. Honest tech content, real logistics experience, and websites with a clear identity."),
  );

  const featureItems = Array.isArray(features?.content.items) ? features.content.items.map(String) : [];

  const tags =
    locale === "ar"
      ? ["صناعة محتوى", "مراجعات وتجارب", "خدمات رقمية", "لوجستيات ونقل", "تعاونات وشراكات"]
      : ["Content creation", "Hands-on reviews", "Digital services", "Logistics", "Brand collaborations"];

  const identityCards =
    locale === "ar"
      ? [
          {
            title: "محتوى تقني يبدأ من التجربة",
            body: "أفتح الصندوق، أجرّب المنتج كما يستخدمه الناس فعلاً، ثم أعرض المميزات والعيوب بدون مبالغة.",
          },
          {
            title: "تشغيل يومي من أرض الواقع",
            body: "خبرتي في اللوجستيات تعني أنني أفهم السرعة، الضغط، واتخاذ القرار العملي عندما تكون التفاصيل هي كل شيء.",
          },
          {
            title: "موقع أو خدمة رقمية بهوية واضحة",
            body: "أحوّل الفكرة إلى صفحة أو موقع واضح وسريع وسهل الفهم، من غير فوضى ولا تصميم عام بلا شخصية.",
          },
        ]
      : [
          {
            title: "Tech content that starts with the real test",
            body: "I unbox, test products in realistic conditions, and explain the strengths and tradeoffs without hype.",
          },
          {
            title: "Daily operations from the ground",
            body: "My logistics work means I understand speed, pressure, and practical decision-making when details matter.",
          },
          {
            title: "Digital execution with a clear identity",
            body: "I turn an idea into a sharp website or landing page that feels intentional, fast, and easy to understand.",
          },
        ];

  const primaryCta = (hero?.content.primaryCta as { href?: string; label?: string } | undefined) ?? {
    href: `/${locale}/contact`,
    label: locale === "ar" ? "ابدأ مشروعك" : "Start your project",
  };
  const secondaryCta = (hero?.content.secondaryCta as { href?: string; label?: string } | undefined) ?? {
    href: `/${locale}/youtube`,
    label: locale === "ar" ? "قناة يوتيوب" : "YouTube channel",
  };

  return (
    <div className="premium-page">
      <section className="hero-stage">
        <div className="container hero-stage-grid">
          <div className="hero-stage-copy glass-card">
            <span className="section-kicker">
              {locale === "ar" ? "من الحسكة، عبر أوروبا، إلى الشاشات" : "From Al-Hasakah, through Europe, onto the screen"}
            </span>
            <h1 className="display-title">{heroTitle}</h1>
            <p className="hero-lead">{heroBody}</p>
            <p>
              {locale === "ar"
                ? "إذا جئت لتستمتع، لتقرر ماذا تشتري، أو لأنك تبحث عن شخص يفهم التشغيل والمحتوى والمواقع معاً، فهذا هو المكان الصحيح."
                : "Whether you are here to enjoy the content, decide what to buy, or work with someone who understands operations, content, and websites together, this is the right place."}
            </p>

            <div className="hero-action-row">
              {primaryCta.href && primaryCta.label ? (
                <Link href={primaryCta.href} className="btn primary">
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta.href && secondaryCta.label ? (
                <Link href={secondaryCta.href} className="btn secondary">
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>

            <div className="pillars-grid">
              {tags.map((tag) => (
                <article key={tag} className="glass-card pillar-card">
                  <span className="pillar-mark">✦</span>
                  <p>{tag}</p>
                </article>
              ))}
            </div>

            <div className="hero-stat-grid">
              <article className="hero-stat-card">
                <strong>{compact(locale, videos.length)}</strong>
                <span>{locale === "ar" ? "فيديو على القناة" : "videos on the channel"}</span>
              </article>
              <article className="hero-stat-card">
                <strong>{compact(locale, stats.totalViews)}</strong>
                <span>{locale === "ar" ? "مشاهدة تراكمية" : "cumulative views"}</span>
              </article>
              <article className="hero-stat-card">
                <strong>{projects.length}</strong>
                <span>{locale === "ar" ? "مشاريع معروضة" : "featured projects"}</span>
              </article>
              <article className="hero-stat-card">
                <strong>{services.length}</strong>
                <span>{locale === "ar" ? "مسارات خدمة" : "service tracks"}</span>
              </article>
            </div>
          </div>

          <aside className="hero-stage-visual glass-card">
            {portrait ? (
              <div className="portrait-shell">
                <div className="portrait-glow-ring" />
                <div className="portrait-frame">
                  <Image
                    src={portrait.path}
                    alt={locale === "ar" ? portrait.alt_ar : portrait.alt_en}
                    width={portrait.width}
                    height={portrait.height}
                    priority
                    sizes="(max-width: 768px) 70vw, 32rem"
                    className="portrait-image"
                  />
                </div>
                <div className="portrait-caption">
                  <strong>Mohammad Alfarras</strong>
                  <span>{locale === "ar" ? "لوجستيات · محتوى تقني · مواقع" : "Logistics · Tech Content · Websites"}</span>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {featureItems.length ? (
        <section className="page-section">
          <div className="container section-stack">
            <div className="section-heading">
              <span className="section-kicker">{locale === "ar" ? "ما يميز هذه المساحة" : "What defines this space"}</span>
              <h2>{locale === "ar" ? "قيمة عملية وليست شعارات" : "Practical value, not empty claims"}</h2>
            </div>
            <div className="feature-card-grid">
              {featureItems.map((item) => (
                <article key={item} className="glass-card service-rich-card">
                  <h3>{item}</h3>
                  <p>
                    {locale === "ar"
                      ? "هذا الجزء ليس وصفاً عاماً، بل شيء أمارسه فعلياً في العمل أو المحتوى أو بناء الصفحات."
                      : "This is not generic branding copy. It reflects something I actually do in operations, content, or digital delivery."}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "الهوية" : "Identity"}</span>
            <h2>{locale === "ar" ? "ثلاث طبقات تصنع أسلوب العمل" : "Three layers define the work style"}</h2>
          </div>
          <div className="feature-card-grid">
            {identityCards.map((card) => (
              <article key={card.title} className="glass-card service-rich-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "نماذج من شغلي" : "Selected work"}</span>
            <h2>{locale === "ar" ? "مشاريع تعكس التنفيذ الحقيقي" : "Projects that reflect real delivery"}</h2>
            <p>
              {locale === "ar"
                ? "مواقع وخدمات رقمية منشورة تُظهر كيف أترجم الفكرة إلى نتيجة واضحة، سريعة، وقابلة للاستخدام."
                : "Published websites and digital services that show how an idea turns into a clear, fast, usable result."}
            </p>
          </div>

          <div className="feature-card-grid">
            {projects.map((project) => (
              <article key={project.id} className="glass-card project-spotlight-card">
                {project.cover ? (
                  <div className="card-media-shell">
                    <Image
                      src={project.cover.path}
                      alt={locale === "ar" ? project.cover.alt_ar : project.cover.alt_en}
                      width={project.cover.width}
                      height={project.cover.height}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="card-media"
                    />
                  </div>
                ) : null}
                <div className="project-spotlight-body">
                  <h3>{project.title}</h3>
                  <p className="muted">{project.summary}</p>
                  <p>{project.description}</p>
                  <div className="actions-row">
                    {project.projectUrl ? (
                      <a href={project.projectUrl} className="btn secondary" target="_blank" rel="noreferrer noopener">
                        {project.ctaLabel}
                      </a>
                    ) : null}
                    {project.repoUrl ? (
                      <a href={project.repoUrl} className="btn ghost" target="_blank" rel="noreferrer noopener">
                        GitHub
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "الخدمات" : "Services"}</span>
            <h2>{locale === "ar" ? "ماذا أقدم اليوم؟" : "What I deliver today"}</h2>
          </div>

          <div className="feature-card-grid">
            {services.map((service) => (
              <article key={service.id} className="glass-card service-rich-card">
                {service.cover ? (
                  <div className="card-media-shell">
                    <Image
                      src={service.cover.path}
                      alt={locale === "ar" ? service.cover.alt_ar : service.cover.alt_en}
                      width={service.cover.width}
                      height={service.cover.height}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="card-media"
                    />
                  </div>
                ) : null}
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {service.bullets.length ? (
                  <ul className="bullet-list">
                    {service.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {gallery.length ? (
        <section className="page-section">
          <div className="container section-stack">
            <div className="section-heading">
              <span className="section-kicker">{locale === "ar" ? "المعرض" : "Gallery"}</span>
              <h2>
                {String(
                  galleryBlock?.content.title ??
                    (locale === "ar" ? "لمحات من الرحلة والمحتوى" : "Moments from the journey and the content"),
                )}
              </h2>
              <p>{String(galleryBlock?.content.body ?? "")}</p>
            </div>
            <div className="visual-gallery-grid">
              {gallery.map((item) => (
                <article key={item.id} className="visual-gallery-card">
                  <Image
                    src={item.path}
                    alt={locale === "ar" ? item.alt_ar : item.alt_en}
                    width={item.width}
                    height={item.height}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="visual-gallery-image"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {latestVideos.length ? (
        <section className="page-section">
          <div className="container section-stack">
            <div className="section-heading">
              <span className="section-kicker">{locale === "ar" ? "يوتيوب" : "YouTube"}</span>
              <h2>{locale === "ar" ? "أحدث الفيديوهات من القناة" : "Latest channel uploads"}</h2>
              <p>
                {locale === "ar"
                  ? "مراجعات، تطبيقات، منزل ذكي، وتجارب عملية من القناة الرسمية. الصفحة الآن تعتمد على أرشيف القناة الحقيقي كلما كان متاحاً."
                  : "Reviews, apps, smart-home setups, and practical videos from the official channel. The page now uses the real public channel catalog whenever available."}
              </p>
            </div>
            <div className="feature-card-grid">
              {latestVideos.map((video) => (
                <article key={video.id} className="glass-card video-teaser-card">
                  <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer noopener" className="card-media-shell">
                    <Image
                      src={video.thumbnail}
                      alt={locale === "ar" ? video.title_ar : video.title_en}
                      width={480}
                      height={270}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="card-media"
                    />
                  </a>
                  <h3>{locale === "ar" ? video.title_ar : video.title_en}</h3>
                  <p>{locale === "ar" ? video.description_ar : video.description_en}</p>
                  <div className="meta-inline">
                    <span>{video.duration}</span>
                    <span>{compact(locale, video.views)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-section">
        <div className="container">
          <div className="glass-card contact-band">
            <div>
              <span className="section-kicker">{locale === "ar" ? "تواصل" : "Contact"}</span>
              <h2>
                {String(
                  contactCta?.content.title ??
                    (locale === "ar" ? "جاهز لتعاون واضح ومحترف" : "Ready for a clear professional collaboration"),
                )}
              </h2>
              <p>
                {String(
                  contactCta?.content.body ??
                    (locale === "ar"
                      ? "كل القنوات الأساسية موجودة هنا لتبدأ بشكل سريع ومباشر."
                      : "Your main direct channels are here so we can start quickly."),
                )}
              </p>
            </div>
            <div className="contact-band-links">
              {channels.map((channel) => (
                <a key={channel.id} href={channel.value} target="_blank" rel="noreferrer noopener" className="contact-band-link">
                  <span>{channel.label}</span>
                  <small>{channel.description}</small>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
