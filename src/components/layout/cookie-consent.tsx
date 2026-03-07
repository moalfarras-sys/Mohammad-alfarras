"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

const COOKIE_KEY = "mf_cookie_consent";

export function CookieConsent({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_KEY);
    if (!hasConsent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    document.cookie = "mf_cookie_consent=accepted; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner glass-card" role="dialog" aria-live="polite">
      <p>
        {locale === "ar"
          ? "نستخدم ملفات تعريف الارتباط الأساسية لتحسين التجربة. بالمتابعة أنت توافق على سياسة الخصوصية."
          : "We use essential cookies to improve your experience. By continuing, you agree to our privacy policy."}
      </p>
      <div className="cookie-actions">
        <Link href={`/${locale}/privacy`} className="btn secondary">
          {locale === "ar" ? "سياسة الخصوصية" : "Privacy policy"}
        </Link>
        <button className="btn primary" type="button" onClick={accept}>
          {locale === "ar" ? "موافق" : "Accept"}
        </button>
      </div>
    </div>
  );
}
