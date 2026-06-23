"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes every framer-motion animation on the site honor the visitor's
 * "prefers-reduced-motion" OS setting (the global CSS reset only stops CSS
 * animations, not framer's JS/rAF-driven transforms or infinite loops).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
