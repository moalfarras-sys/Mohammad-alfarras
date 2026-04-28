import type { Metadata } from "next";
import { Cairo, DM_Sans, Syne } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const arabic = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const latin = DM_Sans({
  subsets: ["latin"],
  variable: "--font-latin",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Moalfarras Digital OS — Control Center",
    template: "%s | Moalfarras Admin",
  },
  description:
    "Unified admin: MoPlayer releases, activations, devices — plus quick access to the public site CMS on moalfarras.space.",
  metadataBase: new URL("https://admin.moalfarras.space"),
  applicationName: "Moalfarras Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${arabic.variable} ${latin.variable} ${display.variable}`}>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
