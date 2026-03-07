import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CVPage } from "@/components/site/cv-page";
import { readPage, readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "cv");
}

export default async function CvPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [page, snapshot] = await Promise.all([readPage(locale, "cv"), readSnapshot()]);
  if (!page) notFound();

  return <CVPage locale={locale} page={page} snapshot={snapshot} />;
}
