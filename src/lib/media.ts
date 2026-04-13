/** Stable public asset paths — all commits must reference files that exist under /public. */

export const MEDIA_PATHS = {
  fallbackWide: "/images/cine-fallback-wide.svg",
  fallbackPortrait: "/images/cine-fallback-portrait.svg",
  brandMark: "/images/2-01.png",
  heroBrandCinematic: "/images/hero-brand-cinematic.png",
  brandSpotlight: "/images/brand-spotlight-premium.png",
  portraitHeroFrame: "/images/portrait-hero-frame.png",
} as const;

export function isPublicOrRemoteImageSrc(path?: string | null): boolean {
  if (!path?.trim()) return false;
  const p = path.trim();
  return p.startsWith("/") || p.startsWith("https://") || p.startsWith("http://");
}
