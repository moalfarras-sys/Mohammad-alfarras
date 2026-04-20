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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <motion.nav
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        data-testid="mobile-dock"
        className="mobile-dock-shell pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-full px-2 py-2"
      >
        {items.map((item) => {
          const active =
            item.href === `/${locale}`
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <motion.div key={item.id} whileTap={{ scale: 0.9 }} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] font-bold transition-colors duration-300",
                  active ? "dock-active-text" : "dock-link-inactive",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="dock-pill"
                    className="dock-active-pill absolute inset-0 rounded-full"
                    transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                    aria-hidden
                  />
                ) : null}
                <Icon className={cn("relative z-10 h-[1.15rem] w-[1.15rem] shrink-0", active && "dock-active-text")} />
                <span className={cn("relative z-10 truncate", active && "dock-active-text")}>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    </div>
  );
}
