"use client";

import Image from "next/image";
import Link from "next/link";

import { socialLinks } from "@/content/site";
import type { Locale } from "@/types/cms";

type FooterLink = { id: string; label: string; href: string };
type QuickFact = { label: string; value: string };

export function SiteFooter({
  locale,
  links,
  logoSrc,
  brandName,
  quickFacts,
}: {
  locale: Locale;
  links: FooterLink[];
  logoSrc: string;
  brandName: string;
  quickFacts?: QuickFact[];
}) {
  const isAr = locale === "ar";
  const year = new Date().getFullYear();
  const productLinks = [
    { id: "moplayer", label: "MoPlayer", href: `/${locale}/apps/moplayer` },
    { id: "activate", label: isAr ? "التفعيل" : "Activate", href: `/${locale}/activate` },
    { id: "support", label: isAr ? "الدعم" : "Support", href: `/${locale}/support` },
    { id: "privacy", label: isAr ? "الخصوصية" : "Privacy", href: `/${locale}/privacy` },
  ];

  return (
    <footer className="site-footer-wrap mt-20 pb-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="section-frame">
        <div className="fresh-footer">
          <div className="fresh-footer-brand">
            <span className="fresh-brand-mark">
              <Image src={logoSrc || "/images/logo.png"} alt={brandName} width={52} height={52} className="fresh-brand-logo" />
            </span>
            <div>
              <strong>{brandName}</strong>
              <p>
                {isAr
                  ? "منظومة رقمية شخصية تجمع الويب والمنتجات والمحتوى والخبرة التشغيلية داخل تجربة واحدة واضحة."
                  : "A personal digital system connecting products, websites, media, and operational clarity inside one clear experience."}
              </p>
            </div>
          </div>

          {quickFacts?.length ? (
            <div className="fresh-footer-facts">
              {quickFacts.map((fact) => (
                <div key={`${fact.label}-${fact.value}`}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="fresh-footer-grid">
            <div>
              <p className="fresh-eyebrow">{isAr ? "التنقل" : "Navigation"}</p>
              {links.slice(0, 6).map((item) => (
                <Link key={item.id} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="fresh-eyebrow">{isAr ? "المنتج" : "Product"}</p>
              {productLinks.map((item) => (
                <Link key={item.id} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="fresh-eyebrow">{isAr ? "القنوات" : "Channels"}</p>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>

          <div className="fresh-footer-bottom">
            <p>{`Copyright ${year} ${brandName}`}</p>
            <Link href={`/${locale}/privacy`}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
