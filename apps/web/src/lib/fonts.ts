import { Alexandria, Cairo, Geist_Mono, Instrument_Serif, Manrope } from "next/font/google";

// UI / body face for Latin text. The `--font-inter` variable name is kept
// because the MoPlayer pages and older route CSS read it.
export const interFont = Manrope({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-inter",
  // Preloaded + "optional" (same strategy as the Arabic display face): a late swap
  // re-wrapped the large v3 headlines and pushed hero media down (CLS 0.28 on /cv).
  // If the file is not ready for first paint the size-adjusted fallback stays for
  // that view and the cached font is used on the next one.
  display: "optional",
  preload: true,
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
// Preloaded with display "optional" and no synthetic fallback: when it is not
// ready for the first paint the headline renders in Cairo (already preloaded)
// and never swaps mid-view, so Arabic headlines cause no layout shift.
export const arabicDisplayFont = Alexandria({
  subsets: ["arabic"],
  weight: "variable",
  variable: "--font-arabic-display",
  display: "optional",
  preload: true,
  adjustFontFallback: false,
});

// Editorial accent: one italic serif word inside Latin headlines.
export const serifAccentFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
  // Same reason: the accent word sits inside every hero headline.
  display: "optional",
  preload: true,
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
