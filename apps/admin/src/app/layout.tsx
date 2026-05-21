import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";

import { AdminPwaBridge } from "@/components/admin/admin-pwa-bridge";
import { LocaleProvider } from "@/components/admin/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { defaultLocale, isLocale, localeMeta, type Locale } from "@/lib/i18n";

import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const latin = Manrope({
  subsets: ["latin"],
  variable: "--font-latin",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "admin Moalfarras",
    template: "%s | admin Moalfarras",
  },
  description: "Unified control center for moalfarras.space, MoPlayer, and MoPlayer Pro.",
  metadataBase: new URL("https://admin.moalfarras.space"),
  applicationName: "admin Moalfarras",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "admin Moalfarras",
  },
  icons: {
    icon: [{ url: "/images/site-icon.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/images/site-icon.png",
    apple: [{ url: "/images/site-icon.png", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const cookieLocale = store.get("mf_admin_locale")?.value ?? "";
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dir = localeMeta[locale].dir;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={`${arabic.variable} ${latin.variable}`}>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          <LocaleProvider initialLocale={locale}>
            <AdminPwaBridge />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
