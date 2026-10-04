import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";

import { AssistantTrigger } from "@/components/site/assistant-trigger";
import { socialLinks } from "@/content/site";
import type { Locale } from "@/types/cms";

type FooterLink = { id: string; label: string; href: string };

export function SiteFooter({
  locale,
  links,
  legalLinks = [],
  logoSrc,
  brandName,
}: {
  locale: Locale;
  links: FooterLink[];
  legalLinks?: FooterLink[];
  logoSrc: string;
  brandName: string;
}) {
  const isAr = locale === "ar";
  const year = new Date().getFullYear();
  const productLinks = [
    { id: "moplayer", label: "MoPlayer", href: `/${locale}/apps/moplayer` },
    { id: "apps", label: isAr ? "كل التطبيقات" : "All apps", href: `/${locale}/apps` },
    { id: "moos", label: isAr ? "نظام MoOS" : "MoOS", href: `/${locale}/moos` },
    { id: "activate", label: isAr ? "التفعيل" : "Activate", href: `/${locale}/activate` },
    { id: "support", label: isAr ? "الدعم" : "Support", href: `/${locale}/support` },
  ];
  // The main navigation minus the entries already listed under Products.
  const siteLinks = [
    ...links.filter((item) => item.id !== "apps" && item.id !== "moos"),
    { id: "about", label: isAr ? "عن محمد" : "About", href: `/${locale}/about` },
  ];
  // Privacy and Impressum always appear (Impressum is required for a
  // Germany-based commercial site); further published legal pages follow.
  const footerLegalLinks = [
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", href: `/${locale}/privacy` },
    { id: "impressum", label: isAr ? "البيانات القانونية" : "Impressum", href: `/${locale}/impressum` },
    ...legalLinks.filter((item) => item.id !== "impressum" && item.id !== "privacy"),
  ];
  const channels = [
    { label: "YouTube", href: socialLinks.youtube },
    { label: "LinkedIn", href: socialLinks.linkedin },
    { label: "GitHub", href: socialLinks.github },
    { label: "Instagram", href: socialLinks.instagram },
    { label: "WhatsApp", href: socialLinks.whatsapp },
  ];

  return (
    <footer className="st-footer" dir={isAr ? "rtl" : "ltr"}>
      <div className="st-container">
        <div className="st-footer-top st-footer-top--compact">
          <p className="st-footer-kicker st-mono">
            <span className="st-pill-dot" aria-hidden="true" />
            {isAr ? "متاح لمشاريع مختارة" : "Open to selected projects"}
          </p>
          <a className="st-footer-mail st-footer-mail--compact" href={`mailto:${socialLinks.email}`}>
            {socialLinks.email}
            <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>

        <div className="st-footer-grid">
          <div className="st-footer-brand">
            <Link href={`/${locale}`} prefetch={false} className="st-brand">
              <span className="st-brand-mark">
                <Image src={logoSrc || "/images/logo.png"} alt="" width={36} height={36} />
              </span>
              <span className="st-brand-text">
                <strong>{brandName}</strong>
              </span>
            </Link>
            <p>
              {isAr
                ? "تصميم وتطوير المواقع والمنتجات الرقمية، تطبيقات MoPlayer، ومحتوى تقني عربي. مقيم في ألمانيا، من الحسكة، ويعمل بالعربية والألمانية والإنجليزية."
                : "Websites and digital products, the MoPlayer apps and Arabic tech content. Based in Germany, from Al-Hasakah, working in Arabic, German and English."}
            </p>
          </div>

          <nav className="st-footer-col" aria-label={isAr ? "الموقع" : "Site"}>
            <p className="st-footer-heading">{isAr ? "الموقع" : "Site"}</p>
            <ul>
              {siteLinks.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} prefetch={false}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="st-footer-col" aria-label={isAr ? "المنتجات" : "Products"}>
            <p className="st-footer-heading">{isAr ? "المنتجات" : "Products"}</p>
            <ul>
              {productLinks.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} prefetch={false}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <AssistantTrigger className="st-footer-button">{isAr ? "مساعد Mo AI" : "Mo AI assistant"}</AssistantTrigger>
              </li>
            </ul>
          </nav>

          <nav className="st-footer-col" aria-label={isAr ? "القنوات" : "Channels"}>
            <p className="st-footer-heading">{isAr ? "القنوات" : "Channels"}</p>
            <ul>
              {channels.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="st-footer-bottom">
          <p>{`© ${year} ${brandName}`}</p>
          <ul className="st-footer-legal">
            {footerLegalLinks.map((item) => (
              <li key={item.id}>
                <Link href={item.href} prefetch={false}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a href="#top" className="st-footer-top-link" aria-label={isAr ? "العودة للأعلى" : "Back to top"}>
            <ArrowUp size={16} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
