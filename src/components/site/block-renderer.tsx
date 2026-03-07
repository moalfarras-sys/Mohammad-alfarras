import Image from "next/image";
import Link from "next/link";

import { WorkShowcase } from "@/components/site/work-showcase";
import { YoutubeGrid } from "@/components/site/youtube-grid";
import type {
  CertificationView,
  CmsSnapshot,
  ContactChannelView,
  ExperienceView,
  Locale,
  PageBlockView,
  ServiceView,
  WorkProjectView,
} from "@/types/cms";

function getProjectViews(snapshot: CmsSnapshot, locale: Locale): WorkProjectView[] {
  return snapshot.work_projects
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.work_project_translations.find((item) => item.project_id === entry.id && item.locale === locale);
      const cover = entry.cover_media_id
        ? snapshot.media_assets.find((item) => item.id === entry.cover_media_id) ?? null
        : null;
      return {
        id: entry.id,
        slug: entry.slug,
        title: tr?.title ?? entry.slug,
        summary: tr?.summary ?? "",
        description: tr?.description ?? "",
        ctaLabel: tr?.cta_label ?? "Open",
        projectUrl: entry.project_url,
        repoUrl: entry.repo_url,
        cover,
        order: entry.sort_order,
      };
    });
}

function getExperienceViews(snapshot: CmsSnapshot, locale: Locale): ExperienceView[] {
  return snapshot.experiences
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.experience_translations.find((item) => item.experience_id === entry.id && item.locale === locale);
      const logo = entry.logo_media_id ? snapshot.media_assets.find((item) => item.id === entry.logo_media_id) ?? null : null;
      return {
        id: entry.id,
        roleTitle: tr?.role_title ?? "",
        company: entry.company,
        location: entry.location,
        startDate: entry.start_date,
        endDate: entry.end_date,
        currentRole: entry.current_role,
        description: tr?.description ?? "",
        highlights: tr?.highlights_json ?? [],
        logo,
        order: entry.sort_order,
      };
    });
}

function getCertificationViews(snapshot: CmsSnapshot, locale: Locale): CertificationView[] {
  return snapshot.certifications
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.certification_translations.find((item) => item.certification_id === entry.id && item.locale === locale);
      const certificate = entry.certificate_media_id
        ? snapshot.media_assets.find((item) => item.id === entry.certificate_media_id) ?? null
        : null;
      return {
        id: entry.id,
        name: tr?.name ?? entry.issuer,
        description: tr?.description ?? "",
        issuer: entry.issuer,
        issueDate: entry.issue_date,
        expiryDate: entry.expiry_date,
        credentialUrl: entry.credential_url,
        certificate,
        order: entry.sort_order,
      };
    });
}

function getServiceViews(snapshot: CmsSnapshot, locale: Locale): ServiceView[] {
  return snapshot.service_offerings
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.service_offering_translations.find((item) => item.service_id === entry.id && item.locale === locale);
      const cover = entry.cover_media_id
        ? snapshot.media_assets.find((item) => item.id === entry.cover_media_id) ?? null
        : null;
      return {
        id: entry.id,
        title: tr?.title ?? entry.id,
        description: tr?.description ?? "",
        bullets: tr?.bullets_json ?? [],
        icon: entry.icon,
        colorToken: entry.color_token,
        cover,
        order: entry.sort_order,
      };
    });
}

function getChannelViews(snapshot: CmsSnapshot, locale: Locale): ContactChannelView[] {
  return snapshot.contact_channels
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.contact_channel_translations.find((item) => item.channel_id === entry.id && item.locale === locale);
      return {
        id: entry.id,
        type: entry.channel_type,
        label: tr?.label ?? entry.label_default,
        description: tr?.description ?? "",
        value: entry.value,
        icon: entry.icon,
        isPrimary: entry.is_primary,
        order: entry.sort_order,
      };
    });
}

function iconByType(type: string) {
  switch (type) {
    case "whatsapp":
      return "💬";
    case "email":
      return "✉️";
    case "linkedin":
      return "💼";
    case "telegram":
      return "📨";
    case "instagram":
      return "📸";
    case "youtube":
      return "▶️";
    default:
      return "🔗";
  }
}

function portraitFromSnapshot(snapshot: CmsSnapshot, locale: Locale) {
  const portrait = snapshot.media_assets.find((item) => item.path.includes("portrait")) ?? snapshot.media_assets[0] ?? null;
  if (!portrait) return null;
  return {
    src: portrait.path,
    alt: locale === "ar" ? portrait.alt_ar : portrait.alt_en,
    width: portrait.width || 960,
    height: portrait.height || 1200,
  };
}

function getGalleryMedia(snapshot: CmsSnapshot, block: PageBlockView) {
  const selectedIds = Array.isArray(block.content.items)
    ? block.content.items.map((entry) => String(entry))
    : [];
  const selected = selectedIds.length
    ? snapshot.media_assets.filter((asset) => selectedIds.includes(asset.id))
    : snapshot.media_assets.filter((asset) => asset.path.startsWith("/images/"));

  return selected.filter((asset) => !asset.path.endsWith(".svg"));
}

function renderItems(items: unknown[]) {
  if (!items.length) return null;
  return (
    <ul className="item-grid">
      {items.map((item, index) => (
        <li className="card glass-card" key={`${index}-${String(item)}`}>
          {String(item)}
        </li>
      ))}
    </ul>
  );
}

function isRenderableImage(path?: string | null) {
  if (!path) return false;
  return path.startsWith("/") || path.startsWith("https://");
}

export function BlockRenderer({ block, locale, snapshot }: { block: PageBlockView; locale: Locale; snapshot: CmsSnapshot }) {
  if (!block.enabled) return null;

  const title = String(block.content.title ?? "");
  const body = String(block.content.text ?? block.content.body ?? block.content.subtitle ?? "");
  const cta = block.content.cta as { href?: string; label?: string } | undefined;
  const primaryCta = block.content.primaryCta as { href?: string; label?: string } | undefined;
  const secondaryCta = block.content.secondaryCta as { href?: string; label?: string } | undefined;

  if (block.type === "hero") {
    const portrait = portraitFromSnapshot(snapshot, locale);

    return (
      <section className="page-section section-hero" data-block-type="hero">
        <div className="container section-stack hero-stack">
          <div className="hero-layout">
            <div className="hero-content">
              {title ? <h1 className="hero-title">{title}</h1> : null}
              {body ? <p className="hero-body">{body}</p> : null}

              {primaryCta || secondaryCta || cta ? (
                <div className="actions-row">
                  {primaryCta?.href && primaryCta.label ? <Link href={primaryCta.href} className="btn primary">{primaryCta.label}</Link> : null}
                  {secondaryCta?.href && secondaryCta.label ? <Link href={secondaryCta.href} className="btn secondary">{secondaryCta.label}</Link> : null}
                  {cta?.href && cta.label ? <Link href={cta.href} className="btn ghost">{cta.label}</Link> : null}
                </div>
              ) : null}
            </div>

            {portrait && isRenderableImage(portrait.src) ? (
              <aside className="hero-portrait-card glass-card">
                <div className="portrait-ring" />
                <Image src={portrait.src} alt={portrait.alt} width={portrait.width} height={portrait.height} className="portrait-image" priority={false} />
                <div className="signature-wrap">
                  <span className="signature-main">Mohammad Alfarras</span>
                  <span className="signature-sub">MOALFARRAS</span>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "work-showcase") {
    return <WorkShowcase locale={locale} projects={getProjectViews(snapshot, locale)} title={title} body={body} />;
  }

  if (block.type === "media-gallery") {
    const media = getGalleryMedia(snapshot, block);
    return (
      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            {title ? <h2>{title}</h2> : null}
            {body ? <p>{body}</p> : null}
          </div>
          <div className="media-gallery-grid">
            {media.filter((item) => isRenderableImage(item.path)).map((item, index) => (
              <article className="media-gallery-card glass-card" key={item.id} style={{ animationDelay: `${index * 60}ms` }}>
                <Image
                  src={item.path}
                  alt={locale === "ar" ? item.alt_ar : item.alt_en}
                  width={item.width || 1200}
                  height={item.height || 900}
                  loading="lazy"
                />
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "experience-timeline") {
    const experiences = getExperienceViews(snapshot, locale);
    return (
      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            {title ? <h2>{title}</h2> : null}
            {body ? <p>{body}</p> : null}
          </div>
          <div className="cards-grid two-col">
            {experiences.map((item, index) => (
              <article className="card glass-card" key={item.id} style={{ animationDelay: `${index * 70}ms` }}>
                <h3>{item.roleTitle}</h3>
                <p className="muted">{item.company} · {item.location}</p>
                <p className="muted">{item.startDate} - {item.currentRole ? (locale === "ar" ? "حتى الآن" : "Present") : item.endDate}</p>
                <p>{item.description}</p>
                {item.highlights.length ? (
                  <ul className="bullet-list">
                    {item.highlights.map((highlight, idx) => <li key={`${item.id}-h-${idx}`}>{highlight}</li>)}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "certifications-grid") {
    const certifications = getCertificationViews(snapshot, locale);
    return (
      <section className="page-section">
        <div className="container section-stack">
          {title ? <h2>{title}</h2> : null}
          <div className="cards-grid two-col">
            {certifications.map((item, index) => (
              <article className="card glass-card" key={item.id} style={{ animationDelay: `${index * 70}ms` }}>
                <h3>{item.name}</h3>
                <p className="muted">{item.issuer}</p>
                <p className="muted">{item.issueDate}</p>
                <p>{item.description}</p>
                {item.credentialUrl ? (
                  <a className="btn secondary" target="_blank" rel="noreferrer noopener" href={item.credentialUrl}>
                    {locale === "ar" ? "عرض الشهادة" : "View credential"}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "services-grid") {
    const services = getServiceViews(snapshot, locale);
    return (
      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            {title ? <h2>{title}</h2> : null}
            {body ? <p>{body}</p> : null}
          </div>
          <div className="cards-grid three-col">
            {services.map((item, index) => (
              <article className="card glass-card" key={item.id} style={{ animationDelay: `${index * 70}ms` }}>
                {item.cover && isRenderableImage(item.cover.path) ? (
                  <div className="work-media-wrap">
                    <Image
                      src={item.cover.path}
                      alt={locale === "ar" ? item.cover.alt_ar : item.cover.alt_en}
                      width={item.cover.width || 960}
                      height={item.cover.height || 960}
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.bullets.length ? (
                  <ul className="bullet-list">
                    {item.bullets.map((bullet, idx) => <li key={`${item.id}-b-${idx}`}>{bullet}</li>)}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "contact-channels") {
    const channels = getChannelViews(snapshot, locale);
    return (
      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            {title ? <h2>{title}</h2> : null}
            {body ? <p>{body}</p> : null}
          </div>
          <div className="cards-grid three-col">
            {channels.map((channel, index) => (
              <a
                key={channel.id}
                className={`card glass-card channel-card ${channel.isPrimary ? "is-primary" : ""}`}
                href={channel.value}
                target="_blank"
                rel="noreferrer noopener"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="channel-icon" aria-hidden="true">{iconByType(channel.type)}</span>
                <h3>{channel.label}</h3>
                <p>{channel.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "videos") {
    const videos = snapshot.youtube_videos.filter((video) => video.is_active).sort((a, b) => a.sort_order - b.sort_order);
    return <YoutubeGrid locale={locale} videos={videos} />;
  }

  const genericItems = Array.isArray(block.content.items)
    ? block.content.items
    : Array.isArray(block.content.cards)
      ? block.content.cards
      : Array.isArray(block.content.faq)
        ? block.content.faq
        : [];

  return (
    <section className={`page-section section-${block.type}`} data-block-type={block.type}>
      <div className="container section-stack">
        {title ? <h2>{title}</h2> : null}
        {body ? <p>{body}</p> : null}
        {renderItems(genericItems)}

        {primaryCta || secondaryCta ? (
          <div className="actions-row">
            {primaryCta?.href && primaryCta.label ? (
              <Link href={primaryCta.href} className="btn primary">{primaryCta.label}</Link>
            ) : null}
            {secondaryCta?.href && secondaryCta.label ? (
              <Link href={secondaryCta.href} className="btn secondary">{secondaryCta.label}</Link>
            ) : null}
          </div>
        ) : null}

        {cta?.href && cta.label ? (
          <Link href={cta.href} className="btn primary">{cta.label}</Link>
        ) : null}
      </div>
    </section>
  );
}
