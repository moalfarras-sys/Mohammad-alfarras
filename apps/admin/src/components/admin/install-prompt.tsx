"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { useLocale } from "@/components/admin/locale-provider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mf_admin_install_dismissed_at";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

export function InstallPrompt() {
  const { t, dir } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL) return;
    if (installed) return;

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [installed]);

  if (installed || !deferred) return null;

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "dismissed") {
      dismiss();
    } else {
      setDeferred(null);
    }
  }

  const side = dir === "rtl" ? { right: "auto", left: "max(14px, env(safe-area-inset-left))" } : { left: "auto", right: "max(14px, env(safe-area-inset-right))" };

  return (
    <div
      className="fade-up fixed z-[65] flex max-w-[320px] items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel-2)] px-3 py-2.5 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{ top: "max(14px, env(safe-area-inset-top))", ...side }}
      role="dialog"
      aria-live="polite"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
        <Download className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[var(--text-1)]">
          {t({ en: "Install as app", ar: "ثبّت كتطبيق" })}
        </p>
        <p className="truncate text-[10px] font-bold text-[var(--text-3)]">
          {t({ en: "Faster, full-screen on this phone.", ar: "أسرع وبشاشة كاملة على هذا الجهاز." })}
        </p>
      </div>
      <button type="button" onClick={install} className="btn btn-sm btn-primary">
        {t({ en: "Install", ar: "ثبّت" })}
      </button>
      <button type="button" onClick={dismiss} className="btn btn-sm" aria-label="Dismiss install prompt">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
