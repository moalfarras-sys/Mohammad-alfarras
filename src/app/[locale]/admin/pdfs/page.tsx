import { redirect } from "next/navigation";

import { PdfsControlCenter } from "@/components/admin/pdfs-control-center";
import { isAdminAuthenticated } from "@/lib/auth";
import { getPdfRegistry } from "@/lib/cms-documents";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminPdfsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  const snapshot = await readSnapshot();
  return <PdfsControlCenter locale={locale} registry={getPdfRegistry(snapshot)} />;
}
