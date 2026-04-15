import { redirect } from "next/navigation";

import { MediaControlCenter } from "@/components/admin/media-control-center";
import { isAdminAuthenticated } from "@/lib/auth";
import { readSnapshot } from "@/lib/content/store";
import type { Locale } from "@/types/cms";

export default async function AdminMediaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}/admin?unauthorized=1`);
  }

  return <MediaControlCenter locale={locale} snapshot={await readSnapshot()} />;
}
