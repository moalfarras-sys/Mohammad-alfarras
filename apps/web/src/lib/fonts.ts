import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

/** EN display + body — Plus Jakarta Sans: clean, modern, premium geometric */
export const jakartaFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
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
export const siteFontClassName = `${jakartaFont.variable} ${arabicFont.variable}`;
