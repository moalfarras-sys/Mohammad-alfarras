"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The only client JavaScript on the MoPlayer product pages: a subtle
 * scroll-linked depth effect for the hero devices. The content is fully
 * painted on the server (no opacity gating, so the LCP image is never
 * delayed); motion only adds transform. Reduced motion renders it static.
 */
export function ParallaxLayer({
  children,
  depth = 1,
  className,
}: {
  children: ReactNode;
  /** 1 = main device, >1 moves faster (foreground), <1 slower. */
  depth?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const smooth = useSpring(scrollY, { stiffness: 120, damping: 28, mass: 0.4 });
  const y = useTransform(smooth, [0, 700], [0, -42 * depth]);
  const rotateX = useTransform(smooth, [0, 700], [0, 5]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} style={{ y, rotateX: depth === 1 ? rotateX : 0, transformPerspective: 1400 }}>
      <motion.div
        initial={{ y: 18 * depth, scale: 0.985 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 70, damping: 18, mass: 0.8 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
