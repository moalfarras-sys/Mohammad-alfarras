import { redirect } from "next/navigation";

import { CvControlCenter } from "@/components/admin/cv-control-center";
import { isAdminAuthenticated } from "@/lib/auth";
import { getCvPageContentDocument } from "@/lib/cms-documents";
import { getCvBuilderData } from "@/lib/cv-builder";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminCvPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  const snapshot = await readSnapshot();

  return (
    <CvControlCenter
      locale={locale}
      snapshot={snapshot}
      initialBuilder={getCvBuilderData(snapshot)}
      cvPageContent={getCvPageContentDocument(snapshot)}
    />
  );
}
