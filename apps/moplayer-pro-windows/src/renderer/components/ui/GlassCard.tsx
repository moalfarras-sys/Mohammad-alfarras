import type React from "react";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  as?: "article" | "div" | "section";
};

export function GlassCard({ children, className = "", glow = false, as: Tag = "article" }: GlassCardProps) {
  return (
    <Tag className={`glass-card ${glow ? "has-glow" : ""} ${className}`.trim()}>
      <span className="glass-card-shine" aria-hidden="true" />
      {children}
    </Tag>
  );
}
