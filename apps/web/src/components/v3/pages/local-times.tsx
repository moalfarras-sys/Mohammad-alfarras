"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Locale } from "@/types/cms";

// Client-only clock: the server snapshot is null so SSR markup matches, and the time fills in
// after mount (rendering a real time during SSR causes a hydration mismatch).
const clockStore = {
  subscribe(onChange: () => void) {
    const timer = window.setInterval(onChange, 30_000);
    return () => window.clearInterval(timer);
  },
  getSnapshot: () => Math.floor(Date.now() / 30_000),
  getServerSnapshot: () => null,
};

export function LocalTimes({ locale, zones }: { locale: Locale; zones: ReadonlyArray<{ city: string; zone: string }> }) {
  const tick = useSyncExternalStore(clockStore.subscribe, clockStore.getSnapshot, clockStore.getServerSnapshot);
  const now = useMemo(() => (tick === null ? null : new Date()), [tick]);
  const format = (zone: string, date: Date) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return (
    <dl className="v3k-times">
      {zones.map((item) => (
        <div key={item.zone}>
          <dt>{item.city}</dt>
          <dd>{now ? format(item.zone, now) : "--:--"}</dd>
        </div>
      ))}
    </dl>
  );
}
