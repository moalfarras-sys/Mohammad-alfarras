"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { motion } from "framer-motion";
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
      setScrolled(window.scrollY > 12);
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
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "section-frame mt-3 flex items-center justify-between gap-3 rounded-[2rem] px-4 py-3 transition-all duration-300 md:px-5",
          scrolled
            ? "glass-panel glass-panel-strong shadow-[0_24px_64px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,255,135,0.08)]"
            : "bg-transparent",
        )}
        style={scrolled && isLight ? { boxShadow: "0 18px 50px rgba(15,23,42,0.08), 0 0 0 1px rgba(0,184,90,0.06)" } : undefined}
      >
        {/* Logo */}
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3 group">
          <motion.span
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition duration-300"
            style={{
              background: isLight
                ? "linear-gradient(135deg, rgba(0,184,90,0.08), rgba(139,53,232,0.05))"
                : "linear-gradient(135deg, rgba(0,255,135,0.1), rgba(168,85,247,0.08))",
              border: isLight ? "1px solid rgba(0,184,90,0.16)" : "1px solid rgba(0,255,135,0.2)",
              boxShadow: isLight ? "0 10px 24px rgba(15,23,42,0.06)" : "0 0 20px rgba(0,255,135,0.08)",
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Moalfarras logo"
              width={49}
              height={40}
              priority
              className="object-contain"
            />
          </motion.span>
          <span className="hidden min-w-0 sm:grid">
            <strong
              className="headline-display truncate text-base text-foreground transition-all duration-300 group-hover:text-primary"
              style={{ fontWeight: 800 }}
            >
              Moalfarras
            </strong>
            <small
              className="truncate text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: "var(--primary)", opacity: 0.7 }}
            >
              {tagline}
            </small>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 rounded-full px-2 py-1.5 lg:flex"
          style={{
            background: isLight ? "rgba(255,255,255,0.82)" : "rgba(8,10,20,0.7)",
            border: isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid rgba(0,255,135,0.1)",
            backdropFilter: "blur(20px)",
          }}
        >
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                  active ? "text-background" : isLight ? "text-slate-500 hover:text-slate-900" : "text-foreground-muted hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "linear-gradient(135deg, #00ff87, #00cc6a)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            data-testid="theme-toggle"
            aria-label={!mounted ? "Toggle theme" : theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-all duration-300 hover:text-foreground"
            style={{
              background: isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.04)",
              border: isLight ? "1px solid rgba(226,232,240,0.9)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {!mounted ? <MoonStar className="h-4 w-4" /> : theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </motion.button>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={localeHref}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition-all duration-300"
              aria-label="Switch language"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,255,135,0.04))",
                border: "1px solid rgba(0,255,135,0.2)",
                color: "var(--primary)",
              }}
            >
              <span className="text-sm">{localeMeta[nextLocale].flag}</span>
              <span>{nextLocale === "ar" ? "AR" : "EN"}</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </header>
  );
}
