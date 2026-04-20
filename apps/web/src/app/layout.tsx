import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Kufi_Arabic, Tajawal } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const arabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const arabicDisplay = Tajawal({
  subsets: ["arabic"],
  variable: "--font-arabic-display",
  weight: ["500", "700", "800"],
  display: "swap",
});

const latin = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const latinDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
  display: "swap",
});

const siteUrl = "https://moalfarras.space";
const siteName = "Mohammad Alfarras";
const defaultDescription =
  "Personal website of Mohammad Alfarras — web development, digital products, interface design, and Arabic tech content, from Germany.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Web developer, designer, Arabic tech creator`,
    template: `%s · ${siteName}`,
  },
  description: defaultDescription,
  applicationName: "Moalfarras",
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  keywords: [
    "Mohammad Alfarras",
    "محمد الفراس",
    "web developer",
    "frontend engineer",
    "Arabic tech",
    "Next.js",
    "product design",
    "MoPlayer",
    "Germany",
    "Al-Hasakah",
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
    title: `${siteName} — Web developer, designer, Arabic tech creator`,
    description: defaultDescription,
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Web developer, designer, Arabic tech creator`,
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
    icon: "/icons/icon.svg",
    shortcut: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#050811" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const rootPersonJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: siteName,
    alternateName: "محمد الفراس",
    url: siteUrl,
    jobTitle: "Web developer, designer, and Arabic tech creator",
    image: `${siteUrl}/images/portrait.jpg`,
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
    logo: `${siteUrl}/images/portrait.jpg`,
    sameAs: [
      "https://www.youtube.com/@Moalfarras",
      "https://github.com/moalfarras-sys",
    ],
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
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${arabic.variable} ${arabicDisplay.variable} ${latin.variable} ${latinDisplay.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootPersonJsonLd) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootOrgJsonLd) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootWebsiteJsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
