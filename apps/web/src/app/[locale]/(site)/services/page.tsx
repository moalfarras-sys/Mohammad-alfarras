import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildSiteModel } from "@/components/site/site-model";
import { ServicesV3 } from "@/components/v3/pages/services-v3";
import { isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import "@/styles/v3-pages.css";
import "@/styles/v3-services.css";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale as Locale, "services");
}

export default async function LocaleServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const model = await buildSiteModel({ locale: locale as Locale, slug: "services" });
  return <ServicesV3 model={model} />;
}
