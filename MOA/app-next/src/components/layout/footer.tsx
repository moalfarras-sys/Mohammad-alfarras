import Link from "next/link";

import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

export function Footer({ locale }: { locale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <p>© {year} MOALFARRAS</p>
        <div className="footer-links">
          <Link href={withLocale(locale, "privacy")}>{locale === "ar" ? "الخصوصية" : "Privacy"}</Link>
          <Link href={withLocale(locale, "contact")}>{locale === "ar" ? "تواصل" : "Contact"}</Link>
        </div>
      </div>
    </footer>
  );
}
