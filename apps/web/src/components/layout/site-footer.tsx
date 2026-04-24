"use client";

import { Mail, MessageCircleMore } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { socialLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import type { Locale } from "@/types/cms";

const WHATSAPP_URL = socialLinks.whatsapp;

type FooterLink = { id: string; label: string; href: string };

type IconProps = { className?: string };

const YoutubeBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);
const GithubBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.4 0 0 1-.3 3.4 1.2a11.7 11.7 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.7 1.8.2 3.1.1 3.4.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.6 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
  </svg>
);
const LinkedinBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3v10ZM6.5 7.7a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5ZM19 19h-3v-5.4c0-1.3-.5-2.2-1.6-2.2A1.8 1.8 0 0 0 12.7 13a2.3 2.3 0 0 0-.1.8V19h-3V9h3v1.4A3 3 0 0 1 15.3 9c2 0 3.7 1.3 3.7 4.1V19Z" />
  </svg>
);
const InstagramBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

type SectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function CollapsibleSection({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[var(--glass-border)] md:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between py-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-2)] md:hidden"
      >
        <span>{title}</span>
        <span className="text-[var(--text-3)]">{open ? "−" : "+"}</span>
      </button>
      <div className="hidden text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-2)] md:block md:pb-3">{title}</div>
      <div className={cn("grid gap-2 pb-4 md:block md:pb-0", open ? "block" : "hidden md:block")}>{children}</div>
    </div>
  );
}

export function SiteFooter({
  locale,
  brandName,
  tagline,
  footer,
  links,
  logoSrc,
}: {
  locale: Locale;
  brandName: string;
  tagline: string;
  footer: { title: string; body: string; cta: string };
  links: FooterLink[];
  logoSrc: string;
}) {
  const year = new Date().getFullYear();
  const isAr = locale === "ar";

  const socials = [
    { id: "yt", label: "YouTube", href: socialLinks.youtube, icon: YoutubeBrand },
    { id: "gh", label: "GitHub", href: socialLinks.github, icon: GithubBrand },
    { id: "li", label: "LinkedIn", href: socialLinks.linkedin, icon: LinkedinBrand },
    { id: "ig", label: "Instagram", href: socialLinks.instagram, icon: InstagramBrand },
  ];

  return (
    <footer className="relative px-3 pb-10 pt-16 pb-dock md:px-6 md:pt-24 lg:pb-12">
      <div className="section-frame space-y-6">
        {/* Final CTA */}
        <section className="glass overflow-hidden rounded-[var(--radius-xl)] p-6 md:p-12">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{isAr ? "الخطوة التالية" : "Next step"}</p>
              <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-[1.15] text-[var(--text-1)]">
                {footer.title}
              </h2>
              <p className="text-sm leading-7 text-[var(--text-2)]">{footer.body}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${locale}/contact`} className="button-liquid-primary">
                <Mail className="h-4 w-4" />
                {footer.cta}
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary">
                <MessageCircleMore className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* Main footer grid */}
        <section className="glass rounded-[var(--radius-lg)] p-5 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] transition-all duration-300 hover:scale-105">
                  <Image
                    src={logoSrc || "/images/logo.png"}
                    alt={`${brandName} — الشعار الرسمي`}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <strong className="font-display block text-xl font-bold text-[var(--text-1)]">{brandName}</strong>
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--accent-glow)]">{tagline}</p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--text-3)]">
                {isAr
                  ? "موقع شخصي ومهني واحد يجمع تطوير الويب، التفكير المنتجي، تصميم الواجهات، وصناعة المحتوى التقني العربي، ضمن منظومة واضحة وقابلة للتطوير."
                  : "One personal and professional home for web development, product thinking, interface design, and Arabic tech content — built as a single, scalable ecosystem."}
              </p>
              <div className="flex items-center gap-2">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.id}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[var(--text-3)] transition-all duration-300 hover:scale-110 hover:text-[var(--accent-glow)]"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <CollapsibleSection title={isAr ? "تنقل" : "Navigate"}>
              {links.map((item) => (
                <Link key={item.href} href={item.href} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                  {item.label}
                </Link>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title={isAr ? "المنتجات" : "Products"}>
              <Link href={`/${locale}/apps`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                {isAr ? "كل التطبيقات" : "All apps"}
              </Link>
              <Link href={`/${locale}/apps/moplayer`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                MoPlayer
              </Link>
              <Link href={`/${locale}/youtube`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                YouTube
              </Link>
              <Link href={`/${locale}/support`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                {isAr ? "الدعم" : "Support"}
              </Link>
              <Link href={`/${locale}/privacy`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                {isAr ? "الخصوصية" : "Privacy"}
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title={isAr ? "حقائق سريعة" : "Quick facts"}>
              <span className="block text-sm text-[var(--text-3)]">{isAr ? "المقر: ألمانيا" : "Based in Germany"}</span>
              <span className="block text-sm text-[var(--text-3)]">{isAr ? "الأصل: الحسكة، سوريا" : "From Al-Hasakah, Syria"}</span>
              <span className="block text-sm text-[var(--text-3)]">AR · EN · DE</span>
              <span className="block text-sm font-bold text-[var(--accent-glow)]">
                {isAr ? "+1.5M مشاهدة على يوتيوب" : "+1.5M YouTube views"}
              </span>
            </CollapsibleSection>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--glass-border)] pt-6 text-xs text-[var(--text-3)] md:flex-row md:items-center md:justify-between">
            <span>
              © {year} {brandName}. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
            </span>
            <span>{isAr ? "بُني بـ Next.js و Supabase ومعايير ويب حديثة." : "Built with Next.js, Supabase, and modern web standards."}</span>
          </div>
        </section>
      </div>
    </footer>
  );
}
