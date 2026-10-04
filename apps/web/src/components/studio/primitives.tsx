import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Section header with the site's signature "route" motif: a mono index, a
 * label, and a thin line that runs to the edge and ends in a node — the same
 * language as a shipment-tracking line, which is where the owner comes from.
 */
export function SectionIntro({
  index,
  label,
  title,
  body,
  action,
  level = "h2",
  align = "start",
  className,
}: {
  index?: string;
  label: string;
  title: ReactNode;
  body?: ReactNode;
  action?: { href: string; label: string; external?: boolean };
  level?: "h1" | "h2";
  align?: "start" | "center";
  className?: string;
}) {
  const Heading = level;
  return (
    <header className={cn("st-intro", align === "center" && "st-intro--center", className)}>
      <div className="st-intro-route">
        {index ? <span className="st-intro-index" aria-hidden="true">{index}</span> : null}
        <span className="st-intro-label">{label}</span>
        <span className="st-intro-line" aria-hidden="true" />
      </div>
      <div className="st-intro-main">
        <div>
          <Heading className="st-h2">{typeof title === "string" ? <Accented text={title} /> : title}</Heading>
          {body ? <p className="st-intro-body">{body}</p> : null}
        </div>
        {action ? (
          action.external ? (
            <a className="st-link" href={action.href} target="_blank" rel="noopener noreferrer">
              {action.label}
              <ArrowUpRight size={16} aria-hidden />
            </a>
          ) : (
            <Link className="st-link" href={action.href} prefetch={false}>
              {action.label}
              <ArrowUpRight size={16} aria-hidden />
            </Link>
          )
        ) : null}
      </div>
    </header>
  );
}

/**
 * Renders `*phrase*` as the headline accent: a serif italic in Latin scripts,
 * the accent colour in Arabic (which has no italic tradition).
 */
export function Accented({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("*") && part.endsWith("*") ? <em key={index}>{part.slice(1, -1)}</em> : <span key={index}>{part}</span>,
      )}
    </>
  );
}

/** Inner-page hero: pill, h1 with optional accent, lead, and extra content. */
export function PageHero({
  pill,
  title,
  lead,
  children,
  aside,
  className,
}: {
  pill: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("st-page-hero", aside ? "st-page-hero--split" : undefined, className)}>
      <div className="st-container st-page-hero-inner">
        <div className="st-page-hero-copy">
          <p className="st-pill">
            <span className="st-pill-dot" aria-hidden="true" />
            {pill}
          </p>
          <h1 className="st-h1">
            <Accented text={title} />
          </h1>
          {lead ? <p className="st-lead">{lead}</p> : null}
          {children}
        </div>
        {aside ? <div className="st-page-hero-aside">{aside}</div> : null}
      </div>
    </section>
  );
}

/** The dotted tracking timeline. Steps from `nowFrom` on are highlighted. */
export function RouteTrack({ steps, nowFrom, columns }: { steps: ReadonlyArray<readonly [string, string, string]>; nowFrom?: number; columns?: number }) {
  return (
    <ol className="st-track" style={columns ? ({ "--st-track-cols": columns } as React.CSSProperties) : undefined}>
      {steps.map(([when, title, body], index) => (
        <li className="st-track-step st-reveal" key={`${when}-${title}`} data-now={nowFrom !== undefined && index >= nowFrom ? "true" : undefined}>
          <span className="st-track-node" aria-hidden="true" />
          <p className="st-meta st-mono">{when}</p>
          <h3>{title}</h3>
          <p>{body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Closing call-to-action panel. */
export function StudioCta({ label, title, body, children }: { label: string; title: string; body?: ReactNode; children: ReactNode }) {
  return (
    <section className="st-section st-section--last">
      <div className="st-container">
        <div className="st-cta st-reveal">
          <div className="st-cta-glow" aria-hidden="true" />
          <p className="st-meta st-mono">{label}</p>
          <h2 className="st-h2 st-cta-title">
            <Accented text={title} />
          </h2>
          {body ? <p className="st-cta-body">{body}</p> : null}
          <div className="st-actions st-actions--center">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** A browser-window frame for real website screenshots. */
export function BrowserFrame({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("st-frame", className)}>
      <div className="st-frame-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        {label ? <span>{label}</span> : null}
      </div>
      <div className="st-frame-view">{children}</div>
    </div>
  );
}
