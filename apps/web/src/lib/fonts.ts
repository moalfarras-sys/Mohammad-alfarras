import { Cairo, Manrope } from "next/font/google";

export const interFont = Manrope({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

// Arabic is the primary language. Cairo is a variable font spanning 200-1000,
// so the design system's 800-950 heading weights render as REAL glyphs instead
// of the smeared faux-bold the browser synthesized when the old family capped
// at 700 — and one variable file loads faster than four static weights.
export const arabicFont = Cairo({
  subsets: ["arabic"],
  weight: "variable",
  variable: "--font-arabic",
  display: "swap",
  preload: true,
});

export const siteFontClassName = `${interFont.variable} ${arabicFont.variable}`;
