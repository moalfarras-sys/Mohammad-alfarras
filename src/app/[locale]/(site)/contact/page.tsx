import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactPage } from "@/components/site/contact-page";
import { readPage, readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "contact");
}

export default async function ContactPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [page, snapshot] = await Promise.all([readPage(locale, "contact"), readSnapshot()]);
  if (!page) notFound();

  return <ContactPage locale={locale} page={page} snapshot={snapshot} />;
}
