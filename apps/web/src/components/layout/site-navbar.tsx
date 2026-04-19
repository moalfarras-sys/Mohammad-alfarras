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
      setScrolled(window.scrollY > 50);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="top-safe sticky top-0 z-40 px-2 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "section-frame mt-2 flex flex-row items-center justify-between gap-2 rounded-full px-3 py-2 transition-all duration-500 md:mt-4 md:px-5 md:py-3",
          scrolled ? "glass-card" : "bg-transparent",
        )}
      >
        <div className="flex w-full items-center justify-between md:w-auto">
          <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-3">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="navbar-logo-shell relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition duration-500 md:h-12 md:w-12"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-glass)",
              }}
            >
              <Image src={logoSrc} alt={`${brandName} logo`} width={48} height={40} priority className="navbar-logo-img object-contain transition-all scale-75 md:scale-100" />
            </motion.span>
            <span className="hidden min-w-0 sm:grid">
              <strong className="headline-display truncate text-base font-extrabold text-foreground transition-all duration-300 group-hover:text-primary">
                {brandName}
              </strong>
              <small className="truncate text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--color-accent)", opacity: 0.8 }}>
                {tagline}
              </small>
            </span>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={alternatePath}
              aria-label={locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
              className="inline-flex h-9 items-center justify-center rounded-full border border-border-glass bg-bg-secondary px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted transition hover:text-foreground"
            >
              {locale === "ar" ? "EN" : "AR"}
            </Link>
            <motion.button
              type="button"
              aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleTheme}
              className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border-glass bg-bg-secondary text-foreground-muted shadow-sm transition-all duration-300 hover:text-foreground"
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

        <nav className="hidden w-auto items-center justify-center gap-1.5 overflow-x-auto rounded-full py-1.5 scrollbar-none md:flex lg:px-2">
          {links.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "navbar-link relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300",
                  active ? "text-primary" : "text-foreground-muted hover:text-foreground",
                  !active && "border border-border-glass bg-bg-secondary/40",
                )}
              >
                <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                {active ? (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-3 right-3 h-[3px] rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={alternatePath}
            aria-label={locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border-glass bg-bg-secondary px-4 text-xs font-bold uppercase tracking-[0.24em] text-foreground-muted transition-all duration-300 hover:text-foreground"
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
            className="navbar-theme-btn relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border-glass bg-bg-secondary text-foreground-muted transition-all duration-300 hover:text-foreground"
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
