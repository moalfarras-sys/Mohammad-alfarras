"use client";

import Image from "next/image";
import Link from "next/link";
import { socialLinks } from "@/content/site";
import type { Locale } from "@/types/cms";

type FooterLink = { id: string; label: string; href: string };
type QuickFact = { label: string; value: string };

const SvgYoutube = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);
const SvgGithub = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.4 0 0 1-.3 3.4 1.2a11.7 11.7 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.7 1.8.2 3.1.1 3.4.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.6 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
  </svg>
);
const SvgLinkedin = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3v10ZM6.5 7.7a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5ZM19 19h-3v-5.4c0-1.3-.5-2.2-1.6-2.2A1.8 1.8 0 0 0 12.7 13a2.3 2.3 0 0 0-.1.8V19h-3V9h3v1.4A3 3 0 0 1 15.3 9c2 0 3.7 1.3 3.7 4.1V19Z" />
  </svg>
);
const SvgInstagram = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const SvgWhatsapp = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12.1 0 11.9 11.9 0 0 0 1.8 18l-1.2 6 6.1-1.6a12 12 0 0 0 5.4 1.4h.1A11.9 11.9 0 0 0 24 12a11.8 11.8 0 0 0-3.5-8.5ZM12.2 21.7h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.6 1 1-3.5-.2-.4a9.7 9.7 0 0 1 15.1-12 9.6 9.6 0 0 1 2.9 6.9 9.8 9.8 0 0 1-9.7 9.6Zm5.3-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.3-1.4 8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.4Z" />
  </svg>
);

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

  const socials = [
    { href: socialLinks.youtube,   icon: <SvgYoutube />,   label: "YouTube",   color: "hover:text-red-500" },
    { href: socialLinks.github,    icon: <SvgGithub />,    label: "GitHub",    color: "hover:text-[var(--os-text-1)]" },
    { href: socialLinks.linkedin,  icon: <SvgLinkedin />,  label: "LinkedIn",  color: "hover:text-blue-400" },
    { href: socialLinks.instagram, icon: <SvgInstagram />, label: "Instagram", color: "hover:text-pink-400" },
    { href: socialLinks.whatsapp,  icon: <SvgWhatsapp />,  label: "WhatsApp",  color: "hover:text-emerald-400" },
  ];

  const facts =
    quickFacts ??
    (isAr
      ? [
          { label: "مقيم في", value: "ألمانيا" },
          { label: "الجذور", value: "الحسكة، سوريا" },
          { label: "اللغات", value: "العربية / الألمانية / الإنجليزية" },
          { label: "يوتيوب", value: "+1.5M مشاهدة على يوتيوب" },
          { label: "المشتركون", value: "6.1K+" },
          { label: "الفيديوهات", value: "162" },
          { label: "المنتج", value: "MoPlayer" },
        ]
      : [
          { label: "Based in", value: "Germany" },
          { label: "Roots", value: "Al-Hasakah, Syria" },
          { label: "Languages", value: "Arabic / German / English" },
          { label: "YouTube", value: "1.5M+ YouTube views" },
          { label: "Subscribers", value: "6.1K+" },
          { label: "Videos", value: "162" },
          { label: "Product", value: "MoPlayer" },
        ]);

  const navGroups = [
    {
      title: isAr ? "الموقع" : "Site",
      links: links.slice(0, Math.ceil(links.length / 2)),
    },
    {
      title: isAr ? "المنتجات" : "Products",
      links: [
        { id: "moplayer", label: "MoPlayer", href: `/${locale}/apps/moplayer` },
        { id: "activate", label: isAr ? "التفعيل" : "Activate", href: `/${locale}/activate` },
        { id: "support",  label: isAr ? "الدعم" : "Support",   href: `/${locale}/support` },
      ],
    },
    {
      title: isAr ? "قانوني" : "Legal",
      links: [
        { id: "privacy", label: isAr ? "الخصوصية" : "Privacy Policy", href: `/${locale}/privacy` },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 border-t border-[var(--os-border)]" dir={isAr ? "rtl" : "ltr"}>
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--os-teal)]/40 to-transparent" />

      <div className="section-frame py-16">
        {/* ── Top grid ── */}
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href={`/${locale}`} className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--os-border)] bg-black/5 dark:bg-white/5">
                <Image src={logoSrc || "/images/logo.png"} alt={brandName} width={40} height={40} className="h-full w-full object-contain" />
              </span>
              <span className="text-[15px] font-bold text-[var(--os-text-1)]" style={{ fontFamily: "var(--os-font-en)" }}>
                {brandName}
              </span>
            </Link>

            <p className="text-[13px] leading-relaxed text-[var(--os-text-3)] max-w-[280px]">
              {isAr
                ? "مطوّر ويب، مصمم واجهات، صانع MoPlayer، وصانع محتوى تقني عربي مقيم في ألمانيا."
                : "Web developer, UI designer, creator of MoPlayer, and Arabic tech content creator based in Germany."}
            </p>

            {/* Social row */}
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border border-[var(--os-border)] bg-black/5 dark:bg-white/5 text-[var(--os-text-3)] transition ${s.color} hover:border-white/20`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav link groups */}
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-text-3)]">
                {group.title}
              </p>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-[13px] font-medium text-[var(--os-text-2)] transition hover:text-[var(--os-teal)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Quick facts (separate cards — avoids “glued” text) ── */}
        <div className="mt-16 flex flex-wrap gap-3 sm:mt-20 sm:gap-4">
          {facts.map((f) => (
            <div
              key={`${f.label}-${f.value}`}
              className="min-w-[calc(50%-0.375rem)] flex-1 basis-[140px] rounded-xl border border-[var(--os-border)] bg-[var(--os-bg-secondary)]/50 px-4 py-3 sm:min-w-[160px] sm:px-5 sm:py-4"
            >
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--os-text-3)]">
                {f.label}
              </span>
              <span className="block text-[15px] font-bold leading-snug tracking-normal text-[var(--os-text-1)] [overflow-wrap:anywhere]">
                {f.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-20 flex flex-col items-center justify-between gap-10 border-t border-[var(--os-border)] pt-12 text-[11px] text-[var(--os-text-3)] sm:flex-row font-black uppercase tracking-[0.2em]">
          <p>© {year} {brandName}. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            <Link href={`/${locale}/privacy`} className="hover:text-[var(--os-text-1)] transition-colors">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--os-accent)]" />
              <p className="text-[var(--os-text-1)]">{isAr ? "ألمانيا 🇩🇪" : "Germany 🇩🇪"}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
