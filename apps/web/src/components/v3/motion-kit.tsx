"use client";

/**
 * Site v3 motion kit — "Hologram Studio".
 *
 * Every page builds its motion from these few primitives so the site moves with one voice:
 * soft spring entrances, depth parallax, pointer tilt on desktop and calm auto-motion on touch.
 * All of them respect prefers-reduced-motion (framer's MotionConfig reducedMotion="user" in
 * MotionProvider, plus explicit checks for the pointer/gyro effects below).
 */

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Image from "next/image";
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export const v3Spring = { type: "spring", stiffness: 120, damping: 20, mass: 0.9 } as const;
const easeOut = [0.16, 1, 0.3, 1] as const;

/* ───────────────────────── Reveal ───────────────────────── */

/** Fades and lifts its children into place the first time they enter the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "article" | "li" | "header";
  amount?: number;
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.8, delay, ease: easeOut }}
    >
      {children}
    </Tag>
  );
}

/** Reveals each direct child one after another (cards, list rows). */
export function Stagger({
  children,
  className,
  gap = 0.08,
  y = 32,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {Children.map(children, (child, index) =>
        isValidElement(child) ? (
          <motion.div
            key={index}
            className="v3-stagger-item"
            variants={{
              hidden: { opacity: 0, y, scale: 0.98 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: easeOut } },
            }}
          >
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </motion.div>
  );
}

/* ───────────────────────── Headline word reveal ───────────────────────── */

/**
 * Splits a headline into words that rise in sequence. Words wrapped in *asterisks* get the
 * accent treatment. Works for Arabic too (splits on spaces, keeps letter shaping intact).
 */
export function SplitHeadline({
  text,
  as = "h1",
  className,
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  delay?: number;
}) {
  const Tag = motion[as];
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag
      className={cn("v3-split", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
      aria-label={text.replace(/\*/g, "")}
    >
      {words.map((word, index) => {
        const accent = /^\*.*\*[.,!?؟،]*$/.test(word);
        const clean = word.replace(/\*/g, "");
        return (
          // The space must sit outside the inline-block mask: trailing spaces inside an
          // inline-block are collapsed, which glued the words together.
          <Fragment key={`${word}-${index}`}>
            <span className="v3-split-mask" aria-hidden="true">
              <motion.span
                className={cn("v3-split-word", accent && "v3-accent")}
                variants={{
                  hidden: { y: "110%", opacity: 0 },
                  show: { y: "0%", opacity: 1, transition: { duration: 0.85, ease: easeOut } },
                }}
              >
                {clean}
              </motion.span>
            </span>
            {index < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </Tag>
  );
}

/* ───────────────────────── Parallax image ───────────────────────── */

/** An image that drifts slower than the page as it scrolls past (depth). */
export function ParallaxImage({
  src,
  alt,
  className,
  strength = 60,
  priority = false,
  sizes = "100vw",
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  strength?: number;
  priority?: boolean;
  sizes?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-strength, strength]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [1.12, 1.06, 1.12]);
  return (
    <div ref={ref} className={cn("v3-parallax", className)} style={style}>
      <motion.div className="v3-parallax-layer" style={{ y, scale }}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="v3-cover" />
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Tilt card ───────────────────────── */

/** Leans toward the pointer with a moving glare (desktop). Static on touch / reduced motion. */
export function TiltCard({
  children,
  className,
  max = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareBg = useTransform(
    [gx, gy] as MotionValue<number>[],
    ([x, y]: number[]) => `radial-gradient(420px circle at ${x}% ${y}%, rgba(255,255,255,0.16), transparent 55%)`,
  );

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={cn("v3-tilt", className)}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      {glare && !reduce ? <motion.span aria-hidden className="v3-tilt-glare" style={{ background: glareBg }} /> : null}
    </motion.div>
  );
}

/* ───────────────────────── Count up ───────────────────────── */

/** Counts a real number up once when it scrolls into view. Pass the display formatter. */
export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString(),
  className,
  duration = 1.6,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(0));
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: easeOut,
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className={className}>
      {reduce ? format(value) : display}
    </span>
  );
}

/* ───────────────────────── Marquee ───────────────────────── */

/** Endless horizontal strip (pure CSS animation, pauses on hover, static with reduced motion). */
export function Marquee({ children, className, speed = 38 }: { children: ReactNode; className?: string; speed?: number }) {
  return (
    <div className={cn("v3-marquee", className)} style={{ "--v3-marquee-speed": `${speed}s` } as CSSProperties}>
      <div className="v3-marquee-track">
        <div className="v3-marquee-group">{children}</div>
        <div className="v3-marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Hologram portrait (signature) ───────────────────────── */

export type HoloChip = {
  /** Short label, e.g. "YouTube". */
  label: string;
  /** Main value, e.g. "6.2K subscribers". */
  value: string;
  /** Optional small image (icon, thumbnail, screenshot). */
  image?: string;
  /** Position inside the stage, percent of width/height. */
  x: number;
  y: number;
  /** Depth: 0 (flat, close to the photo) … 1 (floats far forward, moves the most). */
  depth: number;
  href?: string;
};

/**
 * The signature hero: the owner's hologram portrait with glass chips floating around it in
 * depth. One orchestrated entrance (the photo resolves out of blur while a light sweep passes,
 * then the chips fly out of the hand area one by one), then:
 * - desktop: the photo and chips shift in 3D with the pointer,
 * - touch: device tilt when available, otherwise a slow figure-eight drift,
 * - reduced motion: everything static.
 */
export function HoloPortrait({
  src,
  alt,
  chips,
  origin = { x: 22, y: 62 },
  className,
}: {
  src: string;
  alt: string;
  chips: HoloChip[];
  /** Where the chips are "conjured" from (percent), e.g. the hand in the photo. */
  origin?: { x: number; y: number };
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useSpring(0, { stiffness: 60, damping: 16 });
  const py = useSpring(0, { stiffness: 60, damping: 16 });
  const rotateY = useTransform(px, [-1, 1], [-7, 7]);
  const rotateX = useTransform(py, [-1, 1], [6, -6]);
  const photoX = useTransform(px, [-1, 1], [-10, 10]);
  const photoY = useTransform(py, [-1, 1], [-8, 8]);

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      const onMove = (event: PointerEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        px.set(Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)));
        py.set(Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1)));
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }
    // Touch: gentle drift; device tilt takes over when the browser offers it without a prompt.
    let raf = 0;
    let tilting = false;
    const start = performance.now();
    const drift = (now: number) => {
      if (!tilting) {
        const t = (now - start) / 1000;
        px.set(Math.sin(t * 0.45) * 0.55);
        py.set(Math.sin(t * 0.9) * 0.35);
      }
      raf = requestAnimationFrame(drift);
    };
    raf = requestAnimationFrame(drift);
    const onOrient = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;
      tilting = true;
      px.set(Math.max(-1, Math.min(1, event.gamma / 25)));
      py.set(Math.max(-1, Math.min(1, (event.beta - 45) / 25)));
    };
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [reduce, px, py]);

  return (
    <motion.div
      ref={ref}
      className={cn("v3-holo", className)}
      style={{ rotateX, rotateY, transformPerspective: 1400 }}
    >
      <motion.div
        className="v3-holo-photo"
        style={{ x: photoX, y: photoY }}
        initial={reduce ? false : { opacity: 0, scale: 1.08, filter: "blur(18px) saturate(0.4)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px) saturate(1)" }}
        transition={{ duration: 1.3, ease: easeOut }}
      >
        <Image src={src} alt={alt} fill priority sizes="(max-width: 900px) 92vw, 520px" className="v3-cover" />
        {!reduce ? <span className="v3-holo-sweep" aria-hidden /> : null}
        <span className="v3-holo-scan" aria-hidden />
      </motion.div>

      <span className="v3-holo-ring" aria-hidden />

      {chips.map((chip, index) => (
        <HoloChipView key={chip.label} chip={chip} index={index} origin={origin} px={px} py={py} reduce={!!reduce} />
      ))}
    </motion.div>
  );
}

function HoloChipView({
  chip,
  index,
  origin,
  px,
  py,
  reduce,
}: {
  chip: HoloChip;
  index: number;
  origin: { x: number; y: number };
  px: MotionValue<number>;
  py: MotionValue<number>;
  reduce: boolean;
}) {
  const travel = 14 + chip.depth * 34;
  const x = useTransform(px, [-1, 1], [-travel, travel]);
  const y = useTransform(py, [-1, 1], [-travel * 0.7, travel * 0.7]);
  const body = (
    <>
      {chip.image ? (
        <span className="v3-chip-media">
          <Image src={chip.image} alt="" fill sizes="56px" className="v3-cover" />
        </span>
      ) : null}
      <span className="v3-chip-text">
        <span className="v3-chip-label">{chip.label}</span>
        <span className="v3-chip-value">{chip.value}</span>
      </span>
    </>
  );
  return (
    <motion.div
      className="v3-chip-anchor"
      style={{ left: `${chip.x}%`, top: `${chip.y}%`, x, y, zIndex: 2 + Math.round(chip.depth * 10) }}
      initial={
        reduce
          ? false
          : {
              opacity: 0,
              scale: 0.4,
              left: `${origin.x}%`,
              top: `${origin.y}%`,
            }
      }
      animate={{ opacity: 1, scale: 1, left: `${chip.x}%`, top: `${chip.y}%` }}
      transition={{ ...v3Spring, delay: 0.9 + index * 0.14 }}
    >
      {chip.href ? (
        <a className="v3-chip" href={chip.href}>
          {body}
        </a>
      ) : (
        <div className="v3-chip">{body}</div>
      )}
    </motion.div>
  );
}

/* ───────────────────────── Showreel (sticky device stage) ───────────────────────── */

export type ShowreelItem = {
  id: string;
  title: string;
  kicker: string;
  body: string;
  desktop: string;
  mobile?: string;
  domain?: string;
  href: string;
  external?: string;
};

/**
 * Desktop: a sticky laptop + phone stage on one side; as each project block scrolls through the
 * middle of the viewport the stage cross-fades to its screenshots.
 * Mobile (< 900px): a horizontal snap carousel, each slide with its own device frames.
 */
export function Showreel({
  items,
  labels,
}: {
  items: ShowreelItem[];
  labels: { caseStudy: string; visit: string };
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const nodes = refs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(index)) setActive(index);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items.length]);

  const current = items[active] ?? items[0];

  return (
    <div className="v3-reel">
      <div className="v3-reel-stage" aria-hidden="true">
        <div className="v3-device-laptop">
          <div className="v3-device-laptop-screen">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                className="v3-device-shot"
                initial={false}
                animate={{ opacity: index === active ? 1 : 0, scale: index === active ? 1 : 1.04 }}
                transition={{ duration: 0.6, ease: easeOut }}
              >
                <Image src={item.desktop} alt="" fill sizes="(max-width: 1200px) 50vw, 640px" className="v3-cover v3-top" />
              </motion.div>
            ))}
            {current?.domain ? <span className="v3-device-url">{current.domain}</span> : null}
          </div>
          <div className="v3-device-laptop-base" />
        </div>
        <div className="v3-device-phone">
          {items.map((item, index) =>
            item.mobile ? (
              <motion.div
                key={item.id}
                className="v3-device-shot"
                initial={false}
                animate={{ opacity: index === active ? 1 : 0, y: index === active ? 0 : 18 }}
                transition={{ duration: 0.6, ease: easeOut, delay: 0.06 }}
              >
                <Image src={item.mobile} alt="" fill sizes="180px" className="v3-cover v3-top" />
              </motion.div>
            ) : null,
          )}
        </div>
      </div>

      <ol className="v3-reel-list">
        {items.map((item, index) => (
          <li
            key={item.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            data-index={index}
            className={cn("v3-reel-item", index === active && "is-active")}
          >
            <div className="v3-reel-mobile-shot">
              <Image src={item.desktop} alt={item.title} fill sizes="92vw" className="v3-cover v3-top" />
              {item.mobile ? (
                <span className="v3-reel-mobile-phone">
                  <Image src={item.mobile} alt="" fill sizes="30vw" className="v3-cover v3-top" />
                </span>
              ) : null}
            </div>
            <span className="v3-reel-kicker">{item.kicker}</span>
            <h3 className="v3-reel-title">{item.title}</h3>
            <p className="v3-reel-body">{item.body}</p>
            <div className="v3-reel-actions">
              <a className="v3-link" href={item.href}>
                {labels.caseStudy}
              </a>
              {item.external ? (
                <a className="v3-link v3-link-quiet" href={item.external} target="_blank" rel="noopener noreferrer">
                  {labels.visit}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────── Scroll progress ───────────────────────── */

/** Thin accent bar at the top of the viewport that fills as the page scrolls. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return <motion.div className="v3-progress" style={{ scaleX }} aria-hidden />;
}
