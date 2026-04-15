import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/dashboard";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminAdvancedPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  const snapshot = await readSnapshot();
  return (
    <div className="px-3 pb-6 pt-2 md:px-6">
      <AdminDashboard locale={locale} snapshot={snapshot} />
    </div>
  );
}
