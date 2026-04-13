import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, JetBrains_Mono, Syne } from "next/font/google";

import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const brand = Syne({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["500", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
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
    <html lang="ar" suppressHydrationWarning className={`${arabic.variable} ${brand.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
