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
  // Arabic is the primary language: load real bold weights so headings (700+)
  // render with true glyphs instead of smeared browser faux-bold.
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
  preload: true,
});

export const siteFontClassName = `${interFont.variable} ${arabicFont.variable}`;
