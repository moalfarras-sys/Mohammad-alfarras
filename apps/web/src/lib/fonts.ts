import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";

export const interFont = Manrope({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

export const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});

export const siteFontClassName = `${interFont.variable} ${arabicFont.variable}`;
