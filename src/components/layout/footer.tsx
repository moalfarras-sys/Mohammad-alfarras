import Link from "next/link";

import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

export function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer glass-card">
      <div className="container footer-row">
        <p>© {year} Mohammad Alfarras · moalfarras.space</p>
        <div className="footer-links">
          <Link href={withLocale(locale, "")}>{locale === "ar" ? "الرئيسية" : "Home"}</Link>
          <Link href={withLocale(locale, "privacy")}>{locale === "ar" ? "الخصوصية" : "Privacy"}</Link>
          <Link href={withLocale(locale, "contact")}>{locale === "ar" ? "تواصل" : "Contact"}</Link>
        </div>
      </div>
    </footer>
  );
}
