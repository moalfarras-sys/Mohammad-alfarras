"use client";

import type { CmsSnapshot, Locale } from "@/types/cms";

import { AdminDashboard } from "./dashboard";

export function PremiumAdminDashboard({ locale, snapshot }: { locale: Locale; snapshot: CmsSnapshot }) {
  return <AdminDashboard locale={locale} snapshot={snapshot} />;
}
