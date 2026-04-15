import { redirect } from "next/navigation";

import { ProjectsStudio } from "@/components/admin/projects-studio";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const [{ locale }, authenticated, snapshot] = await Promise.all([params, isAdminAuthenticated(), readSnapshot()]);

  if (!authenticated) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  return (
    <div className="px-3 pb-6 pt-2 md:px-6">
      <ProjectsStudio locale={locale} snapshot={snapshot} />
    </div>
  );
}
