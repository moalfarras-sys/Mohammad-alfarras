"use client";

import { useEffect } from "react";

/**
 * Records one visit per browser session, after the page is idle.
 *
 * A plain fetch is used on purpose: `keepalive: true` requests are handed to
 * the browser process and never report completion to the page, so headless
 * audits (Playwright `networkidle`, Lighthouse) saw a request "in flight"
 * forever on every first page view. Keepalive is only needed while unloading,
 * which this beacon never does.
 */
export function VisitBeacon() {
  useEffect(() => {
    let cancelled = false;
    const send = () => {
      if (cancelled) return;
      try {
        if (sessionStorage.getItem("mf_visit")) return;
        sessionStorage.setItem("mf_visit", "1");
      } catch {
        return;
      }
      fetch("/api/track", { method: "POST", cache: "no-store" }).catch(() => {});
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const handle = idle ? idle(send, { timeout: 4000 }) : window.setTimeout(send, 2500);
    return () => {
      cancelled = true;
      if (!idle) window.clearTimeout(handle);
    };
  }, []);

  return null;
}
