"use client";

import { AppWindow, BriefcaseBusiness, House, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { cn } from "@/lib/cn";
import type { Locale } from "@/types/cms";

type DockItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export function MobileDock({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  if (pathname?.endsWith("/admin") || pathname?.includes("/admin/")) {
    return null;
  }

  const items: DockItem[] =
    locale === "ar"
      ? [
          { id: "home", label: "الرئيسية", href: `/${locale}`, icon: House },
          { id: "cv", label: "السيرة", href: `/${locale}/cv`, icon: UserRound },
          { id: "work", label: "الأعمال", href: `/${locale}/work`, icon: BriefcaseBusiness },
          { id: "apps", label: "التطبيقات", href: `/${locale}/apps`, icon: AppWindow },
          { id: "contact", label: "تواصل", href: `/${locale}/contact`, icon: Mail },
        ]
      : [
          { id: "home", label: "Home", href: `/${locale}`, icon: House },
          { id: "cv", label: "CV", href: `/${locale}/cv`, icon: UserRound },
          { id: "work", label: "Work", href: `/${locale}/work`, icon: BriefcaseBusiness },
          { id: "apps", label: "Apps", href: `/${locale}/apps`, icon: AppWindow },
          { id: "contact", label: "Contact", href: `/${locale}/contact`, icon: Mail },
        ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
      <motion.nav
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto mx-auto flex max-w-sm items-center justify-between rounded-xl bg-[var(--os-bg)]/90 backdrop-blur-2xl border border-[var(--os-border)] p-1.5 shadow-2xl"
      >
        {items.map((item) => {
          const active =
            item.href === `/${locale}`
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg transition-all duration-300",
                active ? "bg-[var(--os-text-1)] text-[var(--os-bg)]" : "text-[var(--os-text-3)] hover:text-[var(--os-text-1)]",
              )}
            >
              <Icon className="relative z-10 h-4.5 w-4.5" />
              <span className="relative z-10 text-[9px] font-black uppercase tracking-[0.1em]">{item.label}</span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
