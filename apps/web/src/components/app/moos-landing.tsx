"use client";

import type { Locale } from "@/types/cms";
import type { MoosRelease } from "@/lib/moos-release";
import { MoosV3 } from "@/components/v3/moos-v3";

/** Preserve the legacy entry point while using the maintained MoOS page. */
export function MoosLanding({ locale, release }: { locale: Locale; release: MoosRelease | null }) {
  return <main><MoosV3 locale={locale} release={release} /></main>;
}
