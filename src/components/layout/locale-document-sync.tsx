"use client";

import { useEffect } from "react";

import { localeMeta } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

export function LocaleDocumentSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeMeta[locale].dir;
  }, [locale]);

  return null;
}
