import { notFound } from "next/navigation";

import { SitePage } from "@/components/site/page-view";
import { isLocale } from "@/lib/i18n";

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const content = await SitePage({ locale, slug: "home" });
  if (!content) notFound();

  return content;
}
