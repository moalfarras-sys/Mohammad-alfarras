import { notFound, permanentRedirect } from "next/navigation";

import { isLocale } from "@/lib/i18n";

export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  permanentRedirect(`/${locale}`);
}
