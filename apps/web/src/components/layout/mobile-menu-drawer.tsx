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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
              "fixed bottom-0 top-0 z-[61] flex w-[min(22rem,92vw)] flex-col overflow-hidden shadow-2xl lg:hidden",
              isAr ? "right-0" : "left-0",
            )}
            style={{
              background: "var(--os-bg)",
              borderInlineEnd: isAr ? "none" : "1px solid var(--os-border)",
              borderInlineStart: isAr ? "1px solid var(--os-border)" : "none",
            }}
            initial={slideFrom}
            animate={{ x: 0 }}
            exit={slideFrom}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            aria-label={isAr ? "القائمة الجانبية" : "Main menu"}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--os-border)] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
              <Link href={`/${locale}`} onClick={onClose} className="flex min-w-0 items-center gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-bg-secondary)] p-1.5">
                  <Image src={logoSrc} alt={`${brandName} logo`} width={48} height={48} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-[14px] font-black uppercase tracking-[-0.02em] text-[var(--os-text-1)]">{brandName}</strong>
                  <span className="block truncate text-[8px] font-black uppercase tracking-[0.3em] text-[var(--os-text-3)]">{tagline}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--os-border)] text-[var(--os-text-3)]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-8">
              <ul className="grid gap-2">
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
                          "flex h-14 items-center justify-between rounded-lg px-5 text-[14px] font-black uppercase tracking-[0.15em] transition-all",
                          active ? "bg-[var(--os-text-1)] text-[var(--os-bg)]" : "text-[var(--os-text-3)] hover:text-[var(--os-text-1)] hover:bg-[var(--os-bg-secondary)]",
                        )}
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight size={18} className={cn("transition", isAr && "-scale-x-100", active ? "opacity-100" : "opacity-30")} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="grid grid-cols-2 gap-3 border-t border-[var(--os-border)] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
              <LocalePreferenceLink
                href={alternate}
                onClick={onClose}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--os-border)] text-[10px] font-black uppercase tracking-[0.3em] text-[var(--os-text-3)]"
              >
                {altLabel}
              </LocalePreferenceLink>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-12 items-center justify-center gap-3 rounded-lg border border-[var(--os-border)] text-[10px] font-black uppercase tracking-[0.1em] text-[var(--os-text-3)]"
              >
                {theme === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
                <span>{theme === "dark" ? (isAr ? "LIGHT" : "LIGHT") : isAr ? "DARK" : "DARK"}</span>
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
