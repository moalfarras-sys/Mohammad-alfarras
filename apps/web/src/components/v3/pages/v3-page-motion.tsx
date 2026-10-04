"use client";

/**
 * Page-level motion primitives for the v3 Services / Work / YouTube / Contact pages.
 * They extend the shared motion kit (components/v3/motion-kit.tsx) without editing it and,
 * like the kit, respect prefers-reduced-motion.
 */

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Children, isValidElement, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { CountUp } from "@/components/v3/motion-kit";
import { cn } from "@/lib/cn";

/* ───────────────────────── Scroll layer ───────────────────────── */

/**
 * Moves its children vertically against the scroll (depth for layered collages).
 * `speed` is in pixels of travel across the element's pass through the viewport;
 * negative values move up faster than the page, positive values lag behind.
 */
export function ScrollLayer({
  children,
  className,
  speed = 40,
  rotate = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  rotate?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [speed, -speed]);
  const r = useTransform(scrollYProgress, [0, 1], reduce ? [rotate, rotate] : [rotate - 1.5, rotate + 1.5]);
  return (
    <motion.div ref={ref} className={className} style={{ ...style, y, rotate: r }}>
      {children}
    </motion.div>
  );
}

/* ───────────────────────── Entrance for collages ───────────────────────── */

/** One orchestrated entrance: children rise, de-blur and settle one after another on load. */
export function LoadSequence({ children, className, delay = 0.15 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      {Children.map(children, (child, index) =>
        isValidElement(child) ? (
          <motion.div
            className="v3p-seq-item"
            initial={reduce ? false : { opacity: 0, y: 36, scale: 0.96, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.95, delay: delay + index * 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </div>
  );
}

/* ───────────────────────── Process line ───────────────────────── */

/**
 * A vertical list of steps joined by a line that draws itself as the list scrolls through the
 * viewport. Each node lights up once the line reaches it.
 */
export function ProcessTrack({
  steps,
  className,
}: {
  steps: ReadonlyArray<{ number: string; title: string; body: string }>;
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const scaleY = useTransform(progress, (value) => (reduce ? 1 : value));
  const [reached, setReached] = useState(reduce ? steps.length : 0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (reduce) return;
    const next = Math.min(steps.length, Math.floor(value * steps.length + 0.35));
    setReached((current) => (next > current ? next : current));
  });

  return (
    <ol ref={ref} className={cn("v3p-track", className)}>
      <span className="v3p-track-rail" aria-hidden="true">
        <motion.span className="v3p-track-fill" style={{ scaleY }} />
      </span>
      {steps.map((step, index) => (
        <li key={step.number} className={cn("v3p-track-step", (reduce || index < reached) && "is-lit")}>
          <span className="v3p-track-node" aria-hidden="true">
            {step.number}
          </span>
          <div className="v3p-track-copy">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── Stat counter ───────────────────────── */

/** CountUp with a locale-aware compact formatter (server components cannot pass functions). */
export function StatCount({ value, locale, className }: { value: number; locale: "en" | "ar"; className?: string }) {
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });
  return <CountUp value={value} className={className} format={(n) => formatter.format(Math.round(n))} />;
}
