"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";
import { cn } from "@/lib/cn";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { MobileMenuDrawer } from "./mobile-menu-drawer";
import { useThemeMode } from "./use-theme-mode";

type NavLink = { id: string; label: string; href: string };

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
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const alternatePath = pathname ? alternateLocalePath(pathname, locale) : `/${locale === "ar" ? "en" : "ar"}`;
  const alternateLabel = localeMeta[locale === "ar" ? "en" : "ar"].label;
  const isAr = locale === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "top-safe fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "navbar-scrolled" : "bg-transparent"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="section-frame flex h-16 items-center justify-between gap-4 md:h-18"
        >
          {/* Brand */}
          <Link href={`/${locale}`} className="group flex items-center gap-3 shrink-0">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[var(--os-border)] bg-black/5 dark:bg-white/5 transition-transform duration-300 group-hover:scale-105">
              <Image
                src={logoSrc || "/images/logo.png"}
                alt={brandName}
                width={36}
                height={36}
                priority
                className="h-full w-full object-contain"
              />
            </span>
            <span className="hidden sm:flex flex-col">
              <strong
                className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-[var(--os-text-1)] transition-colors group-hover:text-[var(--os-teal)]"
                style={{ fontFamily: "var(--os-font-en)" }}
              >
                {brandName}
              </strong>
              <small className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--os-text-3)]">
                {tagline}
              </small>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
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
                    "relative flex h-10 items-center rounded-full px-4 text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "text-[var(--os-teal)] bg-[var(--os-teal-soft)]"
                      : "text-[var(--os-text-3)] hover:text-[var(--os-text-1)] hover:bg-white/[0.05]"
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[var(--os-teal-soft)] border border-[var(--os-teal-border)]"
                      style={{ zIndex: -1 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <LocalePreferenceLink
              href={alternatePath}
              aria-label={isAr ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
              className="hidden h-9 items-center justify-center rounded-full border border-[var(--os-border)] bg-black/5 dark:bg-white/5 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--os-text-3)] transition hover:text-[var(--os-text-1)] hover:border-[var(--os-teal-border)] lg:inline-flex"
            >
              {alternateLabel}
            </LocalePreferenceLink>

            {/* Contact CTA */}
            <Link
              href={`/${locale}/contact`}
              className="hidden h-9 items-center gap-2 rounded-full border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] px-5 text-[12px] font-bold text-[var(--os-teal)] transition hover:bg-[var(--os-teal)] hover:text-[var(--os-bg)] lg:inline-flex"
            >
              {isAr ? "تواصل" : "Contact"}
            </Link>

            {/* Theme toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--os-border)] bg-black/5 dark:bg-white/5 text-[var(--os-text-3)] transition hover:text-[var(--os-text-1)] lg:inline-flex"
            >
              <AnimatePresence mode="wait">
                {mounted && theme === "dark" ? (
                  <motion.div key="sun" initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 90 }} transition={{ duration: 0.18 }}>
                    <Sun className="h-4 w-4" />
                  </motion.div>
                ) : mounted ? (
                  <motion.div key="moon" initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 90 }} transition={{ duration: 0.18 }}>
                    <Moon className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <span className="h-4 w-4" />
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={isAr ? "فتح القائمة" : "Open menu"}
              aria-expanded={drawerOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--os-border)] bg-black/5 dark:bg-white/5 text-[var(--os-text-2)] transition hover:text-[var(--os-text-1)] lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" />
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
