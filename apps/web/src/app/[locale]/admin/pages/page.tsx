import { redirect } from "next/navigation";

import { PagesControlCenter } from "@/components/admin/pages-control-center";
import {
  getContactPageContentDocument,
  getHomeContentDocument,
  getProjectsPageContentDocument,
  getYoutubePageContentDocument,
} from "@/lib/cms-documents";
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

  return (
    <PagesControlCenter
      locale={locale}
      snapshot={snapshot}
      homeContent={getHomeContentDocument(snapshot)}
      projectsContent={getProjectsPageContentDocument(snapshot)}
      youtubeContent={getYoutubePageContentDocument(snapshot)}
      contactContent={getContactPageContentDocument(snapshot)}
    />
  );
}
