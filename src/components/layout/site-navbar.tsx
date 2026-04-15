"use client";

import { MoonStar, SunMedium, Home, FileText, FolderGit2, PlaySquare, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { useThemeMode } from "./use-theme-mode";

type NavLink = {
  id: string;
  label: string;
  href: string;
};

const getIcon = (id: string, className?: string) => {
  switch (id) {
    case "home": return <Home className={className} />;
    case "cv": return <FileText className={className} />;
    case "projects": return <FolderGit2 className={className} />;
    case "youtube": return <PlaySquare className={className} />;
    case "contact": return <Mail className={className} />;
    default: return <Home className={className} />;
  }
};

export function SiteNavbar({
  locale,
  links,
  tagline,
}: {
  locale: Locale;
  links: NavLink[];
  tagline: string;
}) {
  const pathname = usePathname();
  const localeHref = useMemo(() => alternateLocalePath(pathname || `/${locale}`, locale), [locale, pathname]);
  const nextLocale = locale === "ar" ? "en" : "ar";
  const { theme, toggleTheme } = useThemeMode();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [scrolled, setScrolled] = useState(false);
  const isLight = mounted && theme === "light";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="top-safe sticky top-0 z-40 px-3 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "section-frame mt-4 flex flex-col gap-3 rounded-[2.5rem] px-4 py-3 transition-all duration-500 md:px-5 md:flex-row md:items-center md:justify-between",
          scrolled ? "glass-card" : "bg-transparent",
        )}
        style={
          scrolled
            ? {
                backdropFilter: "blur(16px)",
                background: "var(--bg-glass)",
                border: "1px solid var(--border-glass)",
              }
            : undefined
        }
      >
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3 group">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition duration-500"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-glass)",
                boxShadow: isLight ? "0 8px 20px rgba(15,23,42,0.05)" : "0 0 20px rgba(0,255,135,0.08)",
              }}
            >
              <Image src="/images/logo.png" alt="Logo" width={48} height={40} priority className={cn("object-contain transition-all", isLight && "filter brightness-50 invert")} />
            </motion.span>
            <span className="hidden min-w-0 sm:grid">
              <strong className="headline-display truncate text-base font-extrabold text-foreground transition-all duration-300 group-hover:text-primary">
                Moalfarras
              </strong>
              <small className="truncate text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--color-accent)", opacity: 0.8 }}>
                {tagline}
              </small>
            </span>
          </Link>

          {/* Right controls - Mobile Only */}
          <div className="flex items-center gap-2 md:hidden">
            <motion.button
              type="button"
              aria-label="Toggle theme"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleTheme}
              className="relative inline-flex h-10 w-10 overflow-hidden items-center justify-center rounded-full text-foreground-muted transition-all duration-300 hover:text-foreground border border-border-glass bg-bg-secondary"
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
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
              <Link href={localeHref} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all duration-300 border border-border-glass bg-bg-secondary text-primary">
                <span className="text-xs">{localeMeta[nextLocale].flag}</span>
                <span className="tracking-widest">{nextLocale === "ar" ? "AR" : "EN"}</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Mobile Nav / Desktop nav elements */}
        <nav
          className="flex items-center gap-1.5 overflow-x-auto rounded-full py-1.5 lg:px-2 scrollbar-none md:justify-center w-full md:w-auto"
        >
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300",
                  active
                    ? "text-primary"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-foreground-muted hover:text-foreground",
                  !active && "bg-bg-secondary/40 border border-border-glass"
                )}
              >
                <div className="md:hidden">
                    {getIcon(item.id, "w-4 h-4")}
                </div>
                <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-3 right-3 h-[3px] rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right controls - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <motion.button
            type="button"
            data-testid="theme-toggle"
            aria-label="Toggle theme"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="relative inline-flex h-11 w-11 overflow-hidden items-center justify-center rounded-full text-foreground-muted transition-all duration-300 hover:text-foreground border border-border-glass bg-bg-secondary"
            style={{
              boxShadow: isLight ? "0 8px 20px rgba(15,23,42,0.04)" : "none",
            }}
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

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={localeHref}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-xs font-bold transition-all duration-300 border border-border-glass bg-bg-secondary text-primary"
            >
              <span className="text-sm">{localeMeta[nextLocale].flag}</span>
              <span className="tracking-widest">{nextLocale === "ar" ? "AR" : "EN"}</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </header>
  );
}
