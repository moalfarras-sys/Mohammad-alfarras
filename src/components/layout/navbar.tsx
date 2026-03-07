"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { ThemeToggle } from "./theme-toggle";

type NavItem = { id: string; slug: string; icon: string; label: string };

const navIcons: Record<string, string> = {
  home: "🏠",
  cv: "📄",
  blog: "✦",
  youtube: "▶️",
  contact: "✉️",
};

const flagMap: Record<
  Locale,
  { label: string; switchLabel: string; switchFlag: string; switchLocale: Locale }
> = {
  ar: { label: "العربية", switchLabel: "English", switchFlag: "🇬🇧", switchLocale: "en" },
  en: { label: "English", switchLabel: "العربية", switchFlag: "🇸🇾", switchLocale: "ar" },
};

export function Navbar({ locale, nav }: { locale: Locale; nav: NavItem[] }) {
  const info = flagMap[locale];
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const targetPath = pathname
    ? pathname.replace(new RegExp(`^/${locale}`), `/${info.switchLocale}`) || `/${info.switchLocale}`
    : withLocale(info.switchLocale, "");

  function closeMenu() {
    setMenuOpen(false);
  }

  function getNavIcon(item: NavItem) {
    if (item.slug === "") {
      return navIcons.home;
    }

    return navIcons[item.slug] || navIcons[item.id] || "•";
  }

  return (
    <header className={`site-nav${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-inner">
        <Link href={withLocale(locale, "")} className="nav-brand" onClick={closeMenu}>
          <Image src="/images/logo-unboxing.png" alt="MOALFARRAS" width={40} height={40} className="nav-brand-logo" />
          <span>MOALFARRAS</span>
        </Link>

        <nav className="nav-links" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map((item) => {
            const href = withLocale(locale, item.slug);
            const isActive =
              (item.slug === "" && (pathname === `/${locale}` || pathname === `/${locale}/`)) ||
              (item.slug !== "" && pathname === href);

            return (
              <Link key={item.id} href={href} className={`nav-link${isActive ? " active" : ""}`} onClick={closeMenu}>
                <span className="nav-link-icon">{getNavIcon(item)}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-controls">
          <Link href={targetPath} className="lang-toggle" aria-label={`Switch to ${info.switchLabel}`} onClick={closeMenu}>
            <span className="lang-flag">{info.switchFlag}</span>
            <span>{info.switchLabel}</span>
          </Link>

          <ThemeToggle locale={locale} />

          <button className="mobile-menu-btn" onClick={() => setMenuOpen((open) => !open)} aria-label="Menu" type="button">
            <span className={`hamburger${menuOpen ? " open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="mobile-nav glass" ref={menuRef}>
          <div className="container">
            {nav.map((item) => (
              <Link key={item.id} href={withLocale(locale, item.slug)} className="mobile-nav-link" onClick={closeMenu}>
                <span>{getNavIcon(item)}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
