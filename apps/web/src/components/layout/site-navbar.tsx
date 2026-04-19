"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { useThemeMode } from "./use-theme-mode";

type NavLink = {
  id: string;
  label: string;
  href: string;
};

export function SiteNavbar({
  locale,
  links,
  tagline,
  logoSrc,
  brandName,
}: {
  locale: Locale;
  links: NavLink[];
  tagline: string;
  logoSrc: string;
  brandName: string;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeMode();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [scrolled, setScrolled] = useState(false);
  const alternatePath = pathname ? alternateLocalePath(pathname, locale) : `/${locale === "ar" ? "en" : "ar"}`;
  const alternateLabel = localeMeta[locale === "ar" ? "en" : "ar"].label;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="top-safe sticky top-0 z-40 px-2 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "section-frame mt-3 flex flex-row items-center justify-between gap-3 rounded-full px-3 py-2 transition-all duration-500 md:px-5 md:py-2.5",
          scrolled ? "navbar-scrolled" : "bg-transparent",
        )}
        style={
          scrolled
            ? {
                background: "var(--surface)",
                border: "1px solid var(--border-glass)",
                boxShadow: "var(--shadow-card)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
              }
            : undefined
        }
      >
        {/* Brand block */}
        <div className="flex w-full items-center justify-between md:w-auto">
          <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-3">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition duration-500 md:h-11 md:w-11"
              style={{ background: "var(--surface-soft)", border: "1px solid var(--border-glass)" }}
            >
              <Image src={logoSrc} alt={`${brandName} logo`} width={44} height={44} priority className="object-cover" />
            </motion.span>
            <span className="hidden min-w-0 sm:grid">
              <strong className="headline-display truncate text-[15px] font-extrabold leading-tight text-foreground transition-colors group-hover:text-primary">
                {brandName}
              </strong>
              <small className="truncate text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--primary)", opacity: 0.85 }}>
                {tagline}
              </small>
            </span>
          </Link>

          {/* Mobile right cluster */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={alternatePath}
              aria-label={locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
              className="inline-flex h-9 items-center justify-center rounded-full border px-3 text-[11px] font-bold uppercase tracking-[0.22em] transition"
              style={{ borderColor: "var(--border-glass)", background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
            >
              {locale === "ar" ? "EN" : "AR"}
            </Link>
            <motion.button
              type="button"
              aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleTheme}
              className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition"
              style={{ borderColor: "var(--border-glass)", background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
            >
              <AnimatePresence mode="wait">
                {mounted && theme === "dark" ? (
                  <motion.div key="sun" initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 90 }} transition={{ duration: 0.2 }}>
                    <SunMedium className="h-4 w-4" />
                  </motion.div>
                ) : mounted ? (
                  <motion.div key="moon" initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 90 }} transition={{ duration: 0.2 }}>
                    <MoonStar className="h-4 w-4" />
                  </motion.div>
                ) : <span className="h-4 w-4" />}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden w-auto items-center justify-center gap-1 overflow-x-auto rounded-full py-1 scrollbar-none md:flex">
          {links.map((item) => {
            const active =
              item.href === `/${locale}`
                ? pathname === `/${locale}` || pathname === `/${locale}/`
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors duration-300",
                  active ? "text-foreground" : "text-foreground-muted hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-0 rounded-full"
                    style={{ background: "var(--surface-soft)", border: "1px solid var(--border-glass)" }}
                    transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
                  />
                ) : null}
                <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop right cluster */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={alternatePath}
            aria-label={locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
            className="inline-flex h-10 items-center justify-center rounded-full border px-4 text-xs font-bold uppercase tracking-[0.24em] transition"
            style={{ borderColor: "var(--border-glass)", background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
          >
            {alternateLabel}
          </Link>
          <motion.button
            type="button"
            data-testid="theme-toggle"
            aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition"
            style={{ borderColor: "var(--border-glass)", background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
          >
            <AnimatePresence mode="wait">
              {mounted && theme === "dark" ? (
                <motion.div key="sun" initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <SunMedium className="h-4 w-4" />
                </motion.div>
              ) : mounted ? (
                <motion.div key="moon" initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <MoonStar className="h-4 w-4" />
                </motion.div>
              ) : <span className="h-4 w-4" />}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </header>
  );
}
