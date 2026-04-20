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
      setScrolled(window.scrollY > 24);
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
            "section-frame mt-3 flex flex-row items-center justify-between gap-3 rounded-full px-3 py-2 transition-all duration-500 md:px-4 md:py-2.5",
            scrolled ? "navbar-scrolled" : "bg-transparent",
          )}
        >
          {/* Brand */}
          <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-3">
            <span
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform group-hover:scale-[1.04] md:h-11 md:w-11 md:rounded-2xl"
              style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
            >
              <Image src={logoSrc} alt={`${brandName} logo`} width={44} height={44} priority className="object-cover" />
            </span>
            <span className="hidden min-w-0 sm:grid">
              <strong className="headline-display truncate text-[15px] font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">
                {brandName}
              </strong>
              <small className="truncate text-[9px] font-bold uppercase tracking-[0.26em] text-foreground-muted">
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
                    "relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors duration-300",
                    active ? "text-foreground" : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 z-0 rounded-full"
                      style={{ background: "var(--surface-soft)", border: "1px solid var(--border)" }}
                      transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
                    />
                  ) : null}
                  <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {/* Desktop-only inline toggles */}
            <Link
              href={alternatePath}
              aria-label={isAr ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
              className="hidden h-11 items-center justify-center rounded-full border px-4 text-xs font-bold uppercase tracking-[0.24em] text-foreground-muted transition hover:text-foreground lg:inline-flex"
              style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
            >
              {alternateLabel}
            </Link>
            <motion.button
              type="button"
              data-testid="theme-toggle"
              aria-label={isAr ? "تبديل المظهر" : "Toggle theme"}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="hidden h-11 w-11 items-center justify-center overflow-hidden rounded-full border text-foreground-muted transition hover:text-foreground lg:inline-flex"
              style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border text-foreground-muted transition hover:text-foreground lg:hidden"
              style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
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
