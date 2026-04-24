"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, MoonStar, SunMedium } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";

import { MobileMenuDrawer } from "./mobile-menu-drawer";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const alternatePath = pathname ? alternateLocalePath(pathname, locale) : `/${locale === "ar" ? "en" : "ar"}`;
  const alternateLabel = localeMeta[locale === "ar" ? "en" : "ar"].label;
  const isAr = locale === "ar";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="top-safe sticky top-0 z-40 px-3 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "section-frame mt-3 flex flex-row items-center justify-between gap-3 rounded-full px-3 py-2 transition-all duration-300 md:px-4 md:py-2.5",
            scrolled ? "navbar-liquid-scrolled" : "bg-transparent",
          )}
        >
          {/* Brand — Logo first (logo.png displayed prominently) */}
          <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-3">
            <span
              className="logo-container relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--glass-border)] bg-transparent transition-all duration-300 group-hover:scale-[1.05] group-hover:opacity-90 md:h-12 md:w-12 md:rounded-2xl"
            >
              <Image
                src="/images/logo.png"
                alt={`${brandName} — شعار / Logo`}
                width={48}
                height={48}
                priority
                className="h-full w-full object-contain"
              />
            </span>
            <span className="hidden min-w-0 sm:grid">
              <strong className="font-display truncate text-[15px] font-semibold leading-tight text-[var(--text-1)] transition-colors group-hover:text-[var(--accent-glow)]">
                {brandName}
              </strong>
              <small className="truncate text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--text-3)]">
                {tagline}
              </small>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center justify-center gap-1 rounded-full py-1 scrollbar-none lg:flex">
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
                    "relative flex min-h-12 shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors duration-300",
                    active ? "nav-link-active text-[var(--text-1)]" : "text-[var(--text-3)] hover:text-[var(--text-1)]",
                  )}
                >
                  <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Desktop-only inline toggles */}
            <LocalePreferenceLink
              href={alternatePath}
              aria-label={isAr ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
              className="hidden h-12 min-w-[4.5rem] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-3)] transition hover:text-[var(--text-1)] lg:inline-flex"
            >
              {alternateLabel}
            </LocalePreferenceLink>
            <Link
              href={`/${locale}/contact`}
              className="button-liquid-primary hidden text-sm lg:inline-flex"
            >
              {isAr ? "تواصل" : "Contact"}
            </Link>
            <motion.button
              type="button"
              data-testid="theme-toggle"
              aria-label={isAr ? "تبديل المظهر" : "Toggle theme"}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="hidden h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[var(--text-3)] transition hover:text-[var(--text-1)] lg:inline-flex"
            >
              <AnimatePresence mode="wait">
                {mounted && theme === "dark" ? (
                  <motion.div key="sun" initial={{ scale: 0.6, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.6, rotate: 90 }} transition={{ duration: 0.2 }}>
                    <SunMedium className="h-4 w-4" />
                  </motion.div>
                ) : mounted ? (
                  <motion.div key="moon" initial={{ scale: 0.6, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.6, rotate: 90 }} transition={{ duration: 0.2 }}>
                    <MoonStar className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <span className="h-4 w-4" />
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile/Tablet hamburger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={isAr ? "فتح القائمة" : "Open menu"}
              aria-expanded={drawerOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[var(--text-3)] transition hover:text-[var(--text-1)] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </header>

      <MobileMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locale={locale}
        brandName={brandName}
        tagline={tagline}
        logoSrc={logoSrc}
        links={links}
        pathname={pathname}
      />
    </>
  );
}
