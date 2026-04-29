import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";

/** Latin body + UI — Manrope: cleaner editorial tone without becoming decorative */
export const interFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

/** Arabic — IBM Plex Sans Arabic: high-fidelity, bilingual-safe, readable at all sizes */
export const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

/** Apply on `<html>` */
export const siteFontClassName = `${interFont.variable} ${arabicFont.variable}`;
