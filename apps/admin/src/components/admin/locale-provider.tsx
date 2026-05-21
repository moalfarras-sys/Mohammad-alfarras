"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { localeMeta, type Locale } from "@/lib/i18n";

export type Bi = { en: string; ar: string };

type LocaleContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (pair: Bi) => string;
  toggle: () => void;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persist(locale: Locale) {
  document.cookie = `mf_admin_locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  const meta = localeMeta[locale];
  document.documentElement.lang = locale;
  document.documentElement.dir = meta.dir;
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persist(next);
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((current) => {
      const next: Locale = current === "ar" ? "en" : "ar";
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const meta = localeMeta[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  const value: LocaleContextValue = {
    locale,
    dir: localeMeta[locale].dir,
    t: (pair) => pair[locale],
    toggle,
    setLocale,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return ctx;
}
