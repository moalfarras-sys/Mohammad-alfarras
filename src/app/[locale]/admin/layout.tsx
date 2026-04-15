import type { Metadata, Viewport } from "next";

import { AdminAppShell } from "@/components/admin/admin-app-shell";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminProfileDocument, getBrandAssets, resolveBrandAssetPaths } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eefbf4" },
    { media: "(prefers-color-scheme: dark)", color: "#070b12" },
  ],
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
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "Moalfarras Control Center" : "Moalfarras Control Center",
    description: isArabic ? "لوحة إدارة Moalfarras" : "Moalfarras internal CMS",
    manifest: manifestPath,
    appleWebApp: {
      capable: true,
      title: "Moalfarras",
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

  const snapshot = await readSnapshot();
  const brand = getBrandAssets(snapshot);
  const brandPaths = resolveBrandAssetPaths(snapshot);
  const admin = getAdminProfileDocument(snapshot);

  return (
    <AdminAppShell
      locale={locale}
      logoSrc={brandPaths.logo}
      siteName={brand.siteName[locale]}
      adminName={admin.displayName[locale]}
      adminRole={admin.role[locale]}
      adminEmail={admin.email}
    >
      {children}
    </AdminAppShell>
  );
}
