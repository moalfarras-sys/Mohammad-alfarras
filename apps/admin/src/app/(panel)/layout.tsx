import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/login");
  }

  return (
    <AdminShell adminEmail={admin.email} role={admin.role}>
      {children}
    </AdminShell>
  );
}
