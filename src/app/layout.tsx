import type { Metadata } from "next";
import { headers } from "next/headers";
import { Tajawal, Poppins } from "next/font/google";

import "./globals.css";
import "./pages.css";
import "./admin.css";
import { defaultLocale, localeMeta } from "@/lib/i18n";

const tajawal = Tajawal({
  subsets: ["latin", "arabic"],
  variable: "--font-ar",
  weight: ["400", "500", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-en",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Mohammad Alfarras | Official Website",
    template: "%s | Mohammad Alfarras",
  },
  description: "Official bilingual website for Mohammad Alfarras with tech, logistics, and digital services.",
  metadataBase: new URL("https://www.moalfarras.space"),
  applicationName: "MOALFARRAS",
  keywords: ["Mohammad Alfarras", "alfarras", "moalfarras", "محمد الفراس"],
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-site-locale") === "en" ? "en" : defaultLocale;

  return (
    <html
      lang={locale}
      dir={localeMeta[locale].dir}
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className={`${tajawal.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
