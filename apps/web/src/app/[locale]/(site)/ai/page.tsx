import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteAssistantPage } from "@/components/site/site-assistant-page";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ar" ? "المساعد الذكي | محمد الفراس" : "Smart Assistant | Mohammad Alfarras",
    description:
      locale === "ar"
        ? "مساعد ذكي للإجابة عن خدمات محمد الفراس، MoPlayer، التفعيل، الدعم، والمشاريع."
        : "A smart assistant for Mohammad Alfarras services, MoPlayer, activation, support, and projects.",
  };
}

export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SiteAssistantPage locale={locale as Locale} />;
}
