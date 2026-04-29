import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("fresh-page", className)}>{children}</div>;
}

export function HeroShell({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("fresh-hero", className)}>{children}</section>;
}

export function GlassPanel({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "article" | "aside" | "section" }) {
  const Component = as;
  return <Component className={cn("fresh-card", className)}>{children}</Component>;
}

export function SectionHeader({ eyebrow, title, body, className }: { eyebrow: string; title: string; body?: string; className?: string }) {
  return (
    <div className={cn("fresh-section-head", className)}>
      <p className="fresh-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function ActionButton({
  href,
  variant = "secondary",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & { href?: string; variant?: "primary" | "secondary"; children: ReactNode }) {
  const classes = cn("fresh-button", variant === "primary" && "fresh-button-primary", className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("fresh-badge", className)}>{children}</span>;
}

export function StatTile({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("fresh-stat-tile", className)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function CaseStudyCard({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cn("fresh-project", className)}>{children}</article>;
}

export function TimelineRail({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("fresh-list", className)}>{children}</div>;
}

export function FormField({ children, label, error }: { children: ReactNode; label: string; error?: string }) {
  return (
    <label className="fresh-field">
      <span className="fresh-field-label">{label}</span>
      {children}
      {error ? <span className="text-xs font-bold text-[var(--os-danger)]">{error}</span> : null}
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="fresh-empty">
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

export function StatusCard({ tone = "info", children, className }: { tone?: "info" | "success" | "danger"; children: ReactNode; className?: string }) {
  return <div className={cn("fresh-status", `fresh-status-${tone}`, className)}>{children}</div>;
}
