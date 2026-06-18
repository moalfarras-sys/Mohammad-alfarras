"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AppWindow,
  Bell,
  Command,
  FileText,
  Globe,
  Image as ImageIcon,
  Mail,
  Monitor,
  Search,
  Settings2,
  Shield,
  Smartphone,
  Tv,
  X,
} from "lucide-react";

import { useLocale } from "@/components/admin/locale-provider";

const COMMANDS = [
  {
    href: "/",
    icon: AppWindow,
    en: "Dashboard",
    ar: "لوحة التحكم",
    hintEn: "KPIs, health, quick actions",
    hintAr: "المؤشرات والصحة والاختصارات",
    keys: "overview dashboard home quick actions health",
  },
  {
    href: "/media",
    icon: ImageIcon,
    en: "Media Library",
    ar: "مكتبة الصور",
    hintEn: "Upload, replace, map image slots",
    hintAr: "رفع واستبدال وربط الصور",
    keys: "media images logo hero screenshots gallery upload replace",
  },
  {
    href: "/website#brand",
    icon: Globe,
    en: "Website Brand",
    ar: "هوية الموقع",
    hintEn: "Logo, profile image, colors",
    hintAr: "الشعار والصورة والألوان",
    keys: "website brand logo colors profile",
  },
  {
    href: "/website#site-images",
    icon: ImageIcon,
    en: "Website Image Slots",
    ar: "صور الموقع الرئيسية",
    hintEn: "Home, apps, activation, support, legal",
    hintAr: "الرئيسية والتطبيقات والتفعيل والدعم",
    keys: "home apps activation support legal image slots",
  },
  {
    href: "/website#pages",
    icon: FileText,
    en: "Pages & SEO",
    ar: "الصفحات و SEO",
    hintEn: "Draft/published pages and share images",
    hintAr: "الصفحات وصور المشاركة",
    keys: "pages seo draft published og google",
  },
  {
    href: "/website#messages",
    icon: Mail,
    en: "Website Messages",
    ar: "رسائل الموقع",
    hintEn: "Reply, resolve, archive",
    hintAr: "رد وحل وأرشفة",
    keys: "messages inbox support contact email reply",
  },
  {
    href: "/moplayer",
    icon: Settings2,
    en: "MoPlayer Hub",
    ar: "مركز MoPlayer",
    hintEn: "Classic, Pro, iOS, PC",
    hintAr: "Classic و Pro و iOS و PC",
    keys: "moplayer hub apps suite classic pro ios pc",
  },
  {
    href: "/moplayer/classic#runtime",
    icon: Smartphone,
    en: "Classic Runtime",
    ar: "تشغيل Classic",
    hintEn: "Maintenance, updates, colors, widgets",
    hintAr: "الصيانة والتحديثات والألوان والودجت",
    keys: "classic runtime maintenance update color widgets",
  },
  {
    href: "/moplayer/pro#runtime",
    icon: Tv,
    en: "Pro Runtime",
    ar: "تشغيل Pro",
    hintEn: "Maintenance, updates, announcements",
    hintAr: "الصيانة والتحديثات والتنبيهات",
    keys: "pro runtime maintenance announcement force update",
  },
  {
    href: "/moplayer/pro#visual-assets",
    icon: ImageIcon,
    en: "Pro Images",
    ar: "صور Pro",
    hintEn: "Hero, banner, screenshots",
    hintAr: "الهيرو والبنر واللقطات",
    keys: "pro images screenshots hero banner",
  },
  {
    href: "/moplayer/ios#ios-runtime",
    icon: Smartphone,
    en: "MoPlayer iOS",
    ar: "MoPlayer iOS",
    hintEn: "Store link, activation link, preview image",
    hintAr: "رابط المتجر والتفعيل والصورة",
    keys: "ios iphone app store testflight activation",
  },
  {
    href: "/moplayer/pc#images",
    icon: Monitor,
    en: "MoPlayer PC Images",
    ar: "صور MoPlayer PC",
    hintEn: "Windows hero and card images",
    hintAr: "صور ويندوز الرئيسية والبطاقة",
    keys: "pc windows desktop images installer",
  },
  {
    href: "/email",
    icon: Mail,
    en: "Email Center",
    ar: "مركز الإيميل",
    hintEn: "SMTP, inbox, replies",
    hintAr: "SMTP والرسائل والردود",
    keys: "email smtp reply inbox",
  },
  {
    href: "/ai",
    icon: Bell,
    en: "AI & Automation",
    ar: "AI والأتمتة",
    hintEn: "Assistant, events, automation status",
    hintAr: "المساعد والأحداث وحالة الأتمتة",
    keys: "ai automation assistant n8n events",
  },
  {
    href: "/moplayer/pro#telemetry",
    icon: Shield,
    en: "Devices & Diagnostics",
    ar: "الأجهزة والتشخيص",
    hintEn: "Activations, devices, support reports",
    hintAr: "التفعيل والأجهزة وتقارير الدعم",
    keys: "devices activation diagnostics licenses qr",
  },
] as const;

export function AdminCommandPalette() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((item) =>
      [item.en, item.ar, item.hintEn, item.hintAr, item.keys].some((value) => value.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <>
      <button type="button" className="admin-command-trigger" onClick={() => setOpen(true)} aria-label={t({ en: "Open command palette", ar: "فتح البحث السريع" })}>
        <Command className="h-4 w-4" />
        <span>{t({ en: "Search controls", ar: "ابحث عن التحكم" })}</span>
        <kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className="admin-command-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <section className="admin-command-panel" onClick={(event) => event.stopPropagation()}>
            <header>
              <Search className="h-5 w-5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder={t({ en: "Search images, app maintenance, SEO, messages...", ar: "ابحث عن الصور، صيانة التطبيقات، SEO، الرسائل..." })}
              />
              <button type="button" onClick={() => setOpen(false)} aria-label={t({ en: "Close", ar: "إغلاق" })}>
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="admin-command-results">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="admin-command-item"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span>
                      <Icon className="h-4 w-4" />
                    </span>
                    <strong>{locale === "ar" ? item.ar : item.en}</strong>
                    <small>{locale === "ar" ? item.hintAr : item.hintEn}</small>
                  </Link>
                );
              })}
              {!filtered.length ? (
                <p className="px-4 py-8 text-center text-sm font-bold text-[var(--text-3)]">
                  {t({ en: "No matching control found.", ar: "لا يوجد تحكم مطابق." })}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
