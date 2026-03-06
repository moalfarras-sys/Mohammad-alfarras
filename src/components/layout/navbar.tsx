"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";
import { ThemeToggle } from "./theme-toggle";

type NavItem = { id: string; slug: string; icon: string; label: string };

const navIcons: Record<string, string> = {
  home: "🏠",
  cv: "📄",
  blog: "✍️",
  youtube: "▶️",
  contact: "✉️",
};

const flagMap: Record<Locale, { flag: string; label: string; switchLabel: string; switchFlag: string; switchLocale: Locale }> = {
  ar: { flag: "🇸🇾", label: "العربية", switchLabel: "English", switchFlag: "🇬🇧", switchLocale: "en" },
  en: { flag: "🇬🇧", label: "English", switchLabel: "العربية", switchFlag: "🇸🇾", switchLocale: "ar" },
};

export function Navbar({ locale, nav }: { locale: Locale; nav: NavItem[] }) {
  const info = flagMap[locale];
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    setCurrentPath(window.location.pathname);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className={`site-nav${scrolled ? " scrolled" : ""}`}>
      <div className="container nav-inner">
        <Link href={withLocale(locale, "")} className="nav-brand">
          <Image src="/images/logo-unboxing.png" alt="Logo" width={36} height={36} className="nav-brand-logo" />
          <span>MOALFARRAS</span>
        </Link>

        <nav className="nav-links" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map((item) => {
            const href = withLocale(locale, item.slug);
            const isActive = currentPath.includes(`/${item.slug}`) || (item.slug === "" && (currentPath === `/${locale}` || currentPath === `/${locale}/`));
            return (
              <Link key={item.id} href={href} className={`nav-link${isActive ? " active" : ""}`}>
                <span className="nav-link-icon">{navIcons[item.slug] || navIcons[item.id] || "•"}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="nav-controls">
          <Link href={withLocale(info.switchLocale, "")} className="lang-toggle" aria-label={`Switch to ${info.switchLabel}`}>
            <span className="lang-flag">{info.switchFlag}</span>
            <span>{info.switchLabel}</span>
          </Link>

          <ThemeToggle locale={locale} />

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`hamburger${menuOpen ? " open" : ""}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav glass" ref={menuRef}>
          <div className="container">
            {nav.map((item) => (
              <Link key={item.id} href={withLocale(locale, item.slug)} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                <span>{navIcons[item.slug] || navIcons[item.id] || "•"}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
