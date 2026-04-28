import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";

/** Latin body + UI — Inter: readable, neutral, pairs cleanly with IBM Plex Arabic */
export const interFont = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
