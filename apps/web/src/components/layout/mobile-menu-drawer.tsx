"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MoonStar, SunMedium, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";
import { cn } from "@/lib/cn";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { useThemeMode } from "./use-theme-mode";

type NavLink = { id: string; label: string; href: string };

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  brandName: string;
  tagline: string;
  logoSrc: string;
  links: NavLink[];
  pathname: string | null;
};

export function MobileMenuDrawer({
  open,
  onClose,
  locale,
  brandName,
  tagline,
  logoSrc,
  links,
  pathname,
}: MobileMenuDrawerProps) {
  const { theme, toggleTheme } = useThemeMode();
  const alternate = pathname ? alternateLocalePath(pathname, locale) : `/${locale === "ar" ? "en" : "ar"}`;
  const altLabel = localeMeta[locale === "ar" ? "en" : "ar"].label;
  const isAr = locale === "ar";

  // lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const slideFrom = isAr ? { x: "100%" } : { x: "-100%" };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="drawer"
            className={cn(
              "fixed z-[61] top-0 bottom-0 flex w-[min(22rem,92vw)] flex-col overflow-hidden shadow-2xl lg:hidden",
              isAr ? "right-0" : "left-0",
            )}
            style={{
              background: "var(--bg-surface, var(--surface))",
              borderInlineEnd: isAr ? "none" : "1px solid var(--glass-border, var(--border))",
              borderInlineStart: isAr ? "1px solid var(--glass-border, var(--border))" : "none",
            }}
            initial={slideFrom}
            animate={{ x: 0 }}
            exit={slideFrom}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            aria-label={isAr ? "القائمة الجانبية" : "Main menu"}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 border-b border-[var(--glass-border)]">
              <Link href={`/${locale}`} onClick={onClose} className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)]">
                  <Image src={logoSrc} alt={`${brandName} logo`} width={44} height={44} className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0">
                  <strong className="truncate block text-[15px] font-semibold text-[var(--text-1)]">{brandName}</strong>
                  <span className="truncate block text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-3)]">{tagline}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label={isAr ? "إغلاق القائمة" : "Close menu"}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[var(--text-3)] transition hover:text-[var(--text-1)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <ul className="grid gap-1">
                {links.map((item) => {
                  const active =
                    item.href === `/${locale}`
                      ? pathname === `/${locale}` || pathname === `/${locale}/`
                      : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex min-h-12 items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors",
                          active ? "nav-link-active text-[var(--text-1)]" : "text-[var(--text-2)] hover:text-[var(--text-1)]",
                        )}
                        style={active ? { background: "var(--bg-elevated)", border: "1px solid var(--glass-border)" } : undefined}
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight className={cn("h-4 w-4 transition", isAr && "-scale-x-100")} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-4 pb-2">
              <Link
                href={`/${locale}/contact`}
                onClick={onClose}
                className="button-liquid-primary flex w-full min-h-12 justify-center text-sm"
              >
                {isAr ? "وظّفني ←" : "Hire Me →"}
              </Link>
            </div>

            {/* Footer toggles */}
            <div className="grid grid-cols-2 gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 border-t border-[var(--glass-border)]">
              <LocalePreferenceLink
                href={alternate}
                onClick={onClose}
                aria-label={isAr ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-3)] transition hover:text-[var(--text-1)]"
              >
                {altLabel}
              </LocalePreferenceLink>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isAr ? "تبديل المظهر" : "Toggle theme"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-sm font-bold text-[var(--text-3)] transition hover:text-[var(--text-1)]"
              >
                {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                <span>{theme === "dark" ? (isAr ? "فاتح" : "Light") : isAr ? "داكن" : "Dark"}</span>
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
