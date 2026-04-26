/** Stable public asset paths — all commits must reference files that exist under /public. */

export const MEDIA_PATHS = {
  fallbackWide: "/images/hero_tech.png",
  fallbackPortrait: "/images/protofeilnew.jpeg",
  brandMark: "/images/logo.png",
  heroBrandCinematic: "/images/hero_tech.png",
  brandSpotlight: "/images/hero-dark-bg.png",
  portraitHeroFrame: "/images/hero-profile-bg.png",
} as const;

export function isPublicOrRemoteImageSrc(path?: string | null): boolean {
  if (!path?.trim()) return false;
  const p = path.trim();
  return p.startsWith("/") || p.startsWith("https://") || p.startsWith("http://");
}
