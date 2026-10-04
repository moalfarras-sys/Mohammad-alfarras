"use client";

/**
 * About v3 — the chaptered story. A thin progress line runs along the chapters and fills as the
 * visitor scrolls; each chapter lights its node when it reaches the middle of the viewport.
 */

import { motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import { useRef, type ReactNode } from "react";

import { ParallaxImage, Reveal, TiltCard } from "@/components/v3/motion-kit";
import { cn } from "@/lib/cn";

export type AboutChapterMedia =
  | { kind: "parallax"; src: string; alt: string; caption?: string }
  | { kind: "browser"; src: string; mobile?: string; alt: string; domain: string; caption?: string }
  | { kind: "route"; from: string; to: string; year: string; chips: string[] }
  | {
      kind: "duo";
      site: { src: string; alt: string; domain: string };
      tv: { src: string; alt: string };
      caption?: string;
    };

export type AboutChapter = {
  id: string;
  index: string;
  kicker: string;
  title: string;
  body: string;
  facts: string[];
  media: AboutChapterMedia;
  link?: { href: string; label: string };
};

export function AboutChapters({ chapters }: { chapters: AboutChapter[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 110, damping: 26, restDelta: 0.001 });

  return (
    <ol className="v3ab-chapters" ref={ref}>
      <span className="v3ab-rail" aria-hidden>
        <motion.span className="v3ab-rail-fill" style={{ scaleY: reduce ? 1 : fill }} />
      </span>
      {chapters.map((chapter, index) => (
        <Chapter key={chapter.id} chapter={chapter} flip={index % 2 === 1} />
      ))}
    </ol>
  );
}

function Chapter({ chapter, flip }: { chapter: AboutChapter; flip: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const active = useInView(ref, { margin: "-45% 0px -45% 0px" });
  const reached = useInView(ref, { once: true, margin: "-45% 0px -45% 0px" });
  return (
    <li ref={ref} className={cn("v3ab-chapter", flip && "is-flip", reached && "is-reached", active && "is-active")}>
      <span className="v3ab-node" aria-hidden>
        <span>{chapter.index}</span>
      </span>
      <div className="v3ab-chapter-media">
        <ChapterMedia media={chapter.media} />
      </div>
      <Reveal className="v3ab-chapter-copy" y={24}>
        <p className="v3ab-kicker">{chapter.kicker}</p>
        <h3 className="v3ab-chapter-title">{chapter.title}</h3>
        <p className="v3ab-chapter-body">{chapter.body}</p>
        {chapter.facts.length ? (
          <ul className="v3ab-facts">
            {chapter.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        ) : null}
        {chapter.link ? (
          <a className="v3-link v3ab-chapter-link" href={chapter.link.href}>
            {chapter.link.label}
          </a>
        ) : null}
      </Reveal>
    </li>
  );
}

function Caption({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <figcaption className="v3ab-caption">{children}</figcaption>;
}

function ChapterMedia({ media }: { media: AboutChapterMedia }) {
  if (media.kind === "parallax") {
    return (
      <figure className="v3ab-figure">
        <ParallaxImage src={media.src} alt={media.alt} className="v3ab-parallax" strength={46} sizes="(max-width: 899px) 92vw, 620px" />
        <Caption>{media.caption}</Caption>
      </figure>
    );
  }

  if (media.kind === "browser") {
    return (
      <figure className="v3ab-figure">
        <TiltCard className="v3ab-browser" max={5}>
          <div className="v3ab-browser-bar">
            <span className="v3ab-browser-dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="v3ab-browser-url">{media.domain}</span>
          </div>
          <div className="v3ab-browser-shot">
            <Image src={media.src} alt={media.alt} fill sizes="(max-width: 899px) 92vw, 620px" className="v3-cover v3-top" />
          </div>
          {media.mobile ? (
            <span className="v3ab-phone" aria-hidden>
              <Image src={media.mobile} alt="" fill sizes="140px" className="v3-cover v3-top" />
            </span>
          ) : null}
        </TiltCard>
        <Caption>{media.caption}</Caption>
      </figure>
    );
  }

  if (media.kind === "duo") {
    return (
      <figure className="v3ab-figure">
        <div className="v3ab-duo">
          <TiltCard className="v3ab-browser v3ab-duo-site" max={4}>
            <div className="v3ab-browser-bar">
              <span className="v3ab-browser-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="v3ab-browser-url">{media.site.domain}</span>
            </div>
            <div className="v3ab-browser-shot">
              <Image src={media.site.src} alt={media.site.alt} fill sizes="(max-width: 899px) 86vw, 560px" className="v3-cover v3-top" />
            </div>
          </TiltCard>
          <div className="v3ab-tv">
            <div className="v3ab-tv-screen">
              <Image src={media.tv.src} alt={media.tv.alt} fill sizes="(max-width: 899px) 60vw, 340px" className="v3-cover" />
            </div>
            <span className="v3ab-tv-stand" aria-hidden />
          </div>
        </div>
        <Caption>{media.caption}</Caption>
      </figure>
    );
  }

  return <RouteCard media={media} />;
}

/** Al-Hasakah → Germany, drawn as a shipment-style route (east on the right, west on the left). */
function RouteCard({ media }: { media: Extract<AboutChapterMedia, { kind: "route" }> }) {
  return (
    <figure className="v3ab-figure">
      <div className="v3ab-route" dir="ltr">
        <span className="v3ab-route-grid" aria-hidden />
        <svg className="v3ab-route-svg" viewBox="0 0 600 340" aria-hidden preserveAspectRatio="none">
          <defs>
            <linearGradient id="v3ab-route-grad" x1="1" x2="0" y1="0" y2="0">
              <stop offset="0" stopColor="#4fe3ff" />
              <stop offset="1" stopColor="#8c7bff" />
            </linearGradient>
          </defs>
          <path d="M500 250 C 420 90, 230 60, 110 120" className="v3ab-route-base" />
          <motion.path
            d="M500 250 C 420 90, 230 60, 110 120"
            className="v3ab-route-line"
            stroke="url(#v3ab-route-grad)"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
        <div className="v3ab-route-stop v3ab-route-stop--from">
          <span className="v3ab-route-flag">
            <Image src="/icons/flag-sy-new.svg" alt="" width={40} height={40} />
          </span>
          <strong dir="auto">{media.from}</strong>
        </div>
        <div className="v3ab-route-stop v3ab-route-stop--to">
          <span className="v3ab-route-flag">
            <Image src="/icons/flag-de.svg" alt="" width={40} height={40} />
          </span>
          <strong dir="auto">{media.to}</strong>
        </div>
        <span className="v3ab-route-year">{media.year}</span>
        <ul className="v3ab-route-chips">
          {media.chips.map((chip) => (
            <li key={chip} dir="auto">{chip}</li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
