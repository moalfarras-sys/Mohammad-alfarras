"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

const KEY = "moalfarras-cookie-ok";

export function CookieBanner({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(KEY);
    if (!accepted) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] z-[9999] px-3 lg:bottom-8 lg:left-8 lg:right-auto lg:px-0">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="pointer-events-auto section-frame glass-panel mx-auto max-w-2xl rounded-[2rem] p-5 shadow-4xl lg:mx-0 lg:max-w-[22rem]"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <strong className="text-sm font-semibold text-foreground">
              {locale === "ar" ? "ملفات أساسية فقط" : "Essential cookies only"}
            </strong>
            <p className="text-sm leading-6 text-foreground-muted">
              {locale === "ar"
                ? "نستخدم الحد الأدنى فقط لتذكر اللغة والحفاظ على التجربة الأساسية دون أدوات تتبع مزعجة."
                : "Only the minimum needed to remember language and preserve the core experience."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="button-primary-shell"
              onClick={() => {
                window.localStorage.setItem(KEY, "1");
                setVisible(false);
              }}
            >
              {locale === "ar" ? "موافق" : "Accept"}
            </button>
            <button type="button" className="button-secondary-shell" onClick={() => setVisible(false)}>
              {locale === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
