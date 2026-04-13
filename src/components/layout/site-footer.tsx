import { MessageCircleMore } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { rebuildContent } from "@/data/rebuild-content";
import type { Locale } from "@/types/cms";

const WHATSAPP_URL = "https://wa.me/4917623419358";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = rebuildContent[locale];
  const year = new Date().getFullYear();

  const links = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/cv`, label: t.nav.cv },
    { href: `/${locale}/projects`, label: t.nav.projects },
    { href: `/${locale}/youtube`, label: t.nav.youtube },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];

  return (
    <footer className="safe-bottom-space relative px-3 pb-8 pt-12 md:px-6 md:pt-16 lg:pb-10">
      <div className="section-frame space-y-5">

        {/* CTA Banner */}
        <section
          className="relative overflow-hidden rounded-[2.5rem] p-7 md:p-10"
          style={{
            background: "linear-gradient(135deg, rgba(8,10,20,0.95), rgba(5,7,15,0.98))",
            border: "1px solid rgba(0,255,135,0.15)",
            backdropFilter: "blur(32px)",
            boxShadow: "0 0 80px rgba(0,255,135,0.06), 0 40px 120px rgba(0,0,0,0.5)",
          }}
        >
          {/* Decorative glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 bottom-0 top-0 w-72 opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(0,255,135,0.5), transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-0 top-0 w-72 opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.5), transparent)" }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span
                className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em]"
                style={{
                  background: "rgba(0,255,135,0.06)",
                  border: "1px solid rgba(0,255,135,0.2)",
                  color: "var(--primary)",
                }}
              >
                {locale === "ar" ? "الخطوة التالية" : "Next step"}
              </span>
              <h2
                className="max-w-xl text-3xl font-extrabold leading-[1.15] text-foreground md:text-4xl"
                style={{ fontFamily: "var(--font-arabic), system-ui" }}
              >
                {t.footer.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-foreground-muted">{t.footer.body}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/${locale}/contact`} className="button-primary-shell">
                {t.contact.primaryCta}
              </Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="button-whatsapp">
                <MessageCircleMore className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <section
          className="rounded-[2rem] p-6 md:p-8"
          style={{
            background: "rgba(8,10,20,0.7)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.7fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,135,0.1), rgba(168,85,247,0.08))",
                    border: "1px solid rgba(0,255,135,0.2)",
                    boxShadow: "0 0 20px rgba(0,255,135,0.08)",
                  }}
                >
                  <Image
                    src="/images/logo.png"
                    alt="Moalfarras logo"
                    width={59}
                    height={48}
                    className="object-contain"
                  />
                </span>
                <div>
                  <strong
                    className="text-xl text-foreground"
                    style={{ fontFamily: "var(--font-brand)", fontWeight: 800 }}
                  >
                    Moalfarras
                  </strong>
                  <p className="text-xs font-semibold" style={{ color: "var(--primary)", opacity: 0.8 }}>
                    {t.navTagline}
                  </p>
                </div>
              </div>
              <p className="max-w-xl text-sm leading-7 text-foreground-muted">{t.footer.body}</p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">
                {locale === "ar" ? "التنقل" : "Navigate"}
              </span>
              <div className="grid gap-2">
                {links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-foreground-muted transition duration-300 hover:text-foreground"
                    style={{ ["--tw-text-opacity" as string]: 1 }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground-soft">
                {locale === "ar" ? "معلومة سريعة" : "Quick facts"}
              </span>
              <div className="grid gap-2 text-sm text-foreground-muted">
                <span>{locale === "ar" ? "📍 الموقع: ألمانيا" : "📍 Based in Germany"}</span>
                <span>{locale === "ar" ? "🌍 الأصل: الحسكة" : "🌍 From Al-Hasakah"}</span>
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                  {locale === "ar" ? "+1.5M مشاهدة يوتيوب" : "+1.5M YouTube views"}
                </span>
                <span className="text-foreground-soft">© {year} Moalfarras</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </footer>
  );
}
