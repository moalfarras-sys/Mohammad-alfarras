"use client";

import { useEffect } from "react";

export function AdminPwaBridge() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/admin-sw.js")
      .then((registration) => registration.update())
      .catch(() => null);
    window.caches?.keys().then((keys) => Promise.all(keys.map((key) => window.caches.delete(key)))).catch(() => null);
  }, []);

  return null;
}
