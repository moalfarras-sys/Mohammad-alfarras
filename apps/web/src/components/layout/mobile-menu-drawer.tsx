"use client";

import { ArrowUpRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";
import { socialLinks } from "@/content/site";
import { localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

type NavLink = { id: string; label: string; href: string };

function isActive(href: string, pathname: string | null, locale: Locale) {
  if (!pathname) return false;
  if (href === `/${locale}`) return pathname === `/${locale}` || pathname === `/${locale}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileMenuDrawer({
  open,
  onClose,
  locale,
  brandName,
  logoSrc,
  links,
  pathname,
  alternatePath,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  brandName: string;
  logoSrc: string;
  links: NavLink[];
  pathname: string | null;
  alternatePath: string;
}) {
  const nextLocale = locale === "ar" ? "en" : "ar";
  const isAr = locale === "ar";
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Keep keyboard focus inside the open dialog.
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="st-drawer-backdrop" onClick={onClose}>
      <div
        id="site-menu"
        ref={panelRef}
        className="st-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? "القائمة" : "Menu"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="st-drawer-head">
          <Link href={`/${locale}`} prefetch={false} onClick={onClose} className="st-brand">
            <span className="st-brand-mark">
              <Image src={logoSrc || "/images/logo.png"} alt="" width={36} height={36} />
            </span>
            <span className="st-brand-text">
              <strong>{brandName}</strong>
            </span>
          </Link>
          <button ref={closeRef} type="button" onClick={onClose} className="st-menu-button" aria-label={isAr ? "إغلاق القائمة" : "Close menu"}>
            <X size={20} aria-hidden />
          </button>
        </div>

        <nav className="st-drawer-links" aria-label={isAr ? "صفحات الموقع" : "Site pages"}>
          {links.map((item, index) => {
            const active = isActive(item.href, pathname, locale);
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={false}
                onClick={onClose}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                <span className="st-mono" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="st-drawer-foot">
          <Link href={`/${locale}/contact`} prefetch={false} onClick={onClose} className="st-btn st-btn--primary">
            {isAr ? "ابدأ مشروعك" : "Start a project"}
            <ArrowUpRight size={16} aria-hidden />
          </Link>
          <LocalePreferenceLink href={alternatePath} className="st-btn st-btn--ghost" hrefLang={nextLocale} lang={nextLocale}>
            {localeMeta[nextLocale].label}
          </LocalePreferenceLink>
          <p className="st-drawer-social">
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </p>
        </div>
      </div>
    </div>
  );
}
