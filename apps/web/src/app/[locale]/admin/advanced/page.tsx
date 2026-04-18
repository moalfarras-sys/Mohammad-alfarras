import { redirect } from "next/navigation";

import type { Locale } from "@/types/cms";

export default async function AdminAdvancedPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/settings`);
}
