import { Alexandria, Cairo, Geist_Mono, Instrument_Serif, Manrope } from "next/font/google";

// UI / body face for Latin text. The `--font-inter` variable name is kept
// because the MoPlayer pages and older route CSS read it.
export const interFont = Manrope({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

// Arabic body face. Cairo is variable (200-1000), so real heavy glyphs render
// instead of faux-bold, and one file covers every weight.
export const arabicFont = Cairo({
  subsets: ["arabic"],
  weight: "variable",
  variable: "--font-arabic",
  display: "swap",
  preload: true,
});

// Arabic display face for headings: Alexandria's geometric, open forms give
// Arabic headlines the same calm, engineered tone as the Latin display type
// and pair cleanly with Cairo body copy.
export const arabicDisplayFont = Alexandria({
  subsets: ["arabic"],
  weight: "variable",
  variable: "--font-arabic-display",
  display: "swap",
  preload: false,
});

// Editorial accent: one italic serif word inside Latin headlines.
export const serifAccentFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

// Small technical labels: section indices, metadata, the route motif.
export const monoFont = Geist_Mono({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

export const siteFontClassName = [
  interFont.variable,
  arabicFont.variable,
  arabicDisplayFont.variable,
  serifAccentFont.variable,
  monoFont.variable,
].join(" ");
