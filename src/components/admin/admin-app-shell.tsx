"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookCopy,
  BriefcaseBusiness,
  FileStack,
  Home,
  Image as ImageIcon,
  LogOut,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { logoutAdminAction } from "@/lib/admin-actions";
import type { Locale } from "@/types/cms";

type AdminAppShellProps = {
  locale: Locale;
  logoSrc: string;
  siteName: string;
  adminName: string;
  adminRole: string;
  adminEmail: string;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
};

const shellCopy = {
  ar: {
    product: "Moalfarras Control Center",
    subtitle: "إدارة المحتوى والأصول والصفحات من لوحة واحدة.",
    openSite: "فتح الموقع",
    logout: "تسجيل الخروج",
    dashboard: "الرئيسية",
    pages: "الصفحات",
    projects: "المشاريع",
    cv: "السيرة",
    media: "الوسائط",
    pdfs: "ملفات PDF",
    settings: "الإعدادات",
    secure: "وصول إداري محمي",
  },
  en: {
    product: "Moalfarras Control Center",
    subtitle: "One place for pages, media, projects, CV, and PDFs.",
    openSite: "Open Site",
    logout: "Sign out",
    dashboard: "Dashboard",
    pages: "Pages",
    projects: "Projects",
    cv: "CV",
    media: "Media",
    pdfs: "PDFs",
    settings: "Settings",
    secure: "Protected admin access",
  },
} as const;

export function AdminAppShell({
  locale,
  logoSrc,
  siteName,
  adminName,
  adminRole,
  adminEmail,
  children,
}: AdminAppShellProps) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;
  const t = shellCopy[locale];

  const items: NavItem[] = [
    { href: base, label: t.dashboard, short: t.dashboard, icon: Home, match: (value) => value === base || value === `${base}/` },
    { href: `${base}/pages`, label: t.pages, short: t.pages, icon: FileStack, match: (value) => value.startsWith(`${base}/pages`) },
    {
      href: `${base}/projects`,
      label: t.projects,
      short: t.projects,
      icon: BriefcaseBusiness,
      match: (value) => value.startsWith(`${base}/projects`),
    },
    { href: `${base}/cv`, label: t.cv, short: t.cv, icon: BookCopy, match: (value) => value.startsWith(`${base}/cv`) },
    { href: `${base}/media`, label: t.media, short: t.media, icon: ImageIcon, match: (value) => value.startsWith(`${base}/media`) },
    { href: `${base}/pdfs`, label: t.pdfs, short: "PDF", icon: FileStack, match: (value) => value.startsWith(`${base}/pdfs`) },
    {
      href: `${base}/settings`,
      label: t.settings,
      short: t.settings,
      icon: Settings2,
      match: (value) => value.startsWith(`${base}/settings`) || value.startsWith(`${base}/advanced`),
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,255,135,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.08),transparent_28%),var(--bg-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-5 px-3 pb-28 pt-4 md:px-5 md:pb-6 md:pt-5">
        <aside className="hidden w-[320px] shrink-0 xl:block">
          <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)),rgba(5,8,16,0.8)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            <Link href={base} className="flex items-center gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4 transition hover:border-primary/25 hover:bg-white/[0.07]">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20">
                <img src={logoSrc} alt={`${siteName} logo`} className="h-10 w-10 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black uppercase tracking-[0.28em] text-primary">{siteName}</p>
                <h1 className="mt-1 text-lg font-black text-foreground">{t.product}</h1>
                <p className="mt-1 text-xs leading-6 text-foreground-soft">{t.subtitle}</p>
              </div>
            </Link>

            <div className="mt-5 grid gap-2">
              {items.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[1.35rem] border px-4 py-3 text-sm font-bold transition",
                      active
                        ? "border-primary/25 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(0,255,135,0.08)]"
                        : "border-transparent bg-transparent text-foreground-muted hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto space-y-4">
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-foreground">{adminName}</p>
                    <p className="truncate text-xs text-foreground-muted">{adminRole}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-foreground-soft">{adminEmail}</p>
                <p className="mt-2 text-[11px] leading-5 text-foreground-soft">{t.secure}</p>
              </div>

              <div className="grid gap-2">
                <Link
                  href={`/${locale}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-foreground transition hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                >
                  {t.openSite}
                </Link>
                <form action={logoutAdminAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/14"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-3 z-40 mb-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03)),rgba(7,10,18,0.82)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] xl:hidden">
                  <img src={logoSrc} alt={`${siteName} logo`} className="h-8 w-8 object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-primary">{siteName}</p>
                  <p className="truncate text-sm font-semibold text-foreground xl:hidden">{t.product}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href={`/${locale}`}
                  target="_blank"
                  className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-foreground-muted transition hover:border-primary/20 hover:bg-primary/10 hover:text-primary md:inline-flex"
                >
                  {t.openSite}
                </Link>
                <div className="hidden min-w-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-right md:block">
                  <p className="truncate text-xs font-bold text-foreground">{adminName}</p>
                  <p className="truncate text-[11px] text-foreground-soft">{adminRole}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="pb-6">{children}</main>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(7,10,18,0.92)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl xl:hidden"
        aria-label={locale === "ar" ? "تنقل لوحة التحكم" : "Control Center navigation"}
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-between gap-1">
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[3.55rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black transition",
                  active ? "bg-primary/12 text-primary" : "text-foreground-soft hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="truncate">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
