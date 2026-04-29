"use client";

import { useEffect } from "react";

export function AdminPwaBridge() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/admin-sw.js").catch(() => null);
  }, []);

  return null;
}
