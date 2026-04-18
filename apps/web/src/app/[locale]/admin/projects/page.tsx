import { redirect } from "next/navigation";

import { ProjectsControlCenter } from "@/components/admin/projects-control-center";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  const snapshot = await readSnapshot();
  return <ProjectsControlCenter locale={locale} snapshot={snapshot} />;
}
