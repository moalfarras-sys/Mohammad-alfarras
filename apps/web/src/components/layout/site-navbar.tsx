"use client";

import { motion } from "framer-motion";
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
          "top-safe fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "bg-[var(--os-bg)]/80 backdrop-blur-xl border-b border-[var(--os-border)] py-2" : "bg-transparent py-4"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="section-frame flex items-center justify-between gap-8"
        >
          {/* Brand */}
          <Link href={`/${locale}`} className="group flex items-center gap-4 shrink-0">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-secondary)] transition-all duration-500 group-hover:border-[var(--os-accent)]">
              <Image
                src={logoSrc || "/images/logo.png"}
                alt={brandName}
                width={40}
                height={40}
                priority
                className="h-full w-full object-contain p-1"
              />
            </span>
            <span className="hidden sm:flex flex-col">
              <strong className="text-[14px] font-black uppercase tracking-[-0.02em] text-[var(--os-text-1)]">
                {brandName}
              </strong>
              <small className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--os-text-3)]">
                {tagline}
              </small>
            </span>
          </Link>

          {/* Desktop Nav - Ultra Sharp */}
          <nav className="hidden items-center gap-2 lg:flex">
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
                    "relative h-9 px-4 flex items-center text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-md",
                    active
                      ? "text-[var(--os-text-1)] bg-[var(--os-border)]"
                      : "text-[var(--os-text-3)] hover:text-[var(--os-text-1)] hover:bg-[var(--os-bg-secondary)]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LocalePreferenceLink
              href={alternatePath}
              className="hidden h-9 items-center px-4 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--os-text-3)] border border-[var(--os-border)] rounded-md hover:text-[var(--os-text-1)] hover:border-[var(--os-text-1)] transition-all lg:flex"
            >
              {alternateLabel}
            </LocalePreferenceLink>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden h-9 w-9 items-center justify-center border border-[var(--os-border)] rounded-md text-[var(--os-text-3)] hover:text-[var(--os-text-1)] transition-all lg:flex"
            >
               {mounted && theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Contact CTA - SHARP */}
            <Link
              href={`/${locale}/contact`}
              className="h-9 px-6 flex items-center text-[11px] font-black uppercase tracking-[0.2em] bg-[var(--os-text-1)] text-[var(--os-bg)] rounded-md hover:scale-105 transition-all"
            >
              {isAr ? "تواصل" : "Connect"}
            </Link>

            {/* Mobile Menu */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex lg:hidden h-9 w-9 items-center justify-center border border-[var(--os-border)] rounded-md text-[var(--os-text-1)]"
            >
              <Menu size={18} />
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
