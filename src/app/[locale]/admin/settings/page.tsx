import { redirect } from "next/navigation";

import { SettingsControlCenter } from "@/components/admin/settings-control-center";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminProfileDocument, getBrandAssets, getSiteSeoDocument } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  const snapshot = await readSnapshot();

  return (
    <SettingsControlCenter
      locale={locale}
      snapshot={snapshot}
      brandAssets={getBrandAssets(snapshot)}
      adminProfile={getAdminProfileDocument(snapshot)}
      siteSeo={getSiteSeoDocument(snapshot)}
      envStatus={{
        allowlist: Boolean(process.env.ADMIN_ALLOWLIST || process.env.ADMIN_EMAIL),
        passwordHash: Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD),
        sessionSecret: Boolean(process.env.ADMIN_SESSION_SECRET),
      }}
    />
  );
}
