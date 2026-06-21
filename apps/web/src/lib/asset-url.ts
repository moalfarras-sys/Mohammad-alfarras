export function normalizePublicImagePath(path?: string | null): string {
  if (!path) return "";
  const value = path
    .trim()
    .replace(/\\/g, "/")
    .replace(/^https\/\//i, "https://")
    .replace(/^http\/\//i, "http://");
  if (!value) return "";
  if (value === "/images/moplayer_ui_now_playing.png")
    return "/images/moplayer_ui_now_playing-final.png";
  if (value === "/images/moplayer_ui_playlist.png") return "/images/moplayer_ui_playlist-final.png";
  if (value === "/images/moplayer-tv-banner.png") return "/images/moplayer-tv-banner-final.png";
  if (value === "/images/moplayer-cinema-frame.webp") return "/images/moplayer-hero-3d-final.png";
  if (value.startsWith("images/")) return `/${value}`;
  return value;
}

// Hosts allowed by next.config `remotePatterns` — these CAN be optimized by
// next/image (AVIF/WebP + resize). Keep in sync with next.config.ts.
const OPTIMIZABLE_IMAGE_HOSTS = new Set([
  "ckefrnalgnbuaxsuufyx.supabase.co",
  "xubrjnbolomqrgeutcfw.supabase.co",
  "moalfarras.space",
  "www.moalfarras.space",
]);

/**
 * Value for next/image `unoptimized`: optimize local paths and whitelisted
 * remote hosts (Supabase CMS, our own domain), and skip optimization ONLY for
 * unknown external URLs (which aren't in remotePatterns and would otherwise
 * throw). This lets admin-uploaded CMS images get AVIF/WebP + resizing.
 */
export function unoptimizedImage(src?: string | null): boolean {
  const value = String(src || "");
  if (!value.startsWith("http")) return false;
  try {
    return !OPTIMIZABLE_IMAGE_HOSTS.has(new URL(value).hostname);
  } catch {
    return true;
  }
}
