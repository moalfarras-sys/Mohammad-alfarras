"use client";

import { BriefcaseBusiness, Download, House, Mail, UserRound } from "lucide-react";
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

  if (pathname?.endsWith("/admin")) {
    return null;
  }

  const items: DockItem[] = [
    { id: "home", label: locale === "ar" ? "الرئيسية" : "Home", href: `/${locale}`, icon: House },
    { id: "app", label: "MoPlayer", href: "/app", icon: Download },
    { id: "cv", label: locale === "ar" ? "السيرة" : "About", href: `/${locale}/cv`, icon: UserRound },
    { id: "projects", label: locale === "ar" ? "الأعمال" : "Work", href: `/${locale}/projects`, icon: BriefcaseBusiness },
    { id: "contact", label: locale === "ar" ? "تواصل" : "Contact", href: `/${locale}/contact`, icon: Mail },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
      <motion.nav
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        data-testid="mobile-dock"
        className="mobile-dock-shell pointer-events-auto mx-auto flex max-w-sm items-center justify-between rounded-4xl px-2 py-2"
      >
        {items.map((item) => {
          const active = pathname === item.href || pathname === item.href + "/";
          const Icon = item.icon;
          return (
            <motion.div key={item.id} whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.05 }} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.4rem] px-2 py-2.5 text-[11px] font-semibold transition-all duration-300",
                  active ? "text-[#0a0a0a]" : "dock-link-inactive",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-x-0.5 inset-y-0 rounded-[1.2rem]"
                    style={{
                      background: "linear-gradient(135deg, #00ff87, #00cc6a)",
                      boxShadow: "0 0 20px rgba(0,255,135,0.4)",
                    }}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    aria-hidden="true"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-all duration-300",
                    active && "filter-[drop-shadow(0_0_6px_rgba(0,0,0,0.4))]",
                  )}
                />
                <span className={cn("relative z-10 truncate font-bold", active && "text-[#0a0a0a]")}>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    </div>
  );
}
