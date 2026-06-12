import type React from "react";

type HubCardProps = {
  icon: React.ElementType;
  title: string;
  count?: string;
  subtitle?: string;
  onClick: () => void;
  accent?: "orange" | "copper" | "live";
};

export function HubCard({ icon: Icon, title, count, subtitle, onClick, accent = "orange" }: HubCardProps) {
  return (
    <button type="button" className={`hub-card is-${accent}`} onClick={onClick}>
      <span className="hub-card-shine" aria-hidden="true" />
      <span className="hub-card-icon"><Icon size={26} strokeWidth={2} /></span>
      <span className="hub-card-copy">
        <strong>{title}</strong>
        {count ? <em>{count}</em> : null}
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
      <i className="hub-card-glow" aria-hidden="true" />
    </button>
  );
}
