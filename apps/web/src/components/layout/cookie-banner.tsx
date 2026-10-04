"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

// v4 replaces the old full card; visitors who already accepted v3 stay dismissed.
const storageKey = "moalfarras-consent-v4";
const legacyKey = "moalfarras-cookie-v3";

const copy = {
  en: {
    body: "No advertising or tracking cookies. Only essential preferences, like your language, stay in your browser, plus anonymous, cookieless page statistics.",
    privacy: "Privacy",
    ok: "Got it",
  },
  ar: {
    body: "لا توجد ملفات تعريف للإعلانات أو التتبّع. يُحفظ في متصفحك فقط ما هو ضروري مثل اللغة، مع إحصاءات زيارات مجهولة بدون كوكيز.",
    privacy: "الخصوصية",
    ok: "حسناً",
  },
} as const;

/**
 * A quiet, non-blocking notice. It waits until the visitor has scrolled past the
 * hero (or 15 seconds have passed), so it never competes with the hero, and it sits in
 * a corner instead of covering content.
 */
export function CookieBanner({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) || localStorage.getItem(legacyKey)) return;
    } catch {
      return;
    }
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
      cleanup();
    };
    const timer = window.setTimeout(show, 15000);
    const onScroll = () => {
      if (window.scrollY > 480) show();
    };
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return cleanup;
  }, []);

  if (!open) return null;

  const t = copy[locale];

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "essential");
    } catch {
      // Storage may be blocked; closing for this page view is enough.
    }
    setOpen(false);
  }

  return (
    <aside className="st-consent" role="region" aria-label={locale === "ar" ? "إشعار الخصوصية" : "Privacy notice"}>
      <p>
        {t.body}{" "}
        <Link href={`/${locale}/privacy`} prefetch={false}>
          {t.privacy}
        </Link>
      </p>
      <button type="button" onClick={dismiss} className="st-consent-ok">
        {t.ok}
      </button>
    </aside>
  );
}
