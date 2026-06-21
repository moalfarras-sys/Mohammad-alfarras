"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Bot, Boxes, Globe, Image as ImageIcon, Languages, LayoutDashboard, LogOut, Mail, Moon, ShieldCheck, Sun } from "lucide-react";

import { logoutAdminAction } from "@/app/actions";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminHelperWidget } from "@/components/admin/admin-helper-widget";
import { InstallPrompt } from "@/components/admin/install-prompt";
import { useLocale } from "@/components/admin/locale-provider";

const NAV = [
  { href: "/", en: "Overview", ar: "نظرة عامة", short_en: "Home", short_ar: "الرئيسية", hint_en: "Start here", hint_ar: "ابدأ من هنا", icon: LayoutDashboard },
  { href: "/website", en: "Website", ar: "الموقع", short_en: "Website", short_ar: "الموقع", hint_en: "Text, images, SEO", hint_ar: "نصوص وصور وفهرسة", icon: Globe },
  { href: "/media", en: "Media Library", ar: "مكتبة الصور", short_en: "Media", short_ar: "صور", hint_en: "Upload, replace, map", hint_ar: "رفع وربط واستبدال", icon: ImageIcon },
  { href: "/moplayer", en: "MoPlayer Suite", ar: "MoPlayer Suite", short_en: "Apps", short_ar: "التطبيقات", hint_en: "Classic, Pro, iOS, PC", hint_ar: "Classic وPro وiOS وPC", icon: Boxes },
  { href: "/email", en: "Email", ar: "الإيميلات", short_en: "Email", short_ar: "إيميل", hint_en: "Inbox + AI replies", hint_ar: "رسائل وردود AI", icon: Mail },
  { href: "/ai", en: "AI & automation", ar: "AI والأتمتة", short_en: "AI", short_ar: "AI", hint_en: "Assistant health", hint_ar: "صحة المساعد", icon: Bot },
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
  const darkTheme = resolvedTheme === "dark";
  // Theme is unknown during SSR; render a stable icon until mounted so the
  // server and first client render match (avoids a hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="admin-root min-h-screen">
      <aside className="admin-sidebar sticky top-0 h-screen flex-col border-e border-[var(--line)] bg-[var(--panel-2)] p-4">
        <Link href="/" className="mb-5 flex items-center gap-3 px-1.5">
          <BrandMark />
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">Moalfarras</span>
            <span className="block truncate text-sm font-black text-[var(--text-1)]">{t({ en: "Control Center", ar: "مركز التحكم" })}</span>
          </span>
        </Link>

        <div className="mb-3">
          <AdminCommandPalette />
        </div>

        <div className="mb-4 rounded-3xl border border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(99,102,241,0.07))] p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">{t({ en: "Safe controls", ar: "تحكم آمن" })}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--text-3)]">
            {t({
              en: "Website, apps, media, and automation are separated so edits stay in their product.",
              ar: "الموقع والتطبيقات والصور والأتمتة مفصولة حتى يبقى كل تعديل في مكانه الصحيح.",
            })}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5" aria-label={t({ en: "Admin sections", ar: "أقسام الإدارة" })}>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="nav-item" data-active={isActive(pathname, item.href)}>
                <Icon className="h-[18px] w-[18px]" />
                <span className="min-w-0">
                  <span className="block truncate">{t({ en: item.en, ar: item.ar })}</span>
                  <span className="nav-hint block truncate">{t({ en: item.hint_en, ar: item.hint_ar })}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-[var(--line)] pt-3">
          <div className="rounded-2xl border border-[var(--line)] bg-white/[0.03] px-3 py-2.5">
            <p className="truncate text-xs font-bold text-[var(--text-1)]">{adminEmail}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">
              {role} · {t({ en: "PWA ready", ar: "جاهز كتطبيق" })}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={toggle} className="btn btn-sm flex-1" aria-label="Toggle language">
              <Languages className="h-4 w-4" />
              {locale === "ar" ? "English" : "العربية"}
            </button>
            <button type="button" onClick={() => setTheme(darkTheme ? "light" : "dark")} className="btn btn-sm" aria-label="Toggle theme">
              {!mounted || darkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
        <header className="admin-mobile-topbar sticky top-0 z-40 items-center justify-between border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <BrandMark size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[var(--text-1)]">{t({ en: "Control Center", ar: "مركز التحكم" })}</span>
              <span className="block truncate text-[10px] font-bold text-[var(--text-3)]">{t({ en: "Website · Apps · AI", ar: "الموقع · التطبيقات · AI" })}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <AdminCommandPalette />
            <button type="button" onClick={toggle} className="btn btn-sm" aria-label="Toggle language">
              {locale === "ar" ? "EN" : "AR"}
            </button>
            <button type="button" onClick={() => setTheme(darkTheme ? "light" : "dark")} className="btn btn-sm" aria-label="Toggle theme">
              {!mounted || darkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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

      <nav className="dock admin-dock" style={{ gridTemplateColumns: `repeat(${NAV.length}, 1fr)` }} aria-label={t({ en: "Mobile admin sections", ar: "أقسام الإدارة للهاتف" })}>
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
      <AdminHelperWidget />
      <InstallPrompt />
    </div>
  );
}
