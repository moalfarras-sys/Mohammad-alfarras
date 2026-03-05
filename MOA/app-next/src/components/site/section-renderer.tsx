import Link from "next/link";

import type { Locale, SectionView } from "@/types/cms";

function renderList(content: Record<string, unknown>) {
  const items = Array.isArray(content.items) ? content.items : Array.isArray(content.cards) ? content.cards : [];
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

export function SectionRenderer({ locale, section }: { locale: Locale; section: SectionView }) {
  const title = String(section.content.title ?? "");
  const body = String(section.content.text ?? section.content.body ?? section.content.subtitle ?? "");
  const cta = section.content.cta as { href?: string; label?: string } | undefined;
  const primaryCta = section.content.primaryCta as { href?: string; label?: string } | undefined;
  const secondaryCta = section.content.secondaryCta as { href?: string; label?: string } | undefined;

  if (!section.enabled) return null;

  const isHero = section.type === "hero";
  const isFeatureGrid = section.type === "feature-grid";
  const isCards = section.type === "cards";
  const isContactGrid = section.type === "contact-grid";
  const isRichText = section.type === "rich-text";

  return (
    <section className={`page-section section-${section.type}`} data-section-type={section.type}>
      <div className={`container section-stack ${isHero ? "hero-stack" : ""}`}>
        {title ? <h2 className={isHero ? "hero-title" : ""}>{title}</h2> : null}
        {body ? <p className={isHero ? "hero-body" : ""}>{body}</p> : null}
        {renderList(section.content)}

        {isFeatureGrid ? (
          <div className="pill-row">
            <span className="pill">{locale === "ar" ? "أداء" : "Performance"}</span>
            <span className="pill">{locale === "ar" ? "استقرار" : "Stability"}</span>
            <span className="pill">{locale === "ar" ? "إبداع" : "Creativity"}</span>
          </div>
        ) : null}

        {isCards ? (
          <div className="highlight-note">
            {locale === "ar"
              ? "تحديث المحتوى يتم من لوحة التحكم مباشرة."
              : "Content updates are managed directly from admin."}
          </div>
        ) : null}

        {isRichText ? <div className="rich-divider" /> : null}

        {(primaryCta || secondaryCta) && (
          <div className="actions-row">
            {primaryCta?.href && primaryCta.label ? (
              <Link href={primaryCta.href} className="btn primary">
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta?.href && secondaryCta.label ? (
              <Link href={secondaryCta.href} className="btn secondary">
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        )}

        {cta?.href && cta.label ? (
          <Link href={cta.href} className="btn primary">
            {cta.label}
          </Link>
        ) : null}

        {section.key === "channels" ? (
          <div className={`contact-list ${isContactGrid ? "contact-panel" : ""}`}>
            <span>{locale === "ar" ? "البريد" : "Email"}: {String(section.content.email ?? "")}</span>
            <span>{locale === "ar" ? "الهاتف" : "Phone"}: {String(section.content.phone ?? "")}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
