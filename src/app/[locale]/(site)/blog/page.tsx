import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPage } from "@/components/site/blog-page";
import { readPage, readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "blog");
}

export default async function BlogPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [page, snapshot] = await Promise.all([readPage(locale, "blog"), readSnapshot()]);
  if (!page) notFound();

  return <BlogPage locale={locale} page={page} snapshot={snapshot} />;
}
