import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const arabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const latin = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "محمد الفراس | مطور ويب ومصمم وصانع محتوى تقني من ألمانيا",
    template: "%s | Mohammad Alfarras",
  },
  description:
    "الحضور الرقمي الشخصي لمحمد الفراس: تطوير واجهات، تصميم جريء، ومحتوى تقني عربي من ألمانيا مبني على انضباط التشغيل ودقة التنفيذ.",
  metadataBase: new URL("https://moalfarras.space"),
  applicationName: "Moalfarras",
  icons: {
    icon: "/icons/icon.svg",
    shortcut: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${arabic.variable} ${latin.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
