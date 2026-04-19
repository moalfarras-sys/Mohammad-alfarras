import { Mail, MessageCircleMore } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/types/cms";

const WHATSAPP_URL = "https://wa.me/4917623419358";
const YOUTUBE_URL = "https://www.youtube.com/@Moalfarras";
const GITHUB_URL = "https://github.com/moalfarras-sys";
const LINKEDIN_URL = "https://de.linkedin.com/in/mohammad-alfarras-525531262";
const INSTAGRAM_URL = "https://www.instagram.com/moalfarras";

type FooterLink = {
  id: string;
  label: string;
  href: string;
};

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
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

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
    { id: "yt", label: "YouTube", href: YOUTUBE_URL, icon: YoutubeBrand },
    { id: "gh", label: "GitHub", href: GITHUB_URL, icon: GithubBrand },
    { id: "li", label: "LinkedIn", href: LINKEDIN_URL, icon: LinkedinBrand },
    { id: "ig", label: "Instagram", href: INSTAGRAM_URL, icon: InstagramBrand },
  ];

  return (
    <footer className="safe-bottom-space relative px-3 pb-8 pt-12 md:px-6 md:pt-20 lg:pb-10">
      <div className="section-frame space-y-6">
        {/* Final CTA */}
        <section className="contact-cta-frame">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-0 bottom-0 w-80 opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 65%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-0 bottom-0 w-80 opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--accent-glow), transparent 65%)" }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="eyebrow">{isAr ? "الخطوة التالية" : "Next step"}</span>
              <h2 className="headline-display text-3xl text-foreground md:text-[2.4rem]">{footer.title}</h2>
              <p className="text-sm leading-7 text-foreground-soft">{footer.body}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/${locale}/contact`} className="button-primary-shell">
                <Mail className="h-4 w-4" />
                {footer.cta}
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="button-whatsapp">
                <MessageCircleMore className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* Footer grid */}
        <section className="glass-card p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl"
                  style={{ background: "var(--surface-soft)", border: "1px solid var(--border-glass)" }}
                >
                  <Image src={logoSrc} alt={`${brandName} logo`} width={48} height={48} className="h-full w-full object-cover" />
                </span>
                <div>
                  <strong className="headline-display text-lg font-extrabold text-foreground">{brandName}</strong>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--primary)", opacity: 0.85 }}>
                    {tagline}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-foreground-muted">
                {isAr
                  ? "موقع شخصي ومهني واحد يجمع تطوير الويب، التفكير المنتجي، تصميم الواجهات، وصناعة المحتوى التقني العربي، ضمن منظومة واضحة وقابلة للتطوير."
                  : "One personal and professional home for web development, product thinking, interface design, and Arabic tech content — built as a single, scalable ecosystem."}
              </p>
              <div className="flex items-center gap-2">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                      style={{ borderColor: "var(--border-glass)", background: "var(--surface-soft)", color: "var(--foreground-muted)" }}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <nav className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">{isAr ? "تنقل" : "Navigate"}</span>
              <div className="grid gap-2">
                {links.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">{isAr ? "المنتجات" : "Products"}</span>
              <div className="grid gap-2">
                <Link href={`/${locale}/apps`} className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {isAr ? "كل التطبيقات" : "All apps"}
                </Link>
                <Link href="/app" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  MoPlayer
                </Link>
                <Link href="/support" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {isAr ? "الدعم الفني" : "Support"}
                </Link>
                <Link href="/privacy" className="text-sm text-foreground-muted transition-colors hover:text-foreground">
                  {isAr ? "الخصوصية" : "Privacy"}
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">{isAr ? "حقائق سريعة" : "Quick facts"}</span>
              <div className="grid gap-2 text-sm text-foreground-muted">
                <span>{isAr ? "المقر: ألمانيا" : "Based in Germany"}</span>
                <span>{isAr ? "الأصل: الحسكة، سوريا" : "From Al-Hasakah, Syria"}</span>
                <span>AR · EN · DE</span>
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>{isAr ? "+1.5M مشاهدة على يوتيوب" : "+1.5M YouTube views"}</span>
              </div>
            </div>
          </div>

          <div
            className="mt-8 flex flex-col gap-3 border-t pt-6 text-xs text-foreground-soft md:flex-row md:items-center md:justify-between"
            style={{ borderColor: "var(--border-glass)" }}
          >
            <span>© {year} {brandName}. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
            <span>
              {isAr ? "بُني بـ Next.js و Supabase ومعايير ويب حديثة." : "Built with Next.js, Supabase, and modern web standards."}
            </span>
          </div>
        </section>
      </div>
    </footer>
  );
}
