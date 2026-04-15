import type { Metadata, Viewport } from "next";

import { AdminAppShell } from "@/components/admin/admin-app-shell";
import { isAdminAuthenticated } from "@/lib/auth";
import type { Locale } from "@/types/cms";

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f8fafc" }, { media: "(prefers-color-scheme: dark)", color: "#070b14" }],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const manifestPath = `/${locale}/admin/manifest.webmanifest`;

  return {
    title: locale === "ar" ? "لوحة التحكم" : "Admin",
    description: locale === "ar" ? "إدارة موقع MOALFARRAS" : "Manage MOALFARRAS",
    manifest: manifestPath,
    appleWebApp: {
      capable: true,
      title: "MA Admin",
      statusBarStyle: "black-translucent",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <>{children}</>;
  }

  return <AdminAppShell locale={locale}>{children}</AdminAppShell>;
}
