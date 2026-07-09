"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Cross-device scroll-reveal. The site's CSS reveals rely on
 * `animation-timeline: view()`, which iOS Safari does not support — so on
 * iPhones the cards appeared static. This drives the same entrance with an
 * IntersectionObserver, so every device gets real motion: cards rise + fade in
 * with a gentle per-row stagger as they enter the viewport.
 *
 * Selector-based (no markup changes); re-scans on client navigation.
 */
const SELECTOR = [
  ".os-mode-card",
  ".os-home-explore-card",
  ".os-home-case-card",
  ".os-moplayer-app-card",
  ".os-story-step",
  ".work-project-card",
  ".yt2-card",
  ".yt2-series-card",
  ".cv-count-card",
  ".cv-story-card",
  ".cv-proof-card",
  ".cv-experience-card",
  ".services-command-page .fresh-grid-3 .fresh-card",
  ".services-step-card",
  ".contact-social-card",
  ".apps-card",
  ".apps-flow-card",
].join(",");

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
      (el) => !el.dataset.reveal,
    );
    if (!nodes.length) return;

    // Stagger by position within the element's own container so each row/grid
    // cascades independently (cap the delay so nothing lags noticeably).
    const groupIndex = new Map<Element, number>();
    for (const el of nodes) {
      el.dataset.reveal = "init";
      el.classList.add("reveal-init");
      const parent = el.parentElement ?? document.body;
      const i = groupIndex.get(parent) ?? 0;
      groupIndex.set(parent, i + 1);
      el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("reveal-in");
          el.dataset.reveal = "done";
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    for (const el of nodes) observer.observe(el);

    return () => {
      observer.disconnect();
      for (const el of nodes) {
        el.classList.remove("reveal-init", "reveal-in");
        el.style.transitionDelay = "";
        delete el.dataset.reveal;
      }
    };
  }, [pathname]);

  return null;
}
