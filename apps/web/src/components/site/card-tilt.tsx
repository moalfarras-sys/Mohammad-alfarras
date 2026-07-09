"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * "Foil tilt" — inspired by postcard-crafting apps (Lost Post): the framed
 * screenshot leans toward the pointer while a specular highlight tracks it,
 * like tilting a glossy foil postcard in your hand. Calm at rest.
 *
 * - Fine pointer (desktop): pointer-driven 3D tilt + moving glare.
 * - Coarse pointer (touch): a single foil sheen sweeps as the card scrolls in
 *   (pure CSS via view-timeline — no device-orientation permission needed).
 * - Respects prefers-reduced-motion.
 *
 * Selector-based so it needs no markup changes; re-scans on client navigation.
 */
const SELECTOR = ".os-mode-media, .os-case-media";

export function CardTilt() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const frames = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    const cleanups: Array<() => void> = [];

    for (const frame of frames) {
      if (frame.dataset.tilt === "on") continue;
      frame.dataset.tilt = "on";
      frame.classList.add("tilt-frame");

      const glare = document.createElement("span");
      glare.className = "tilt-glare";
      glare.setAttribute("aria-hidden", "true");
      frame.appendChild(glare);

      // Touch devices rely on the CSS sheen sweep; no pointer handlers.
      if (!finePointer) {
        cleanups.push(() => {
          glare.remove();
          frame.classList.remove("tilt-frame");
          delete frame.dataset.tilt;
        });
        continue;
      }

      let raf = 0;
      const onEnter = () => frame.classList.add("is-tilting");
      const onMove = (event: PointerEvent) => {
        const rect = frame.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          // Set the full transform string directly — var() inside a transform
          // function is not resolved reliably across engines.
          const ry = ((px - 0.5) * 12).toFixed(2);
          const rx = (-(py - 0.5) * 9).toFixed(2);
          frame.style.transform = `perspective(760px) rotateX(${rx}deg) rotateY(${ry}deg)`;
          frame.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
          frame.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
        });
      };
      const onLeave = () => {
        cancelAnimationFrame(raf);
        frame.classList.remove("is-tilting");
        frame.style.transform = "";
      };

      frame.addEventListener("pointerenter", onEnter);
      frame.addEventListener("pointermove", onMove);
      frame.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        frame.removeEventListener("pointerenter", onEnter);
        frame.removeEventListener("pointermove", onMove);
        frame.removeEventListener("pointerleave", onLeave);
        glare.remove();
        frame.style.transform = "";
        frame.classList.remove("tilt-frame", "is-tilting");
        delete frame.dataset.tilt;
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
