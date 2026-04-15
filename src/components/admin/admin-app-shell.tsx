"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileStack, Home, Layers, LogOut } from "lucide-react";

import { logoutAdminAction } from "@/lib/admin-actions";
import type { Locale } from "@/types/cms";
import { cn } from "@/lib/cn";

type Props = {
  locale: Locale;
  children: React.ReactNode;
};

const copy = {
  ar: {
    home: "الرئيسية",
    pages: "الصفحات",
    cv: "السيرة",
    projects: "الأعمال",
    advanced: "متقدم",
    site: "الموقع",
    logout: "خروج",
  },
  en: {
    home: "Home",
    pages: "Pages",
    cv: "CV",
    projects: "Projects",
    advanced: "Advanced",
    site: "Site",
    logout: "Out",
  },
} as const;

export function AdminAppShell({ locale, children }: Props) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;
  const t = copy[locale];

  const dockItems = [
    { href: base, label: t.home, icon: Home, match: (p: string) => p === base || p === `${base}/` },
    { href: `${base}/pages`, label: t.pages, icon: FileStack, match: (p: string) => p.startsWith(`${base}/pages`) },
    { href: `${base}/cv`, label: t.cv, icon: Layers, match: (p: string) => p.startsWith(`${base}/cv`) },
    { href: `${base}/projects`, label: t.projects, icon: Briefcase, match: (p: string) => p.startsWith(`${base}/projects`) },
  ];

  const isActive = (match: (p: string) => boolean) => match(pathname);

  return (
    <div className="admin-app-root min-h-screen">
      <header className="admin-topbar">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={base} className="admin-topbar-brand shrink-0">
            M<span className="text-primary">.</span>A
          </Link>
          <span className="hidden truncate text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-soft sm:inline">
            Studio
          </span>
        </div>

        <nav className="admin-topbar-nav" aria-label="Admin navigation">
          <Link href={base} className="admin-topbar-link">
            {t.home}
          </Link>
          <Link href={`${base}/pages`} className="admin-topbar-link">
            {t.pages}
          </Link>
          <Link href={`${base}/cv`} className="admin-topbar-link">
            {t.cv}
          </Link>
          <Link href={`${base}/projects`} className="admin-topbar-link">
            {t.projects}
          </Link>
          <Link href={`${base}/advanced`} className="admin-topbar-link text-foreground-soft">
            {t.advanced}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/${locale}`}
            target="_blank"
            className="hidden rounded-xl px-3 py-2 text-xs font-bold text-foreground-muted transition-colors hover:bg-primary/10 hover:text-primary sm:inline-flex"
          >
            {t.site}
          </Link>
          <form action={logoutAdminAction} className="hidden sm:block">
            <button type="submit" className="admin-topbar-logout">
              {t.logout}
            </button>
          </form>
        </div>
      </header>

      <main className="admin-main-safe">{children}</main>

      <nav
        className="admin-mobile-dock md:hidden"
        aria-label={locale === "ar" ? "تنقل لوحة التحكم" : "Admin navigation"}
      >
        <div className="admin-mobile-dock-inner">
          {dockItems.map((item) => {
            const active = isActive(item.match);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "admin-mobile-dock-item",
                  active && "admin-mobile-dock-item-active",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <form action={logoutAdminAction} className="contents">
            <button type="submit" className="admin-mobile-dock-item text-foreground-soft">
              <LogOut className="h-5 w-5" aria-hidden />
              <span>{t.logout}</span>
            </button>
          </form>
        </div>
      </nav>
    </div>
  );
}
