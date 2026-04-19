import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";

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
    default: "Mohammad Alfarras | Web developer, designer, and Arabic tech creator",
    template: "%s | Mohammad Alfarras",
  },
  description:
    "Personal website for Mohammad Alfarras covering web development, digital products, interface design, and Arabic tech content.",
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
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${arabic.variable} ${latin.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
