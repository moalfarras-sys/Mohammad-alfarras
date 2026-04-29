"use client";

import { ArrowUpRight, BriefcaseBusiness, Home, Menu, Moon, MonitorPlay, Send, Sparkles, Sun, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { MobileMenuDrawer } from "./mobile-menu-drawer";
import { useThemeMode } from "./use-theme-mode";

type NavLink = { id: string; label: string; href: string };

const dockIcons = {
  home: Home,
  work: BriefcaseBusiness,
  apps: MonitorPlay,
  youtube: Sparkles,
  cv: UserRound,
  contact: Send,
} as const;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nextLocale = locale === "ar" ? "en" : "ar";
  const alternatePath = pathname ? alternateLocalePath(pathname, locale) : `/${nextLocale}`;
  const isAr = locale === "ar";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="fresh-nav-wrap">
        <div className={scrolled ? "site-navbar-shell fresh-nav fresh-nav-scrolled" : "site-navbar-shell fresh-nav"}>
          <Link href={`/${locale}`} className="fresh-brand">
            <span className="fresh-brand-mark">
              <Image src={logoSrc || "/images/logo.png"} alt={brandName} width={44} height={44} className="fresh-brand-logo" priority />
            </span>
            <span>
              <strong>{brandName}</strong>
              <small>{tagline}</small>
            </span>
          </Link>

          <nav className="fresh-nav-links">
            {links.map((item) => {
              const active =
                item.href === `/${locale}`
                  ? pathname === `/${locale}` || pathname === `/${locale}/`
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link key={item.id} href={item.href} className={active ? "fresh-nav-link fresh-nav-link-active" : "fresh-nav-link"}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="fresh-nav-actions">
            <LocalePreferenceLink href={alternatePath} className="fresh-icon-button fresh-lang">
              {localeMeta[nextLocale].label}
            </LocalePreferenceLink>

            <button type="button" onClick={toggleTheme} className="fresh-icon-button" aria-label="Toggle theme">
              {mounted && theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link href={`/${locale}/contact`} className="fresh-nav-cta">
              <Sparkles size={16} />
              <span>{isAr ? "ابدأ الطلب" : "Start Inquiry"}</span>
              <ArrowUpRight size={16} />
            </Link>

            <button type="button" onClick={() => setDrawerOpen(true)} className="fresh-icon-button fresh-menu-button" aria-label="Open menu">
              <Menu size={18} />
            </button>
          </div>
        </div>
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

      <nav className="mobile-bottom-dock" aria-label={isAr ? "التنقل السريع" : "Quick navigation"}>
        {links.slice(0, 6).map((item) => {
          const Icon = dockIcons[item.id as keyof typeof dockIcons] ?? Sparkles;
          const active =
            item.href === `/${locale}`
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.id} href={item.href} className={active ? "mobile-dock-link mobile-dock-link-active" : "mobile-dock-link"} aria-label={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
