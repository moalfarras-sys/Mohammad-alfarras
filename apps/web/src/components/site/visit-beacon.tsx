"use client";

import { useEffect } from "react";

/**
 * Records one visit per browser session, after the page is idle.
 *
 * The response body is read on purpose: Chromium keeps a fetch whose body is
 * never consumed open, so headless audits (Playwright "networkidle",
 * Lighthouse) saw /api/track "in flight" forever on every first page view.
 * keepalive is not used — it is only needed while unloading.
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
      fetch("/api/track", { method: "POST", cache: "no-store" })
        .then((response) => response.arrayBuffer())
        .catch(() => {});
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
