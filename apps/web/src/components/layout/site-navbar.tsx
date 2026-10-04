"use client";

import { ArrowUpRight, BriefcaseBusiness, Home, Menu, MonitorPlay, Send, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { MobileMenuDrawer } from "./mobile-menu-drawer";

type NavLink = { id: string; label: string; href: string };

const dockIcons = {
  home: Home,
  work: BriefcaseBusiness,
  services: Wrench,
  apps: MonitorPlay,
  contact: Send,
} as const;

const fallbackLogoSrc = "/images/logo.png";

export function isActiveLink(href: string, pathname: string | null, locale: Locale) {
  if (!pathname) return false;
  if (href === `/${locale}`) return pathname === `/${locale}` || pathname === `/${locale}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const brandLogoSrc = logoFailed ? fallbackLogoSrc : logoSrc || fallbackLogoSrc;
  const nextLocale = locale === "ar" ? "en" : "ar";
  const alternatePath = pathname ? alternateLocalePath(pathname, locale) : `/${nextLocale}`;
  const isAr = locale === "ar";

  // The phone dock shows five short essentials; everything else lives in the menu.
  const dockShortLabels: Record<keyof typeof dockIcons, { ar: string; en: string }> = {
    home: { ar: "الرئيسية", en: "Home" },
    work: { ar: "الأعمال", en: "Work" },
    services: { ar: "الخدمات", en: "Services" },
    apps: { ar: "MoPlayer", en: "MoPlayer" },
    contact: { ar: "تواصل", en: "Contact" },
  };
  const mobileDockLinks = (Object.keys(dockShortLabels) as Array<keyof typeof dockIcons>)
    .map((id) => {
      const item = links.find((link) => link.id === id);
      return item ? { ...item, id, label: dockShortLabels[id][isAr ? "ar" : "en"] } : null;
    })
    .filter((item): item is NavLink & { id: keyof typeof dockIcons } => item !== null);
  const hideMobileDock = Boolean(pathname?.includes("/activate") || pathname?.includes("/moplayer/setup"));

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 12));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <>
      <header className="st-nav-wrap">
        <div className={scrolled ? "st-nav is-scrolled" : "st-nav"}>
          <Link href={`/${locale}`} prefetch={false} className="st-brand" aria-label={isAr ? `${brandName} — الرئيسية` : `${brandName} — home`}>
            <span className="st-brand-mark">
              <Image src={brandLogoSrc} alt="" width={36} height={36} loading="eager" onError={() => setLogoFailed(true)} />
            </span>
            <span className="st-brand-text">
              <strong>{brandName}</strong>
              <small>{tagline}</small>
            </span>
          </Link>

          <nav className="st-nav-links" aria-label={isAr ? "التنقل الرئيسي" : "Main"}>
            {links.map((item) => {
              const active = isActiveLink(item.href, pathname, locale);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={false}
                  className={active ? "st-nav-link is-active" : "st-nav-link"}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="st-nav-actions">
            <LocalePreferenceLink href={alternatePath} className="st-lang" hrefLang={nextLocale} lang={nextLocale}>
              {localeMeta[nextLocale].label}
            </LocalePreferenceLink>
            <Link href={`/${locale}/contact`} prefetch={false} className="st-btn st-btn--primary st-btn--sm st-nav-cta">
              {isAr ? "ابدأ مشروعك" : "Start a project"}
              <ArrowUpRight size={15} aria-hidden />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="st-menu-button"
              aria-label={isAr ? "فتح القائمة" : "Open menu"}
              aria-expanded={drawerOpen}
              aria-controls="site-menu"
            >
              <Menu size={20} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MobileMenuDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        locale={locale}
        brandName={brandName}
        logoSrc={brandLogoSrc}
        links={links}
        pathname={pathname}
        alternatePath={alternatePath}
      />

      {!hideMobileDock ? (
        <nav className="st-dock" aria-label={isAr ? "التنقل السريع" : "Quick navigation"}>
          {mobileDockLinks.map((item) => {
            const Icon = dockIcons[item.id];
            const active = isActiveLink(item.href, pathname, locale);
            return (
              <Link key={item.id} href={item.href} prefetch={false} className="st-dock-link" aria-current={active ? "page" : undefined}>
                <Icon size={19} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
