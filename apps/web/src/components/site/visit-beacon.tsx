"use client";

import { useEffect } from "react";

/**
 * Fires once per browser session to record a visit. Non-blocking (runs after
 * load, keepalive). Never affects rendering or speed.
 */
export function VisitBeacon() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("mf_visit")) return;
      sessionStorage.setItem("mf_visit", "1");
      fetch("/api/track", { method: "POST", keepalive: true }).catch(() => {});
    } catch {
      // ignore (private mode / blocked storage)
    }
  }, []);

  return null;
}
