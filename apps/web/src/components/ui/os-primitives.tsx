import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("fresh-page", className)}>{children}</div>;
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  className,
  level = "h2",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  className?: string;
  level?: "h1" | "h2";
}) {
  const Heading = level;
  return (
    <div className={cn("fresh-section-head", className)}>
      <p className="fresh-eyebrow">{eyebrow}</p>
      <Heading>{title}</Heading>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
