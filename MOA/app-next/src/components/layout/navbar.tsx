import Link from "next/link";

import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { ThemeToggle } from "./theme-toggle";

type NavItem = {
  id: string;
  slug: string;
  icon: string;
  label: string;
};

export function Navbar({ locale, nav }: { locale: Locale; nav: NavItem[] }) {
  const oppositeLocale = locale === "ar" ? "en" : "ar";

  return (
    <header className="site-header">
      <div className="container nav-row">
        <Link href={withLocale(locale, "")} className="brand">
          <span className="brand-dot" />
          <span>MOALFARRAS</span>
        </Link>

        <nav className="nav-links" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map((item) => (
            <Link key={item.id} href={withLocale(locale, item.slug)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link href={withLocale(oppositeLocale, "")} className="btn secondary" aria-label="Switch language">
            {oppositeLocale.toUpperCase()}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
