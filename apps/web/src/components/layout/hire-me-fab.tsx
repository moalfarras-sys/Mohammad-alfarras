"use client";

import Link from "next/link";

import type { Locale } from "@/types/cms";

export function HireMeFab({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  return (
    <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-[45] w-fit max-w-[calc(100vw-2rem)] lg:hidden">
      <Link
        href={`/${locale}/contact`}
        className="pointer-events-auto inline-flex min-h-12 min-w-[120px] items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30"
      >
        {isAr ? "وظّفني" : "Hire Me"}
      </Link>
    </div>
  );
}
