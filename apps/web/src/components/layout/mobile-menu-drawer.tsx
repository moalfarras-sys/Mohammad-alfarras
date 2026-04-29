"use client";

import { Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

import { LocalePreferenceLink } from "@/components/layout/locale-preference-link";
import { cn } from "@/lib/cn";
import { alternateLocalePath, localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

type NavLink = { id: string; label: string; href: string };

export function MobileMenuDrawer({
  open,
  onClose,
  locale,
  brandName,
  tagline,
  logoSrc,
  links,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  brandName: string;
  tagline: string;
  logoSrc: string;
  links: NavLink[];
  pathname: string | null;
}) {
  const nextLocale = locale === "ar" ? "en" : "ar";
  const alternatePath = pathname ? alternateLocalePath(pathname, locale) : `/${nextLocale}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fresh-drawer-backdrop" onClick={onClose}>
      <div className={cn("fresh-drawer", locale === "ar" ? "fresh-drawer-left" : "fresh-drawer-right")} onClick={(event) => event.stopPropagation()}>
        <div className="fresh-drawer-head">
          <div className="fresh-brand">
            <span className="fresh-brand-mark">
              <Image src={logoSrc || "/images/logo.png"} alt={brandName} width={44} height={44} className="fresh-brand-logo" />
            </span>
            <span>
              <strong>{brandName}</strong>
              <small>{tagline}</small>
            </span>
          </div>
          <button type="button" onClick={onClose} className="fresh-icon-button" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="fresh-drawer-links">
          {links.map((item) => {
            const active =
              item.href === `/${locale}`
                ? pathname === `/${locale}` || pathname === `/${locale}/`
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.id} href={item.href} onClick={onClose} className={cn(active && "fresh-drawer-link-active")}>
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="fresh-drawer-actions">
          <LocalePreferenceLink href={alternatePath} className="fresh-button">
            {localeMeta[nextLocale].label}
          </LocalePreferenceLink>
          <Link href={`/${locale}/contact`} onClick={onClose} className="fresh-button fresh-button-primary">
            <Sparkles className="h-4 w-4" />
            {locale === "ar" ? "ابدأ التواصل" : "Start Contact"}
          </Link>
        </div>
      </div>
    </div>
  );
}
