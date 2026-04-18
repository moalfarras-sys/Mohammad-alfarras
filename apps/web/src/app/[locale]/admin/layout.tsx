import type { Metadata, Viewport } from "next";

import { AdminAppShell } from "@/components/admin/admin-app-shell";
import { AdminPwaInstallBar } from "@/components/admin/admin-pwa-install-bar";
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
  viewportFit: "cover",
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
    title: isArabic ? "Moalfarras — لوحة التحكم" : "Moalfarras Control Center",
    description: isArabic ? "تطبيق ويب لإدارة الموقع والسيرة والمشاريع" : "Web app to manage your site, CV, and projects",
    applicationName: "Moalfarras Control Center",
    manifest: manifestPath,
    icons: {
      icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/images/logo.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      title: isArabic ? "لوحة Moalfarras" : "Moalfarras Control",
      statusBarStyle: "black-translucent",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
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
    return (
      <div className="px-4 pt-4 md:px-6">
        <AdminPwaInstallBar locale={locale} />
        {children}
      </div>
    );
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
