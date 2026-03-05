import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PwaRegister } from "@/components/layout/pwa-register";
import { readNav, readPage, readThemeTokens } from "@/lib/content/store";
import { isLocale, localeMeta } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const home = await readPage(locale, "home");
  if (!home) return {};

  return {
    title: home.seo.title,
    description: home.seo.description,
    openGraph: {
      title: home.seo.ogTitle,
      description: home.seo.ogDescription,
      locale,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const nav = await readNav(locale);
  const lightTokens = await readThemeTokens("light");
  const darkTokens = await readThemeTokens("dark");

  const lightVars = lightTokens.reduce<Record<string, string>>((acc, token) => {
    acc[`--light-${token.token_key}`] = token.token_value;
    return acc;
  }, {});

  const darkVars = darkTokens.reduce<Record<string, string>>((acc, token) => {
    acc[`--dark-${token.token_key}`] = token.token_value;
    return acc;
  }, {});

  const themeStyle = { ...lightVars, ...darkVars } as CSSProperties;

  return (
    <div lang={locale} dir={localeMeta[locale].dir} className="app-shell" style={themeStyle}>
      <PwaRegister />
      <Navbar locale={locale} nav={nav} />
      <main className="site-main">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
