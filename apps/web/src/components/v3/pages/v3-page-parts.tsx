/**
 * Shared, server-renderable building blocks for the v3 Services / Work / YouTube / Contact pages.
 * Motion comes from client islands (motion kit + v3-page-motion); these parts are static markup.
 */

import Image from "next/image";
import type { ReactNode } from "react";

import { ParallaxImage, Reveal, SplitHeadline } from "@/components/v3/motion-kit";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("v3p-eyebrow", className)}>
      <span className="v3p-eyebrow-dot" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  body,
  className,
  align = "start",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <header className={cn("v3p-head", align === "center" && "v3p-head--center", className)}>
      <Reveal y={16}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <SplitHeadline as="h2" text={title} className="v3p-h2" />
      {body ? (
        <Reveal y={16} delay={0.1}>
          <p className="v3p-head-body">{body}</p>
        </Reveal>
      ) : null}
    </header>
  );
}

/** Browser window chrome around a real website screenshot. */
export function BrowserShot({
  src,
  alt,
  label,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  label?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("v3p-browser", className)}>
      <div className="v3p-browser-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        {label ? <bdi className="v3p-browser-url">{label}</bdi> : null}
      </div>
      <div className="v3p-browser-screen">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={70} className="v3-cover v3-top" />
      </div>
    </div>
  );
}

/** Phone frame around a real mobile screenshot. */
export function PhoneShot({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("v3p-phone", className)}>
      <span className="v3p-phone-notch" aria-hidden="true" />
      <div className="v3p-phone-screen">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={70} className="v3-cover v3-top" />
      </div>
    </div>
  );
}

/** The one contextual call to action at the end of a page: a wide image band with copy. */
export function CtaBand({
  eyebrow,
  title,
  body,
  image,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  children: ReactNode;
}) {
  return (
    <section className="v3p-section v3p-cta-section">
      <div className="st-container">
        <div className="v3p-cta">
          <ParallaxImage src={image} alt="" className="v3p-cta-bg" strength={50} sizes="(max-width: 1240px) 100vw, 1240px" />
          <div className="v3p-cta-shade" aria-hidden="true" />
          <div className="v3p-cta-copy">
            <Reveal y={16}>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
            <SplitHeadline as="h2" text={title} className="v3p-h2 v3p-cta-title" />
            <Reveal y={16} delay={0.12}>
              <p className="v3p-cta-body">{body}</p>
              <div className="v3p-actions">{children}</div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
