"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Globe, LayoutDashboard, LogOut, Languages, Moon, MonitorPlay, Smartphone, Sun } from "lucide-react";

import { logoutAdminAction } from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";

const NAV = [
  { href: "/", en: "Dashboard", ar: "الرئيسية", short_en: "Home", short_ar: "الرئيسية", icon: LayoutDashboard },
  { href: "/website", en: "Website", ar: "الموقع", short_en: "Website", short_ar: "الموقع", icon: Globe },
  { href: "/moplayer", en: "MoPlayer", ar: "موبلاير", short_en: "MoPlayer", short_ar: "موبلاير", icon: Smartphone },
  { href: "/moplayer-pro", en: "MoPlayer Pro", ar: "موبلاير برو", short_en: "Pro", short_ar: "برو", icon: MonitorPlay },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center rounded-2xl border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.28),rgba(99,102,241,0.24))] font-black text-[var(--accent)] shadow-[0_0_28px_rgba(34,211,238,0.12)]",
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-xs",
      ].join(" ")}
      aria-hidden="true"
    >
      MF
    </span>
  );
}

export function AdminShell({ adminEmail, role, children }: { adminEmail: string; role: string; children: ReactNode }) {
  const pathname = usePathname();
  const { t, locale, toggle } = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="admin-root min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="admin-sidebar sticky top-0 h-screen flex-col border-e border-[var(--line)] bg-[var(--panel-2)] p-4">
        <Link href="/" className="mb-7 flex items-center gap-3 px-1.5">
          <BrandMark />
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">Moalfarras</span>
            <span className="block truncate text-sm font-black text-[var(--text-1)]">{t({ en: "Control Center", ar: "مركز التحكم" })}</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="nav-item" data-active={isActive(pathname, item.href)}>
                <Icon className="h-[18px] w-[18px]" />
                {t({ en: item.en, ar: item.ar })}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-[var(--line)] pt-3">
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.03] px-3 py-2.5">
            <p className="truncate text-xs font-bold text-[var(--text-1)]">{adminEmail}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">{role}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={toggle} className="btn btn-sm flex-1" aria-label="Toggle language">
              <Languages className="h-4 w-4" />
              {locale === "ar" ? "English" : "العربية"}
            </button>
            <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="btn btn-sm" aria-label="Toggle theme">
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <form action={logoutAdminAction}>
              <button type="submit" className="btn btn-sm btn-danger" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        {/* Topbar (mobile) */}
        <header className="admin-mobile-topbar sticky top-0 z-40 items-center justify-between border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="text-sm font-black text-[var(--text-1)]">{t({ en: "Control Center", ar: "مركز التحكم" })}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggle} className="btn btn-sm" aria-label="Toggle language">
              {locale === "ar" ? "EN" : "AR"}
            </button>
            <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="btn btn-sm" aria-label="Toggle theme">
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <form action={logoutAdminAction}>
              <button type="submit" className="btn btn-sm btn-danger" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="admin-main mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 pb-28 pt-5 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Bottom dock (mobile) */}
      <nav className="dock admin-dock" style={{ gridTemplateColumns: `repeat(${NAV.length}, 1fr)` }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="dock-item" data-active={isActive(pathname, item.href)}>
              <Icon className="h-5 w-5" />
              {t({ en: item.short_en, ar: item.short_ar })}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
