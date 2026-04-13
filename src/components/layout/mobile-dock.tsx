"use client";

import { BriefcaseBusiness, House, Mail, PlaySquare, UserRound } from "lucide-react";
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
    { id: "cv", label: locale === "ar" ? "السيرة" : "About", href: `/${locale}/cv`, icon: UserRound },
    { id: "projects", label: locale === "ar" ? "الأعمال" : "Work", href: `/${locale}/projects`, icon: BriefcaseBusiness },
    { id: "youtube", label: locale === "ar" ? "يوتيوب" : "YouTube", href: `/${locale}/youtube`, icon: PlaySquare },
    { id: "contact", label: locale === "ar" ? "تواصل" : "Contact", href: `/${locale}/contact`, icon: Mail },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
      <motion.nav
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        data-testid="mobile-dock"
        className="pointer-events-auto mx-auto flex max-w-sm items-center justify-between rounded-[2rem] px-2 py-2"
        style={{
          background: "rgba(5, 7, 15, 0.92)",
          border: "1px solid rgba(0, 255, 135, 0.15)",
          backdropFilter: "blur(32px) saturate(1.5)",
          WebkitBackdropFilter: "blur(32px) saturate(1.5)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,135,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
              <motion.div
              key={item.id}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              className="flex-1"
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.4rem] px-2 py-2.5 text-[10px] font-semibold transition-all duration-300",
                  active ? "text-black" : "text-foreground-soft hover:text-foreground-muted",
                )}
              >
                {active && (
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
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-[1.15rem] w-[1.15rem] shrink-0 transition-all duration-300",
                    active && "[filter:drop-shadow(0_0_6px_rgba(0,0,0,0.4))]",
                  )}
                />
                <span className={cn("relative z-10 truncate font-bold", active ? "text-black" : "")}>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    </div>
  );
}
