import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  glow?: boolean;
  glowColor?: "green" | "orange" | "purple";
  variant?: "default" | "strong" | "subtle" | "neon";
};

const variants = {
  default: "glass-panel",
  strong: "glass-panel glass-panel-strong",
  subtle: "glass-panel glass-panel-subtle",
  neon: "glass-panel glass-panel-neon",
} as const;

export function GlassCard({
  children,
  className,
  glow = false,
  glowColor = "green",
  variant = "default",
  ...props
}: GlassCardProps) {
  const glowShadow = {
    green: "shadow-[0_0_60px_rgba(0,229,255,0.12),0_24px_80px_rgba(0,0,0,0.5)]",
    orange: "shadow-[0_0_60px_rgba(99,102,241,0.12),0_24px_80px_rgba(0,0,0,0.5)]",
    purple: "shadow-[0_0_60px_rgba(217,70,239,0.12),0_24px_80px_rgba(0,0,0,0.5)]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem]",
        variants[variant],
        glow && glowShadow[glowColor],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
