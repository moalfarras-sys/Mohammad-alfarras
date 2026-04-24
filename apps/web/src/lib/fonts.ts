import { Cairo, DM_Sans, Syne } from "next/font/google";

export const displayFont = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display-syne",
  display: "swap",
});

export const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const arabicFont = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

/** Apply on `<html>`: Syne (display), DM Sans (body), Cairo (Arabic). */
export const siteFontClassName = `${displayFont.variable} ${bodyFont.variable} ${arabicFont.variable}`;
