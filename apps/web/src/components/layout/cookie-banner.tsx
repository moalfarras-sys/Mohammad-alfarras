"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import type { Locale } from "@/types/cms";

const KEY = "moalfarras-cookie-ok";

export function CookieBanner({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const accepted = window.localStorage.getItem(KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] z-[9999] px-3 lg:bottom-8 lg:left-8 lg:right-auto lg:px-0">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.4 }}
            className="pointer-events-auto mx-auto max-w-2xl rounded-[1.5rem] p-4 shadow-2xl lg:mx-0 lg:max-w-[22rem]"
            style={{
              background: "var(--bg-glass)",
              border: "1px solid var(--border-glass)",
              backdropFilter: "blur(24px) saturate(1.6)",
              WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1">
                  <strong className="text-sm font-bold text-foreground">
                    {locale === "ar" ? "ملفات أساسية فقط" : "Essential cookies only"}
                  </strong>
                  <p className="text-xs leading-5 text-foreground-muted">
                    {locale === "ar"
                      ? "نستخدم الحد الأدنى فقط لتذكر اللغة والحفاظ على التجربة الأساسية."
                      : "Only the minimum needed to remember your language and basic preferences."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold text-[var(--os-text-1)] transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-warm))" }}
                  onClick={() => {
                    window.localStorage.setItem(KEY, "1");
                    setVisible(false);
                  }}
                >
                  {locale === "ar" ? "موافق" : "Accept"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border px-5 py-2 text-xs font-semibold text-foreground-muted transition hover:text-foreground"
                  style={{ borderColor: "var(--border-glass)" }}
                  onClick={() => setVisible(false)}
                >
                  {locale === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
