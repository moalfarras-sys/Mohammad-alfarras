import { redirect } from "next/navigation";

import { AdminPagesPanel } from "@/components/admin/admin-pages-panel";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminPagesRoute({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  const snapshot = await readSnapshot();
  return <AdminPagesPanel locale={locale} snapshot={snapshot} />;
}
