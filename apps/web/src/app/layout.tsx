import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { siteFontClassName } from "@/lib/fonts";

import "./globals.css";

const siteUrl = "https://moalfarras.space";
const siteName = "Mohammad Alfarras";
const defaultDescription =
  "Germany-based builder of production-grade digital presence, interface systems, Android media product surfaces, and Arabic technical storytelling.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mohammad Alfarras — Interfaces, products, and Arabic tech storytelling",
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
    title: "Mohammad Alfarras — Interfaces, products, and Arabic tech storytelling",
    description: defaultDescription,
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohammad Alfarras — Interfaces, products, and Arabic tech storytelling",
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
      className={`${siteFontClassName}`}
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
