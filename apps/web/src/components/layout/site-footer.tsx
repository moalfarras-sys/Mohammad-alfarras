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
const WhatsappBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12.1 0 11.9 11.9 0 0 0 1.8 18l-1.2 6 6.1-1.6a12 12 0 0 0 5.4 1.4h.1A11.9 11.9 0 0 0 24 12a11.8 11.8 0 0 0-3.5-8.5ZM12.2 21.7h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.6 1 1-3.5-.2-.4a9.7 9.7 0 0 1 15.1-12 9.6 9.6 0 0 1 2.9 6.9 9.8 9.8 0 0 1-9.7 9.6Zm5.3-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.3-1.4 8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.4Z" />
  </svg>
);
const TelegramBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M23.7 2.2 20.1 21c-.3 1.3-1 1.6-2 .9l-5.5-4-2.7 2.6c-.3.3-.5.5-1.1.5l.4-5.7L19.6 6c.5-.4-.1-.7-.7-.3L6.1 13.8.6 12.1c-1.2-.4-1.2-1.2.3-1.8L22.4 2c1-.4 1.8.2 1.3.2Z" />
  </svg>
);
const FacebookBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M24 12.1A12 12 0 1 0 10.1 24v-8.4h-3v-3.5h3V9.5c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.4l-.5 3.5h-2.9V24A12 12 0 0 0 24 12.1Z" />
  </svg>
);
const MailBrand = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
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
        <span className="text-[var(--text-3)]">{open ? "-" : "+"}</span>
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
    { id: "wa", label: "WhatsApp", href: socialLinks.whatsapp, icon: WhatsappBrand },
    { id: "tg", label: "Telegram", href: socialLinks.telegram, icon: TelegramBrand },
    { id: "fb", label: "Facebook", href: socialLinks.facebook, icon: FacebookBrand },
    { id: "mail", label: "Email", href: `mailto:${socialLinks.email}`, icon: MailBrand },
  ];

  return (
    <footer className="relative px-3 pb-10 pt-16 pb-dock md:px-6 md:pt-24 lg:pb-12">
      <div className="section-frame space-y-6">
        {/* Final CTA */}
        <section className="glass overflow-hidden rounded-[var(--radius-xl)] p-6 md:p-12">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{isAr ? "\u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629" : "Next step"}</p>
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
                    alt={isAr ? `${brandName} - \u0627\u0644\u0634\u0639\u0627\u0631 \u0627\u0644\u0631\u0633\u0645\u064a` : `${brandName} - official logo`}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <strong className="font-display block text-xl font-bold text-[var(--text-1)]">{brandName}</strong>
                  <p className="max-w-[14rem] text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-glow)] md:max-w-none">
                    {tagline}
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-7 text-[var(--text-3)]">
                {isAr
                  ? "\u0645\u0633\u0627\u062d\u0629 \u0634\u062e\u0635\u064a\u0629 \u0648\u0645\u0647\u0646\u064a\u0629 \u0648\u0627\u062d\u062f\u0629 \u062a\u062c\u0645\u0639 \u062a\u0637\u0648\u064a\u0631 \u0627\u0644\u0648\u064a\u0628\u060c \u0627\u0644\u062a\u0641\u0643\u064a\u0631 \u0627\u0644\u0645\u0646\u062a\u062c\u064a\u060c \u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0648\u0627\u062c\u0647\u0627\u062a\u060c \u0648\u0635\u0646\u0627\u0639\u0629 \u0645\u062d\u062a\u0648\u0649 \u062a\u0642\u0646\u064a \u0639\u0631\u0628\u064a \u0636\u0645\u0646 \u0645\u0646\u0638\u0648\u0645\u0629 \u0648\u0627\u0636\u062d\u0629 \u0648\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0637\u0648\u064a\u0631."
                  : "One personal and professional home for web development, product thinking, interface design, and Arabic tech content - built as a single, scalable ecosystem."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
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

            <CollapsibleSection title={isAr ? "\u062a\u0646\u0642\u0644" : "Navigate"}>
              {links.map((item) => (
                <Link key={item.href} href={item.href} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                  {item.label}
                </Link>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title={isAr ? "\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a" : "Products"}>
              <Link href={`/${locale}/apps`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                {isAr ? "\u0643\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642\u0627\u062a" : "All apps"}
              </Link>
              <Link href={`/${locale}/apps/moplayer`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                MoPlayer
              </Link>
              <Link href={`/${locale}/youtube`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                YouTube
              </Link>
              <Link href={`/${locale}/support`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                {isAr ? "\u0627\u0644\u062f\u0639\u0645" : "Support"}
              </Link>
              <Link href={`/${locale}/privacy`} className="block min-h-11 py-1.5 text-sm text-[var(--text-3)] transition hover:text-[var(--text-1)] md:py-1">
                {isAr ? "\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629" : "Privacy"}
              </Link>
            </CollapsibleSection>

            <CollapsibleSection title={isAr ? "\u062d\u0642\u0627\u0626\u0642 \u0633\u0631\u064a\u0639\u0629" : "Quick facts"}>
              <div className="flex flex-col items-start gap-2 pt-1 md:pt-0"><span className="glass inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold text-[var(--text-2)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">{isAr ? "\u0645\u0642\u064a\u0645 \u0641\u064a \u0623\u0644\u0645\u0627\u0646\u064a\u0627" : "Germany based"}</span><span className="glass inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold text-[var(--text-2)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">{isAr ? "\u0627\u0644\u062c\u0630\u0648\u0631 \u0645\u0646 \u0627\u0644\u062d\u0633\u0643\u0629\u060c \u0633\u0648\u0631\u064a\u0627" : "Al-Hasakah roots"}</span><span className="glass inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold text-[var(--text-2)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">{isAr ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629 / \u0627\u0644\u0623\u0644\u0645\u0627\u0646\u064a\u0629 / \u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629" : "AR / EN / DE"}</span><span className="glass inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold text-[var(--accent-glow)] border border-[var(--glass-border)] bg-[var(--bg-elevated)]">{isAr ? "+1.5M \u0645\u0634\u0627\u0647\u062f\u0629 \u0639\u0644\u0649 \u064a\u0648\u062a\u064a\u0648\u0628" : "1.5M+ YouTube views"}</span></div>
            </CollapsibleSection>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--glass-border)] pt-6 text-xs text-[var(--text-3)] md:flex-row md:items-center md:justify-between">
            <span>
              © {year} {brandName}. {isAr ? "\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629." : "All rights reserved."}
            </span>
            <span>{isAr ? "\u0628\u064f\u0646\u064a \u0628\u0640 Next.js \u0648 Supabase \u0648\u0645\u0639\u0627\u064a\u064a\u0631 \u0648\u064a\u0628 \u062d\u062f\u064a\u062b\u0629." : "Built with Next.js, Supabase, and modern web standards."}</span>
          </div>
        </section>
      </div>
    </footer>
  );
}
