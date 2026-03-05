import type { Metadata } from "next";
import { Tajawal, Poppins } from "next/font/google";

import "./globals.css";

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
  title: "MOALFARRAS App",
  description: "Bilingual web app with admin control",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${tajawal.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}
