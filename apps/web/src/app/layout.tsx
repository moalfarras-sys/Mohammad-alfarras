import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { ThemeProvider } from "@/components/theme-provider";
import { siteFontClassName } from "@/lib/fonts";

import "./globals.css";

const siteUrl = "https://moalfarras.space";
const siteName = "Mohammad Alfarras Digital OS";
const defaultDescription =
  "Germany-based builder turning logistics discipline into clear web systems, Android TV products (MoPlayer), and Arabic technical storytelling.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mohammad Alfarras Digital OS - Web, MoPlayer, Arabic tech",
    template: "%s | Mohammad Alfarras",
  },
  description: defaultDescription,
  applicationName: "Moalfarras",
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  keywords: [
    "frontend developer germany",
    "arabic web developer",
    "bilingual website",
    "Next.js developer germany",
    "UI designer germany",
    "مطور ويب",
    "مصمم مواقع",
    "تطوير مواقع عربية",
    "Mohammad Alfarras",
    "محمد الفراس",
  ],
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      ar: "/ar",
      "x-default": "/en",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: "Mohammad Alfarras Digital OS - Web, MoPlayer, Arabic tech",
    description: defaultDescription,
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohammad Alfarras Digital OS - Web, MoPlayer, Arabic tech",
    description: defaultDescription,
    creator: "@Moalfarras",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#020510" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const resolvedLocale = requestHeaders.get("x-site-locale") === "ar" ? "ar" : "en";
  const resolvedDir = resolvedLocale === "ar" ? "rtl" : "ltr";

  const rootPersonJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: siteName,
    alternateName: "محمد الفراس",
    url: siteUrl,
    jobTitle: "Web developer, designer, and Arabic tech creator",
    image: `${siteUrl}/images/protofeilnew.jpeg`,
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
      "https://de.linkedin.com/in/mohammad-alfarras-525531262",
      "https://www.instagram.com/moalfarras",
    ],
    knowsLanguage: ["ar", "en", "de"],
    address: { "@type": "PostalAddress", addressCountry: "DE" },
    worksFor: { "@type": "Organization", name: "Freelance" },
  };

  const rootOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Moalfarras",
    url: siteUrl,
    founder: { "@id": `${siteUrl}/#person` },
    logo: `${siteUrl}/images/logo.png`,
    sameAs: ["https://www.youtube.com/@Moalfarras", "https://github.com/moalfarras-sys"],
  };

  const rootWebsiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: ["en", "ar"],
  };

  return (
    <html lang={resolvedLocale} dir={resolvedDir} suppressHydrationWarning className={`liquid-site ${siteFontClassName}`}>
      <head>
        <meta charSet="UTF-8" />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(rootPersonJsonLd) }} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(rootOrgJsonLd) }} />
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(rootWebsiteJsonLd) }} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="moalfarras-theme-ink-blue-amber-v2" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
