"use client";

import { ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

const storageKey = "moalfarras-cookie-v3";

const copy = {
  en: {
    title: "Privacy first",
    body: "This site uses only the minimum browser storage needed for theme and language preferences.",
    accept: "Accept",
  },
  ar: {
    title: "الخصوصية أولا",
    body: "يستخدم هذا الموقع أقل قدر ممكن من التخزين داخل المتصفح لحفظ الثيم واللغة فقط.",
    accept: "موافق",
  },
} as const;

export function CookieBanner({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accepted = window.localStorage.getItem(storageKey);
    if (!accepted) {
      const timer = window.setTimeout(() => setOpen(true), 900);
      return () => window.clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  const t = copy[locale];

  function close() {
    window.localStorage.setItem(storageKey, "accepted");
    setOpen(false);
  }

  return (
    <div className="cookie-banner-wrap">
      <div className="cookie-banner-card fresh-cookie">
        <div className="flex items-start gap-3">
          <div className="fresh-mini-icon">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--text-1)]">{t.title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-2)]">{t.body}</p>
              </div>
              <button type="button" onClick={close} className="fresh-icon-button" aria-label="Close cookie banner">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={close} className="fresh-button fresh-button-primary">
                {t.accept}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
