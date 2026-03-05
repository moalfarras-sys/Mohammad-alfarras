import Link from "next/link";

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
import { WorkShowcase } from "@/components/site/work-showcase";

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
      return {
        id: entry.id,
        title: tr?.title ?? entry.id,
        description: tr?.description ?? "",
        bullets: tr?.bullets_json ?? [],
        icon: entry.icon,
        colorToken: entry.color_token,
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

function renderItems(items: unknown[]) {
  if (!items.length) return null;
  return (
    <ul className="item-grid">
      {items.map((item, index) => (
        <li className="card" key={`${index}-${String(item)}`}>
          {String(item)}
        </li>
      ))}
    </ul>
  );
}

export function BlockRenderer({ block, locale, snapshot }: { block: PageBlockView; locale: Locale; snapshot: CmsSnapshot }) {
  if (!block.enabled) return null;

  const title = String(block.content.title ?? "");
  const body = String(block.content.text ?? block.content.body ?? block.content.subtitle ?? "");
  const cta = block.content.cta as { href?: string; label?: string } | undefined;
  const primaryCta = block.content.primaryCta as { href?: string; label?: string } | undefined;
  const secondaryCta = block.content.secondaryCta as { href?: string; label?: string } | undefined;

  if (block.type === "work-showcase") {
    return <WorkShowcase locale={locale} projects={getProjectViews(snapshot, locale)} title={title} body={body} />;
  }

  if (block.type === "experience-timeline") {
    const experiences = getExperienceViews(snapshot, locale);
    return (
      <section className="page-section">
        <div className="container section-stack">
          {title ? <h2>{title}</h2> : null}
          {body ? <p>{body}</p> : null}
          <div className="admin-columns-2">
            {experiences.map((item) => (
              <article className="card" key={item.id}>
                <h3>{item.roleTitle}</h3>
                <p>{item.company} - {item.location}</p>
                <p>{item.startDate} - {item.currentRole ? (locale === "ar" ? "حتى الآن" : "Present") : item.endDate}</p>
                <p>{item.description}</p>
                {item.highlights.length ? (
                  <ul>
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
          <div className="admin-columns-2">
            {certifications.map((item) => (
              <article className="card" key={item.id}>
                <h3>{item.name}</h3>
                <p>{item.issuer}</p>
                <p>{item.issueDate}</p>
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
          {title ? <h2>{title}</h2> : null}
          {body ? <p>{body}</p> : null}
          <div className="admin-columns-2">
            {services.map((item) => (
              <article className="card" key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.bullets.length ? (
                  <ul>
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
          {title ? <h2>{title}</h2> : null}
          {body ? <p>{body}</p> : null}
          <div className="contact-list contact-panel">
            {channels.map((channel) => (
              <a key={channel.id} className={`btn ${channel.isPrimary ? "primary" : "secondary"}`} href={channel.value} target="_blank" rel="noreferrer noopener">
                {channel.label}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === "videos") {
    const videos = snapshot.youtube_videos.filter((video) => video.is_active).sort((a, b) => a.sort_order - b.sort_order);
    return (
      <section className="page-section">
        <div className="container section-stack">
          {title ? <h2>{title}</h2> : null}
          {body ? <p>{body}</p> : null}
          <div className="video-grid item-grid">
            {videos.map((video) => (
              <article className="card video-card" key={video.id}>
                <img src={video.thumbnail} alt={locale === "ar" ? video.title_ar : video.title_en} loading="lazy" />
                <h3>{locale === "ar" ? video.title_ar : video.title_en}</h3>
                <p>{locale === "ar" ? video.description_ar : video.description_en}</p>
                <a
                  className="btn secondary"
                  target="_blank"
                  rel="noreferrer noopener"
                  href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                >
                  YouTube
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
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
      <div className={`container section-stack ${block.type === "hero" ? "hero-stack" : ""}`}>
        {title ? <h2 className={block.type === "hero" ? "hero-title" : ""}>{title}</h2> : null}
        {body ? <p className={block.type === "hero" ? "hero-body" : ""}>{body}</p> : null}
        {renderItems(genericItems)}

        {(primaryCta || secondaryCta) ? (
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
