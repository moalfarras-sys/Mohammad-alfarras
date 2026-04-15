"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import type { Locale } from "@/types/cms";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const copy = {
  ar: {
    title: "ثبّت لوحة التحكم كتطبيق",
    hint: "شغّلها من الشاشة الرئيسية بملء الشاشة، مثل أي تطبيق.",
    install: "تثبيت التطبيق",
    dismiss: "لاحقاً",
    ios: "Safari: زر المشاركة ← «إضافة إلى الشاشة الرئيسية».",
  },
  en: {
    title: "Install Control Center",
    hint: "Launch from your home screen in full screen, like a native app.",
    install: "Install app",
    dismiss: "Not now",
    ios: "Safari: Share → Add to Home Screen.",
  },
} as const;

export function AdminPwaInstallBar({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    setIsIOS(/iPad|iPhone|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const runInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  if (standalone || dismissed) return null;

  const showChromeInstall = Boolean(deferred);
  const showIosHint = isIOS && !showChromeInstall;

  if (!showChromeInstall && !showIosHint) return null;

  return (
    <div
      className="mb-4 rounded-[1.25rem] border border-primary/25 bg-[linear-gradient(90deg,rgba(0,255,135,0.12),rgba(255,107,0,0.06))] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      role="region"
      aria-label={locale === "ar" ? "تثبيت التطبيق" : "Install app"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-foreground">{t.title}</p>
          <p className="mt-1 text-xs leading-5 text-foreground-muted">{showIosHint ? t.ios : t.hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showChromeInstall && (
            <button
              type="button"
              onClick={() => void runInstall()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-black transition hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              {t.install}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-full border border-white/15 p-2 text-foreground-muted transition hover:bg-white/10 hover:text-foreground"
            aria-label={t.dismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
